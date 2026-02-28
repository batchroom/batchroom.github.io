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
    author: anonymous ? "Someone 👀" : user.displayName,
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
            const date = data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt);

            const time = date.toLocaleString();

            li.innerHTML = `
              <div style="padding:8px; margin:8px 0; border-left:3px solid #4CAF50;">
                <div><b>${data.author}</b></div>
                <div style="margin:4px 0">${data.text}</div>
                <small style="color:gray">${time}</small>
              </div>
            `;

            list.appendChild(li);
        });

    });
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