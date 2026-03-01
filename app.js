// app.js — main page logic (batches list)
// IMPORTANT: firebase.js must export auth, db, provider, signInWithPopup, onAuthStateChanged
import {
  auth,
  db,
  provider,
  signInWithPopup,
  onAuthStateChanged
} from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  console.log("APP READY");

  const loginBtn = document.getElementById("loginBtn");
  const loginSection = document.getElementById("loginSection");
  const appSection = document.getElementById("appSection");
  const createBtn = document.getElementById("createBatchBtn");
  const batchInput = document.getElementById("batchName");
  const batchList = document.getElementById("batchList");

  let allBatches = [];
  let sortAsc = true;

  // ---------------- LOGIN ----------------
  loginBtn?.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      alert("Popup blocked or domain not authorized");
    }
  });

  onAuthStateChanged(auth, user => {
    if (user) {
      console.log("Logged in:", user.email);
      loginSection.style.display = "none";
      appSection.style.display = "block";
      loginBtn.style.display = "none";
      loadBatches();
    } else {
      loginSection.style.display = "block";
      appSection.style.display = "none";
      loginBtn.style.display = "block";
      batchList.innerHTML = '<div class="empty-state">Sign in to view batches</div>';
    }
  });

  // allow Enter key
  batchInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") createBtn.click();
  });

  // ---------------- CREATE ----------------
  createBtn?.addEventListener("click", async () => {
    const name = batchInput.value.trim();
    if (!name) return alert("Enter batch name");

    createBtn.disabled = true;
    try {
      await addDoc(collection(db, "batches"), {
        name,
        createdAt: new Date()
      });
      batchInput.value = "";
      await loadBatches();
    } catch (e) {
      console.error(e);
      alert("Failed to create batch");
    }
    createBtn.disabled = false;
  });

  // ---------------- LOAD ----------------
  async function loadBatches() {
    batchList.innerHTML = "<div class='empty-state'>Loading...</div>";

    const snapshot = await getDocs(collection(db, "batches"));
    allBatches = [];

    snapshot.forEach(d => {
      allBatches.push({ id: d.id, name: d.data().name || "Untitled" });
    });

    if (!allBatches.length) {
      batchList.innerHTML = '<div class="empty-state">No batches yet</div>';
      return;
    }

    renderBatches(allBatches);
  }

  // ---------------- RENDER ----------------
  function renderBatches(batches) {
    batches.sort((a, b) => sortAsc
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
    );

    batchList.innerHTML = "";

    batches.forEach(batch => {
      const li = document.createElement("li");
      li.className = "batch-card";

      li.innerHTML = `
        <div class="card-left">
          <div class="batch-item-text">${escapeHtml(batch.name)}</div>
        </div>
        <div class="card-right">
          <button class="batch-delete">Delete</button>
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
    if (!confirm("Delete this batch?")) return;
    await deleteDoc(doc(db, "batches", id));
    loadBatches();
  }

  // ---------------- NAVIGATION ----------------
  function openBatch(id, name) {
    localStorage.setItem("currentBatchId", id);
    localStorage.setItem("currentBatchName", name);
    location.href = "batch.html";
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
});
