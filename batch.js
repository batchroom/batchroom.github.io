import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    setDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBcH_pCf0uXlSd9OF89K8Jm_n7ymYMknH8",
    authDomain: "batch-timeline.firebaseapp.com",
    projectId: "batch-timeline",
    storageBucket: "batch-timeline.firebasestorage.app",
    messagingSenderId: "101195337997",
    appId: "1:101195337997:web:a68d45acee5ab0fce96044"
};

import { auth, db, provider, signInWithPopup, onAuthStateChanged } from "./firebase.js";

const title = document.getElementById("batchTitle");
const input = document.getElementById("messageInput");
const postBtn = document.getElementById("postBtn");
const list = document.getElementById("messageList");
const peopleList = document.getElementById("peopleList");

const batchId = localStorage.getItem("currentBatchId");
const batchName = localStorage.getItem("currentBatchName");

title.textContent = batchName || "Memory Wall";

/* State for listeners and initialization */
let unsubMessages = null;
let unsubPeople = null;
let unsubDay = null;
let initialized = false;

/* --- AUTH + SAFE REDIRECT --- */
/* Wait for auth to be ready. If no user or no batchId we redirect to index.html.
   Only after we have a signed-in user AND batchId do we initialize the batch page. */
onAuthStateChanged(auth, user => {
    if (!user) {
        // no user signed in — redirect to index (preserves app stability)
        location.href = "index.html";
        return;
    }

    if (!batchId) {
        // no batch selected — redirect home
        location.href = "index.html";
        return;
    }

    // Initialize only once
    if (!initialized) {
        initialized = true;
        initBatch(user);
    }
});

/* --- ENTRY POINT --- */
function initBatch(user) {
    loadMessages();
    loadPeople();
    loadOnThisDay();
    showUserIdentity(user);

    // Wire up UI actions that require auth/batch context
    postBtn.onclick = onPost;
    document.getElementById("saveProfileBtn").onclick = onSaveProfile;
}

/* --- TOAST HELPER (non-blocking notifications) --- */
function toast(message) {
    const container = document.getElementById("toastContainer") || document.body;
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = message;
    container.appendChild(t);
    // trigger CSS animation via class (styles are in style.css)
    requestAnimationFrame(() => t.classList.add("visible"));
    setTimeout(() => {
        t.classList.remove("visible");
        // allow animation out before removing
        setTimeout(() => t.remove(), 300);
    }, 2000);
}

/* --- USER IDENTITY DISPLAY --- */
function showUserIdentity(user) {
    const el = document.getElementById("userIdentity");
    if (!el) return;
    const name = (user && (user.displayName || user.email)) || "Someone";
    el.textContent = `You are here as ${name}`;
}

/* --- POST HANDLER --- */
async function onPost() {
    const text = input.value.trim();
    if (!text) return; // silently ignore empty posts

    const user = auth.currentUser;
    const anonymous = document.getElementById("anonymousToggle").checked;

    try {
        await addDoc(collection(db, "batches", batchId, "messages"), {
            text,
            author: anonymous ? "Someone 👀" : (user.displayName || "Someone"),
            createdAt: serverTimestamp()
        });
        input.value = "";
        toast("Memory saved");
    } catch (e) {
        console.error("Failed to post", e);
        toast("Couldn't save memory — try again");
    }
}

/* --- PROFILE SAVE HANDLER --- */
async function onSaveProfile() {
    const user = auth.currentUser;
    if (!user) return toast("You must be signed in");

    try {
        await setDoc(doc(db, "batches", batchId, "people", user.uid), {
            name: user.displayName,
            city: document.getElementById("currentCity").value,
            work: document.getElementById("currentWork").value
        });
        toast("Profile updated");
    } catch (e) {
        console.error("Failed to save profile", e);
        toast("Couldn't save profile");
    }
}

