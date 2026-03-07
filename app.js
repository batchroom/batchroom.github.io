// app.js — main page logic (batches list)
// GitHub Pages compatible
// Secure batch ownership support
// Enhanced with institution/year selection and filtering

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

    // ==================== UI ELEMENTS ====================
    const loginBtn = document.getElementById("loginBtn");
    const loginSection = document.getElementById("loginSection");
    const appSection = document.getElementById("appSection");
    const createBtn = document.getElementById("createBatchBtn");
    const institutionSelect = document.getElementById("institutionSelect");
    const yearSelect = document.getElementById("yearSelect");
    const batchNamePreview = document.getElementById("batchNamePreview");
    const previewName = document.getElementById("previewName");
    const filterInstitution = document.getElementById("filterInstitution");
    const filterYear = document.getElementById("filterYear");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const batchList = document.getElementById("batchList");

    // ==================== STATE ====================
    let allBatches = [];
    let currentUser = null;
    let currentFilters = {
        institution: "",
        year: ""
    };

    // ==================== LOGIN ================
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
            populateYears();
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

    // ==================== YEAR GENERATION ====================
    function populateYears() {
        const currentYear = new Date().getFullYear();
        const startYear = 1990;

        if (!yearSelect) return;

        // Clear existing options except the first placeholder
        const placeholder = yearSelect.querySelector('option[value=""]');
        yearSelect.innerHTML = '';
        if (placeholder) yearSelect.appendChild(placeholder);

        // Generate years from current down to 1990
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    // ==================== BATCH NAME PREVIEW ====================
    function updateBatchNamePreview() {
        const institution = institutionSelect?.value || "";
        const year = yearSelect?.value || "";

        if (institution && year) {
            const batchName = `${institution} ${year}`;
            previewName.textContent = batchName;
            batchNamePreview.style.display = "block";
            createBtn.disabled = false;
        } else {
            batchNamePreview.style.display = "none";
            createBtn.disabled = true;
        }
    }

    institutionSelect?.addEventListener("change", updateBatchNamePreview);
    yearSelect?.addEventListener("change", updateBatchNamePreview);

    // ==================== CREATE BATCH ================
    createBtn?.addEventListener("click", async () => {
        if (!currentUser) return alert("Sign in first");

        const institution = institutionSelect?.value?.trim();
        const year = yearSelect?.value?.trim();

        if (!institution || !year) {
            return alert("Please select both institution and year");
        }

        const batchName = `${institution} ${year}`;

        createBtn.disabled = true;

        try {
            await addDoc(collection(db, "batches"), {
                name: batchName,
                institution: institution,
                year: parseInt(year, 10),
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                createdByEmail: currentUser.email
            });

            // Reset form
            institutionSelect.value = "";
            yearSelect.value = "";
            updateBatchNamePreview();

            await loadBatches();
        } catch (e) {
            console.error(e);
            alert("Failed to create batch");
        }

        createBtn.disabled = true; // Re-disable after attempt
    });

    // ==================== POPULATE FILTER DROPDOWNS ====================
    function populateFilterOptions() {
        const institutions = new Set();
        const years = new Set();

        allBatches.forEach(batch => {
            if (batch.institution) institutions.add(batch.institution);
            if (batch.year) years.add(batch.year);
        });

        // Sort institutions alphabetically
        const sortedInstitutions = Array.from(institutions).sort();
        // Sort years descending
        const sortedYears = Array.from(years).sort((a, b) => b - a);

        // Clear existing options except placeholder
        if (filterInstitution) {
            const placeholder = filterInstitution.querySelector('option[value=""]');
            filterInstitution.innerHTML = '';
            if (placeholder) filterInstitution.appendChild(placeholder);

            sortedInstitutions.forEach(inst => {
                const option = document.createElement("option");
                option.value = inst;
                option.textContent = inst;
                filterInstitution.appendChild(option);
            });
        }

        if (filterYear) {
            const placeholder = filterYear.querySelector('option[value=""]');
            filterYear.innerHTML = '';
            if (placeholder) filterYear.appendChild(placeholder);

            sortedYears.forEach(yr => {
                const option = document.createElement("option");
                option.value = yr;
                option.textContent = yr;
                filterYear.appendChild(option);
            });
        }
    }

    // ==================== FILTER LOGIC ====================
    function applyFilters() {
        const filtered = allBatches.filter(batch => {
            const matchInstitution = !currentFilters.institution || batch.institution === currentFilters.institution;
            const matchYear = !currentFilters.year || batch.year === parseInt(currentFilters.year, 10);
            return matchInstitution && matchYear;
        });

        renderBatches(filtered);
    }

    filterInstitution?.addEventListener("change", e => {
        currentFilters.institution = e.target.value;
        applyFilters();
    });

    filterYear?.addEventListener("change", e => {
        currentFilters.year = e.target.value;
        applyFilters();
    });

    clearFiltersBtn?.addEventListener("click", () => {
        currentFilters.institution = "";
        currentFilters.year = "";
        if (filterInstitution) filterInstitution.value = "";
        if (filterYear) filterYear.value = "";
        applyFilters();
    });

    // ==================== LOAD BATCHES ================
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
                    institution: data.institution || "",
                    year: data.year || null,
                    createdBy: data.createdBy || null
                });
            });

            populateFilterOptions();

            if (!allBatches.length) {
                batchList.innerHTML = '<div class="empty-state">No memory walls yet</div>';
                return;
            }

            applyFilters();
        } catch (e) {
            console.error("Failed to load batches", e);
            batchList.innerHTML = '<div class="empty-state">Failed to load batches</div>';
        }
    }

    // ==================== RENDER ================
    function renderBatches(batches) {
        if (!batchList) return;

        if (!batches.length) {
            batchList.innerHTML = '<div class="empty-state">No memory walls match your filters</div>';
            return;
        }

        batchList.innerHTML = "";

        batches.sort((a, b) => a.name.localeCompare(b.name));

        batches.forEach(batch => {
            const li = document.createElement("li");
            li.className = "batch-card";

            const isOwner = currentUser && batch.createdBy === currentUser.uid;

            li.innerHTML = `
        <div class="card-left">
          <div class="batch-item-text">${escapeHtml(batch.name)}</div>
          ${batch.institution ? `<div class="batch-item-meta">${escapeHtml(batch.institution)} • ${batch.year}</div>` : ''}
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

    // ==================== DELETE ================
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

    // ==================== NAVIGATION ================
    function openBatch(id, name) {
        localStorage.setItem("currentBatchId", id);
        localStorage.setItem("currentBatchName", name);
        location.href = "batch.html";
    }

    // ==================== UTILITIES ================
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
});