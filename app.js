// app.js — main page logic (batches list)
// GitHub Pages compatible
// Secure batch ownership support

import {
    auth,
    db,
    provider,
    signInWithPopup,
    onAuthStateChanged,
    waitForAuth,
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from "./firebase.js";

import {
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", async () => {
    console.log("APP READY");

    const loginBtn = document.getElementById("loginBtn");
    const loginSection = document.getElementById("loginSection");
    const appSection = document.getElementById("appSection");
    const createBtn = document.getElementById("createBatchBtn");
    const batchInput = document.getElementById("batchName");
    const batchList = document.getElementById("batchList");

    let allBatches = [];
    let currentUser = null;

    // ---------------- LOGIN ----------------
    loginBtn?.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error(err);
            alert("Popup blocked or domain not authorized");
        }
    });

    // Ensure auth is ready
    await waitForAuth(5000);

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            loginSection && (loginSection.style.display = "none");
            appSection && (appSection.style.display = "block");
            loginBtn && (loginBtn.style.display = "none");
            loadBatches();
        } else {
            currentUser = null;
            loginSection && (loginSection.style.display = "block");
            appSection && (appSection.style.display = "none");
            loginBtn && (loginBtn.style.display = "block");
            if (batchList) {
                batchList.innerHTML = '<div class="empty-state">Sign in to view batches</div>';
            }
        }
    });

    // Allow Enter key
    batchInput?.addEventListener("keydown", e => {
        if (e.key === "Enter") createBtn.click();
    });

    // ---------------- CREATE BATCH ----------------
    createBtn?.addEventListener("click", async () => {
        if (!currentUser) return alert("Sign in first");

        const name = batchInput.value.trim();
        if (!name) return alert("Enter batch name");

        if (name.length > 100) {
            return alert("Batch name too long (max 100 characters)");
        }

        createBtn.disabled = true;

        try {
            await addDoc(collection(db, "batches"), {
                name,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                createdByEmail: currentUser.email
            });

            batchInput.value = "";
            await loadBatches();
        } catch (e) {
            console.error(e);
            alert("Failed to create batch");
        }

        createBtn.disabled = false;
    });

    // ---------------- LOAD BATCHES ----------------
    async function loadBatches() {
        if (!batchList) return;

        batchList.innerHTML = "<div class='empty-state'>Loading...</div>";

        try {
            const snapshot = await getDocs(collection(db, "batches"));

            allBatches = [];

            snapshot.forEach(d => {
                const data = d.data();
                allBatches.push({
                    id: d.id,
                    name: data.name || "Untitled",
                    createdBy: data.createdBy || null
                });
            });

            if (!allBatches.length) {
                batchList.innerHTML = '<div class="empty-state">No batches yet</div>';
                return;
            }

            renderBatches(allBatches);
        } catch (e) {
            console.error("Failed to load batches", e);
            batchList.innerHTML = '<div class="empty-state">Failed to load batches</div>';
        }
    }

    // ---------------- RENDER ----------------
    function renderBatches(batches) {
        batchList.innerHTML = "";

        batches.sort((a, b) => a.name.localeCompare(b.name));

        batches.forEach(batch => {
            const li = document.createElement("li");
            li.className = "batch-card";

            const isOwner = currentUser && batch.createdBy === currentUser.uid;

            li.innerHTML = `
        <div class="card-left">
          <div class="batch-item-text">${escapeHtml(batch.name)}</div>
        </div>
        <div class="card-right">
          ${isOwner ? '<button class="batch-delete">Delete</button>' : ''}
        </div>
      `;

            li.addEventListener("click", e => {
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

    // ---------------- DELETE ----------------
    async function deleteBatch(id) {
        if (!currentUser) return;

        if (!confirm("Delete this batch? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "batches", id));
            await loadBatches();
        } catch (e) {
            console.error(e);
            alert("You are not allowed to delete this batch.");
        }
    }

    // ---------------- NAVIGATION ----------------
    function openBatch(id, name) {
        localStorage.setItem("currentBatchId", id);
        localStorage.setItem("currentBatchName", name);
        location.href = "batch.html";
    }

    // ---------------- UTIL ----------------
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
});