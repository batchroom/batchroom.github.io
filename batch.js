import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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

/* ---------------- CONFIG ---------------- */

const firebaseConfig = {
    apiKey: "AIzaSyBcH_pCf0uXlSd9OF89K8Jm_n7ymYMknH8",
    authDomain: "batch-timeline.firebaseapp.com",
    projectId: "batch-timeline",
    storageBucket: "batch-timeline.firebasestorage.app",
    messagingSenderId: "101195337997",
    appId: "1:101195337997:web:a68d45acee5ab0fce96044"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------- UI ---------------- */

const title = document.getElementById("batchTitle");
const input = document.getElementById("messageInput");
const postBtn = document.getElementById("postBtn");
const list = document.getElementById("messageList");
const peopleList = document.getElementById("peopleList");
const saveProfileBtn = document.getElementById("saveProfileBtn");

/* ---------------- STATE ---------------- */

let batchId = null;
let batchName = null;
let userReady = false;

/* ---------------- AUTH FIRST (CRITICAL FIX) ---------------- */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        alert("Please login first");
        location.href = "index.html";
        return;
    }

    userReady = true;

    // restore batch safely AFTER auth
    batchId = localStorage.getItem("currentBatchId");
    batchName = localStorage.getItem("currentBatchName");

    if (!batchId) {
        alert("Batch not found. Open from homepage.");
        location.href = "index.html";
        return;
    }

    title.textContent = batchName || "Batch";

    loadMessages();
    loadPeople();
    loadOnThisDay();
});

/* ---------------- POST MESSAGE ---------------- */

postBtn.onclick = async () => {

    if (!userReady) return;

    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    const anonymous = document.getElementById("anonymousToggle").checked;

    await addDoc(collection(db, "batches", batchId, "messages"), {
        text,
        author: anonymous ? "Someone 👀" : (user.displayName || "Someone"),
        createdAt: serverTimestamp()
    });

    input.value = "";
};

/* ---------------- LOAD MESSAGES ---------------- */

function loadMessages() {

    const q = query(
        collection(db, "batches", batchId, "messages"),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, snapshot => {

        list.innerHTML = "";

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            const li = document.createElement("li");
            li.className = "message-card";

            let date = data.createdAt?.toDate?.() || new Date();
            const time = date.toLocaleString();

            li.innerHTML = `
              <div class="message-content">
                <div class="message-author">${escapeHtml(data.author || "Someone")}</div>
                <div class="message-text">${escapeHtml(data.text)}</div>
                <div class="message-time">${time}</div>
              </div>
            `;

            list.appendChild(li);
        });
    });
}

/* ---------------- PEOPLE STATUS ---------------- */

saveProfileBtn.onclick = async () => {

    const user = auth.currentUser;

    await setDoc(doc(db, "batches", batchId, "people", user.uid), {
        name: user.displayName,
        city: document.getElementById("currentCity").value,
        work: document.getElementById("currentWork").value
    });

    alert("Saved!");
};

function loadPeople() {

    const peopleRef = collection(db, "batches", batchId, "people");

    onSnapshot(peopleRef, snapshot => {

        peopleList.innerHTML = "";

        snapshot.forEach(docSnap => {
            const p = docSnap.data();

            const li = document.createElement("li");
            li.innerHTML = `<b>${p.name}</b> — ${p.city || "-"} — ${p.work || "-"}`;

            peopleList.appendChild(li);
        });
    });
}

/* ---------------- ON THIS DAY ---------------- */

function loadOnThisDay() {

    const today = new Date();

    onSnapshot(collection(db, "batches", batchId, "messages"), snapshot => {

        const list = document.getElementById("onThisDayList");
        list.innerHTML = "";

        snapshot.forEach(docSnap => {

            const data = docSnap.data();
            if (!data.createdAt) return;

            const d = data.createdAt.toDate();

            if (
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() !== today.getFullYear()
            ) {
                const li = document.createElement("li");
                li.innerHTML = `🕰 ${today.getFullYear() - d.getFullYear()} yrs ago — <b>${data.author}</b>: ${data.text}`;
                list.appendChild(li);
            }
        });
    });
}

/* ---------------- UTIL ---------------- */

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}