/* --- MESSAGES: incremental, smooth updates --- */
function createMessageElement(docId, data) {
    const li = document.createElement("li");
    li.dataset.id = docId;
    li.id = `msg-${docId}`;

    const wrapper = document.createElement("div");

    const author = document.createElement("b");
    author.textContent = data.author || "Someone";
    wrapper.appendChild(author);

    const textDiv = document.createElement("div");
    textDiv.textContent = data.text || "";
    wrapper.appendChild(textDiv);

    const small = document.createElement("small");
    const d = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
    small.textContent = timeAgo(d);
    wrapper.appendChild(small);

    li.appendChild(wrapper);
    return li;
}

function updateMessageElement(docId, data) {
    const li = document.getElementById(`msg-${docId}`);
    if (!li) return;
    const b = li.querySelector("b");
    const textDiv = li.querySelector("div > div");
    const small = li.querySelector("small");
    if (b) b.textContent = data.author || "Someone";
    if (textDiv) textDiv.textContent = data.text || "";
    if (small) {
        const d = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
        small.textContent = timeAgo(d);
    }
}

function loadMessages() {
    if (unsubMessages) return; // already attached

    const q = query(collection(db, "batches", batchId, "messages"), orderBy("createdAt", "asc"));

    unsubMessages = onSnapshot(q, snapshot => {
        // decide whether to auto-scroll: only auto-scroll if user is near bottom
        const nearBottom = (list.scrollHeight - list.clientHeight - list.scrollTop) < 120;

        snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const data = doc.data();

            if (change.type === "added") {
                // avoid duplicate
                if (document.getElementById(`msg-${doc.id}`)) return;

                const li = createMessageElement(doc.id, data);
                // insert at the correct position using newIndex
                const refNode = list.children[change.newIndex] || null;
                list.insertBefore(li, refNode);
            } else if (change.type === "modified") {
                updateMessageElement(doc.id, data);
            } else if (change.type === "removed") {
                const existing = document.getElementById(`msg-${doc.id}`);
                if (existing) existing.remove();
            }
        });

        // If list empty -> show empty state
        const emptyEl = document.getElementById("messagesEmpty");
        if (list.children.length === 0) {
            if (emptyEl) emptyEl.classList.remove("visually-hidden");
        } else {
            if (emptyEl) emptyEl.classList.add("visually-hidden");
        }

        // Auto-scroll if the user was near bottom
        if (nearBottom) {
            list.scrollTop = list.scrollHeight;
        }
    });
}

/* --- PEOPLE: single listener, simple rendering --- */
function loadPeople() {
    if (unsubPeople) return;

    unsubPeople = onSnapshot(collection(db, "batches", batchId, "people"), snap => {
        // simple re-render: people list is small and changes are infrequent
        peopleList.innerHTML = "";
        snap.forEach(d => {
            const p = d.data();
            const li = document.createElement("li");
            li.textContent = `${p.name || "Someone"} — ${p.city || "—"} — ${p.work || "—"}`;
            peopleList.appendChild(li);
        });
    });
}

/* --- ON THIS DAY: single listener --- */
function loadOnThisDay() {
    if (unsubDay) return;

    const today = new Date();
    const list2 = document.getElementById("onThisDayList");

    unsubDay = onSnapshot(collection(db, "batches", batchId, "messages"), snap => {
        // Rebuild filtered list for "on this day" — small and occasional
        list2.innerHTML = "";

        snap.forEach(d => {
            const data = d.data();
            if (!data.createdAt) return;

            const dt = data.createdAt.toDate();
            if (dt.getDate() === today.getDate() && dt.getMonth() === today.getMonth() && dt.getFullYear() !== today.getFullYear()) {
                const years = today.getFullYear() - dt.getFullYear();
                const li = document.createElement("li");
                li.textContent = `${years} yrs ago — ${data.author}: ${data.text}`;
                list2.appendChild(li);
            }
        });
    });
}

/* TIME AGO (unchanged) */
function timeAgo(date) {
    const s = Math.floor((Date.now() - date) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
}

/* Optional: cleanup when user leaves (unsubscribe listeners) */
window.addEventListener("beforeunload", () => {
    if (unsubMessages) unsubMessages();
    if (unsubPeople) unsubPeople();
    if (unsubDay) unsubDay();
});
