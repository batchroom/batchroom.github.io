import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  waitForAuth
} from "./firebase.js";

/* ---------------- UI ---------------- */
const title = document.getElementById("batchTitle");
const input = document.getElementById("messageInput");
const postBtn = document.getElementById("postBtn");
const list = document.getElementById("messageList");
const peopleList = document.getElementById("peopleList");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const userIdentity = document.getElementById("userIdentity");
const toastContainer = document.getElementById("toastContainer");

/* ---------------- STATE ---------------- */
let batchId = null;
let batchName = null;
let userReady = false;
let currentUser = null;

// store unsubscribers to avoid multiple listeners
const unsubs = [];

function showToast(text, opts = {}) {
  if (!toastContainer) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  toastContainer.appendChild(t);
  // show
  requestAnimationFrame(() => t.classList.add("visible"));
  const ttl = opts.ttl || 3500;
  setTimeout(() => {
    t.classList.remove("visible");
    setTimeout(() => t.remove(), 300);
  }, ttl);
}

function safeEscape(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function cleanupListeners() {
  while (unsubs.length) {
    try { const u = unsubs.pop(); if (typeof u === 'function') u(); } catch (e) { console.warn('unsub err', e); }
  }
}

async function initForUser(user) {
  if (!user) {
    showToast('Not signed in — redirecting to home');
    location.href = 'index.html';
    return;
  }

  currentUser = user;
  userReady = true;

  batchId = localStorage.getItem('currentBatchId');
  batchName = localStorage.getItem('currentBatchName');

  if (!batchId) {
    alert('Batch not found. Open from homepage.');
    location.href = 'index.html';
    return;
  }

  if (title) title.textContent = batchName || 'Batch';
  if (userIdentity) userIdentity.textContent = `Signed in as ${user.displayName || user.email || 'user'}`;

  // ensure we clean old listeners before attaching
  cleanupListeners();

  loadMessages();
  loadPeople();
  loadOnThisDay();
}

// Wait for initial auth readiness (ensures direct page loads work)
waitForAuth(5000).then(user => {
  if (user) {
    initForUser(user);
  } else {
    // still attach an onAuthStateChanged to catch later sign-in
    const unsubAuth = onAuthStateChanged(auth, (user2) => {
      if (user2) initForUser(user2);
    });
    unsubs.push(unsubAuth);
  }
});

// Additionally keep an auth listener to update identity label on changes
const unsubAuthLive = onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    // not signed in
    userReady = false;
    // don't force redirect here if already handled
    if (userIdentity) userIdentity.textContent = '';
  }
});
unsubs.push(unsubAuthLive);

/* ---------------- POST MESSAGE ---------------- */
let postLock = false;
postBtn?.addEventListener('click', async () => {
  if (!userReady || !currentUser) return showToast('Please sign in to post');
  if (!batchId) return showToast('Batch missing — return to home');

  const text = (input?.value || '').trim();
  if (!text) return;
  if (postLock) return showToast('Posting…');

  postLock = true;
  postBtn.disabled = true;

  try {
    const anonymous = document.getElementById('anonymousToggle')?.checked;
    await addDoc(collection(db, 'batches', batchId, 'messages'), {
      text: text,
      author: anonymous ? 'Someone 👀' : (currentUser.displayName || 'Someone'),
      createdAt: serverTimestamp()
    });

    input.value = '';
    showToast('Memory saved');
  } catch (e) {
    console.error(e);
    showToast('Failed to post memory');
  }

  postLock = false;
  postBtn.disabled = false;
});

// allow Enter key from textarea (Shift+Enter for newline)
input?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    postBtn?.click();
  }
});

/* ---------------- LOAD MESSAGES ---------------- */
function loadMessages() {
  if (!batchId) return;

  const q = query(
    collection(db, 'batches', batchId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  const unsub = onSnapshot(q, snapshot => {
    if (!list) return;
    list.innerHTML = '';

    if (snapshot.empty) {
      const empty = document.getElementById('messagesEmpty');
      if (empty) empty.classList.remove('visually-hidden');
      return;
    } else {
      const empty = document.getElementById('messagesEmpty');
      if (empty) empty.classList.add('visually-hidden');
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data() || {};

      const li = document.createElement('li');
      li.className = 'message-card';

      let date = data.createdAt?.toDate?.() || new Date();
      const time = date.toLocaleString();

      li.innerHTML = `
        <div class="message-content">
          <div class="message-author">${safeEscape(data.author || 'Someone')}</div>
          <div class="message-text">${safeEscape(data.text || '')}</div>
          <div class="message-time">${safeEscape(time)}</div>
        </div>
      `;

      list.appendChild(li);
    });
  }, (err) => {
    console.error('messages snapshot error', err);
    showToast('Connection issue — retrying');
  });

  unsubs.push(unsub);
}

/* ---------------- PEOPLE STATUS ---------------- */
saveProfileBtn?.addEventListener('click', async () => {
  if (!currentUser || !batchId) return showToast('Sign in to update profile');

  try {
    await setDoc(doc(db, 'batches', batchId, 'people', currentUser.uid), {
      name: currentUser.displayName || currentUser.email || 'Anonymous',
      city: document.getElementById('currentCity')?.value || '',
      work: document.getElementById('currentWork')?.value || ''
    });

    showToast('Profile updated');
  } catch (e) {
    console.error(e);
    showToast('Failed to update profile');
  }
});

function loadPeople() {
  if (!batchId) return;

  const peopleRef = collection(db, 'batches', batchId, 'people');

  const unsub = onSnapshot(peopleRef, snapshot => {
    if (!peopleList) return;
    peopleList.innerHTML = '';

    snapshot.forEach(docSnap => {
      const p = docSnap.data() || {};

      const li = document.createElement('li');
      li.innerHTML = `<b>${safeEscape(p.name || '')}</b> — ${safeEscape(p.city || '-') } — ${safeEscape(p.work || '-')}`;

      peopleList.appendChild(li);
    });
  }, (err) => {
    console.error('people snapshot error', err);
  });

  unsubs.push(unsub);
}

/* ---------------- ON THIS DAY ---------------- */
function loadOnThisDay() {
  if (!batchId) return;

  const today = new Date();

  const unsub = onSnapshot(collection(db, 'batches', batchId, 'messages'), snapshot => {
    const elm = document.getElementById('onThisDayList');
    if (!elm) return;
    elm.innerHTML = '';

    snapshot.forEach(docSnap => {
      const data = docSnap.data() || {};
      if (!data.createdAt) return;

      const d = data.createdAt.toDate ? data.createdAt.toDate() : new Date();

      if (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() !== today.getFullYear()
      ) {
        const li = document.createElement('li');
        li.innerHTML = `🕰 ${today.getFullYear() - d.getFullYear()} yrs ago — <b>${safeEscape(data.author || '')}</b>: ${safeEscape(data.text || '')}`;
        elm.appendChild(li);
      }
    });
  }, (err) => {
    console.error('onThisDay snapshot error', err);
  });

  unsubs.push(unsub);
}

/* ---------------- CLEANUP on unload (avoid leaks) ---------------- */
window.addEventListener('beforeunload', cleanupListeners);
window.addEventListener('pagehide', cleanupListeners);

/* ---------------- UTIL ---------------- */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}