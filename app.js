import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("APP JS FILE LOADED");

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
const provider = new GoogleAuthProvider();


// 🔥 WAIT FOR PAGE LOAD
window.addEventListener("DOMContentLoaded", () => {

    console.log("DOM READY");

    const createBtn = document.getElementById("createBatchBtn");
    const batchInput = document.getElementById("batchName");
    const batchList = document.getElementById("batchList");

    if(!createBtn) {
        console.error("Button not found in HTML");
        return;
    }

    // LOGIN CHECK
    const loginBtn = document.createElement("button");
    loginBtn.textContent = "Login with Google";
    document.body.prepend(loginBtn);

    loginBtn.onclick = () => {
        signInWithPopup(auth, provider);
    };

    onAuthStateChanged(auth, user => {
        if (user) {
            console.log("Logged in:", user.email);
            loginBtn.style.display = "none";
            loadBatches();
        } else {
            loginBtn.style.display = "block";
        }
    });

    // CREATE BATCH
    createBtn.onclick = async () => {
        console.log("CLICKED CREATE");

        const name = batchInput.value.trim();
        if (!name) return alert("Enter batch name");

        await addDoc(collection(db, "batches"), {
            name: name,
            createdAt: new Date()
        });

        batchInput.value = "";
        loadBatches();
    };

    // LOAD BATCHES
    async function loadBatches() {
        console.log("Loading batches...");

        const snapshot = await getDocs(collection(db, "batches"));
        batchList.innerHTML = "";

        snapshot.forEach(doc => {
            const li = document.createElement("li");
            li.textContent = doc.data().name;
            li.style.cursor = "pointer";
            li.onclick = () => openBatch(doc.id, doc.data().name);
            batchList.appendChild(li);
        });
    }

    function openBatch(batchId, batchName) {
        localStorage.setItem("currentBatchId", batchId);
        localStorage.setItem("currentBatchName", batchName);
        location.href = "batch.html";
    }

});