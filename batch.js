import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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

// Firebase config
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

// UI
const title = document.getElementById("batchTitle");
const input = document.getElementById("messageInput");
const postBtn = document.getElementById("postBtn");
const list = document.getElementById("messageList");

const batchId = localStorage.getItem("currentBatchId");
const batchName = localStorage.getItem("currentBatchName");

// If user opened page directly
if (!batchId) {
    alert("No batch selected");
    location.href = "index.html";
}

title.textContent = batchName;


// Require login
onAuthStateChanged(auth, user => {
    if (!user) {
        alert("Please login first");
        location.href = "index.html";
    } else {
        loadMessages();
    }
});

// Post memory
postBtn.onclick = async () => {

    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    const anonymous = document.getElementById("anonymousToggle").checked;

    await addDoc(collection(db, "batches", batchId, "messages"), {
        text: text,
        author: anonymous ? "Someone 👀" : (user.displayName || "Someone"),
        createdAt: serverTimestamp()
    });

    input.value = "";
};

// Load messages
function loadMessages() {

    list.innerHTML = "";

    const q = query(
        collection(db, "batches", batchId, "messages"),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, snapshot => {

        list.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();

            const li = document.createElement("li");
            li.className = "message-card";

            // robust timestamp handling
            let date;
            if (!data.createdAt) date = new Date();
            else if (data.createdAt.toDate) date = data.createdAt.toDate();
            else date = new Date(data.createdAt);

            const timeAgoText = timeAgo(date);

            li.innerHTML = `
              <div class="message-content">
                <div class="message-author">${escapeHtml(data.author || "Someone")}</div>
                <div class="message-text">${escapeHtml(data.text)}</div>
                <div class="message-time">${timeAgoText}</div>
              </div>
            `;

            // animate incoming
            li.classList.add("pop-in");
            list.appendChild(li);
        });

    });
}

// small helpers
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
        { label: 'yr', secs: 31536000 },
        { label: 'mo', secs: 2592000 },
        { label: 'd', secs: 86400 },
        { label: 'h', secs: 3600 },
        { label: 'm', secs: 60 },
        { label: 's', secs: 1 }
    ];
    for (const i of intervals) {
        const cnt = Math.floor(seconds / i.secs);
        if (cnt >= 1) return `${cnt}${i.label} ago`;
    }
    return "just now";
}

const saveProfileBtn = document.getElementById("saveProfileBtn");
const peopleList = document.getElementById("peopleList");

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

        snapshot.forEach(doc => {
            const p = doc.data();

            const li = document.createElement("li");
            li.innerHTML = `<b>${p.name}</b> — ${p.city} — ${p.work}`;

            peopleList.appendChild(li);
        });

    });
}

onAuthStateChanged(auth, user => {
    if (user) loadPeople();
});

import { where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function loadOnThisDay() {

    const today = new Date();
    const month = today.getMonth();
    const date = today.getDate();

    const q = collection(db, "batches", batchId, "messages");

    onSnapshot(q, snapshot => {

        const list = document.getElementById("onThisDayList");
        list.innerHTML = "";

        snapshot.forEach(doc => {

            const data = doc.data();
            if (!data.createdAt) return;

            const d = data.createdAt.toDate();

            if (d.getMonth() === month && d.getDate() === date && d.getFullYear() !== today.getFullYear()) {

                const yearsAgo = today.getFullYear() - d.getFullYear();

                const li = document.createElement("li");
                li.innerHTML = `🕰 ${yearsAgo} yrs ago — <b>${data.author}</b>: ${data.text}`;
                list.appendChild(li);
            }

        });

    });
}

onAuthStateChanged(auth, user => {
    if (user) loadOnThisDay();
});