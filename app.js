import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginBtn = document.getElementById("loginBtn");

const createBtn = document.getElementById("createBatchBtn");
const batchInput = document.getElementById("batchName");
const batchList = document.getElementById("batchList");


// LOGIN
loginBtn.onclick = () => signInWithPopup(auth, provider);


// AUTH STATE
onAuthStateChanged(auth, user => {
    if (user) {
        loginSection.style.display = "none";
        appSection.style.display = "block";
        loadBatches();
    } else {
        loginSection.style.display = "block";
        appSection.style.display = "none";
    }
});


// CREATE BATCH
createBtn.onclick = async () => {
    const name = batchInput.value.trim();
    if (!name) return alert("Enter batch name");

    await addDoc(collection(db, "batches"), {
        name: name,
        owner: auth.currentUser.uid,
        createdAt: new Date()
    });

    batchInput.value = "";
    loadBatches();
};


// LOAD BATCHES
async function loadBatches() {
    batchList.innerHTML = "Loading...";

    const snapshot = await getDocs(collection(db, "batches"));
    batchList.innerHTML = "";

    snapshot.forEach(d => {
        const data = d.data();

        const li = document.createElement("li");

        li.innerHTML = `
            <span style="cursor:pointer">${data.name}</span>
            ${data.owner === auth.currentUser.uid ? '<button class="deleteBtn">Delete</button>' : ''}
        `;

        li.querySelector("span").onclick = () => openBatch(d.id, data.name);

        const del = li.querySelector(".deleteBtn");
        if (del) {
            del.onclick = () => deleteBatch(d.id);
        }

        batchList.appendChild(li);
    });
}


// DELETE ONLY OWNER CAN SEE BUTTON
async function deleteBatch(id) {
    if (!confirm("Delete batch?")) return;
    await deleteDoc(doc(db, "batches", id));
    loadBatches();
}


// OPEN BATCH
function openBatch(id, name) {
    localStorage.setItem("currentBatchId", id);
    localStorage.setItem("currentBatchName", name);
    location.href = "batch.html";
}