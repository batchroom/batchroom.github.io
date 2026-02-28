import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("APP JS FILE LOADED");

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

let allBatches = [];

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM READY");

    const createBtn = document.getElementById("createBatchBtn");
    const batchInput = document.getElementById("batchName");
    const batchList = document.getElementById("batchList");

    if(!createBtn) {
        console.error("Button not found in HTML");
        return;
    }

    // Wrap in container
    const container = document.createElement("div");
    container.className = "container";
    document.body.appendChild(container);

    // replace that region with a richer header + controls
    container.appendChild(document.querySelector("h2")); // Create Batch
    // create a small controls row
    const controls = document.createElement("div");
    controls.className = "batch-controls";

    // Batch name input (move existing input)
    controls.appendChild(document.querySelector("input#batchName"));

    // Create extra UI: search + sort
    const searchInput = document.createElement("input");
    searchInput.id = "searchBatch";
    searchInput.placeholder = "Search batches...";
    searchInput.className = "search-input";
    controls.appendChild(searchInput);

    const sortBtn = document.createElement("button");
    sortBtn.id = "sortBtn";
    sortBtn.textContent = "Sort A→Z";
    controls.appendChild(sortBtn);

    controls.appendChild(createBtn);
    container.appendChild(controls);

    container.appendChild(document.querySelectorAll("h2")[1]); // All Batches
    container.appendChild(batchList);

    // LOGIN BUTTON (unchanged)
    const loginBtn = document.createElement("button");
    loginBtn.id = "loginBtn";
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
            batchList.innerHTML = '<div class="empty-state">Sign in to view batches</div>';
        }
    });

    // Allow Enter to create batch
    batchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") createBtn.click();
    });

    // CREATE BATCH (unchanged behavior, only small enhancement: disable during create)
    createBtn.onclick = async () => {
        console.log("CLICKED CREATE");
        const name = batchInput.value.trim();
        if (!name) return alert("Enter batch name");

        createBtn.disabled = true;
        await addDoc(collection(db, "batches"), {
            name: name,
            createdAt: new Date()
        });
        createBtn.disabled = false;

        batchInput.value = "";
        loadBatches();
    };

    // sort state
    let sortAsc = true;
    sortBtn.onclick = () => {
        sortAsc = !sortAsc;
        sortBtn.textContent = sortAsc ? "Sort A→Z" : "Sort Z→A";
        renderBatches(allBatches);
    };

    // search filter
    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        const filtered = allBatches.filter(b => b.name.toLowerCase().includes(q));
        renderBatches(filtered);
    });

    // LOAD BATCHES with skeleton
    async function loadBatches() {
        console.log("Loading batches...");

        // skeleton placeholders
        batchList.innerHTML = "";
        for (let i = 0; i < 6; i++) {
            const s = document.createElement("li");
            s.className = "skeleton";
            s.innerHTML = `<div class="skeleton-line short"></div><div class="skeleton-line"></div>`;
            batchList.appendChild(s);
        }

        const snapshot = await getDocs(collection(db, "batches"));
        allBatches = [];
        batchList.innerHTML = "";

        snapshot.forEach(doc => {
            allBatches.push({ id: doc.id, name: doc.data().name || "Untitled" });
        });

        if (allBatches.length === 0) {
            batchList.innerHTML = '<div class="empty-state">No batches yet. Create one to get started!</div>';
            return;
        }

        renderBatches(allBatches);
    }

    function renderBatches(batches) {
        // sort
        batches.sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
        batchList.innerHTML = "";

        batches.forEach((batch, idx) => {
            const li = document.createElement("li");
            li.className = "batch-card";
            const badge = `<span class="badge" aria-hidden="true">${String.fromCodePoint(0x1F3EB + (idx % 8))}</span>`;
            li.innerHTML = `
                <div class="card-left">
                  ${badge}
                  <div class="batch-item-text">${escapeHtml(batch.name)}</div>
                </div>
                <div class="card-right">
                  <button class="batch-delete">Delete</button>
                </div>
            `;

            // tilt effect
            li.addEventListener("mousemove", (ev) => {
                const rect = li.getBoundingClientRect();
                const x = ev.clientX - rect.left - rect.width / 2;
                const y = ev.clientY - rect.top - rect.height / 2;
                li.style.transform = `rotateX(${(-y/20)}deg) rotateY(${x/30}deg) translateZ(6px)`;
            });
            li.addEventListener("mouseleave", () => {
                li.style.transform = "";
            });

            li.addEventListener("click", (e) => {
                if (e.target.classList.contains("batch-delete")) {
                    e.stopPropagation();
                    deleteBatch(batch.id);
                } else {
                    openBatch(batch.id, batch.name);
                }
            });

            batchList.appendChild(li);
        });
    }

    async function deleteBatch(batchId) {
        if (confirm("Delete this batch?")) {
            await deleteDoc(doc(db, "batches", batchId));
            loadBatches();
        }
    }

    function openBatch(batchId, batchName) {
        localStorage.setItem("currentBatchId", batchId);
        localStorage.setItem("currentBatchName", batchName);
        location.href = "batch.html";
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // initial load
    loadBatches();
});
