import {
    addDoc,
    auth,
    collection,
    db,
    getDocs,
    onAuthStateChanged,
    provider,
    serverTimestamp,
    signInWithPopup,
    signOut,
    waitForAuth,
    deleteDoc,
    doc
} from "./firebase.js";

/* ADMIN EMAIL */
const ADMIN_EMAIL = "maahistic@gmail.com";

/* UTILITY FUNCTIONS */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, "");
}

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast visible";
    toast.textContent = message;
    
    if (type === "error") {
        toast.style.background = "#dc2626";
    } else if (type === "success") {
        toast.style.background = "#16a34a";
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

window.addEventListener("DOMContentLoaded", async () => {

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const loginSection = document.getElementById("loginSection");
    const appSection = document.getElementById("appSection");

    const institutionInput = document.getElementById("institutionInput");
    const suggestionBox = document.getElementById("institutionSuggestions");

    const yearSelect = document.getElementById("yearSelect");
    const createBtn = document.getElementById("createBatchBtn");

    const batchNamePreview = document.getElementById("batchNamePreview");
    const previewName = document.getElementById("previewName");

    const batchList = document.getElementById("batchList");

    let currentUser = null;
    let allBatches = [];
    let institutions = [];

    /* LOGIN */

    loginBtn?.addEventListener("click", async () => {

        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error(err);
            showToast("Login failed. Please try again.", "error");
        }

    });

    /* LOGOUT */

    logoutBtn?.addEventListener("click", async () => {

        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout failed", err);
            showToast("Logout failed", "error");
        }

    });

    /* WAIT FOR AUTH */

    await waitForAuth(5000);

    onAuthStateChanged(auth, user => {

        if (user) {

            currentUser = user;

            loginSection.style.display = "none";
            appSection.style.display = "block";

            loginBtn.style.display = "none";

            if (logoutBtn) logoutBtn.style.display = "inline-block";

            populateYears();
            loadInstitutions();
            loadBatches();

        } else {

            loginSection.style.display = "block";
            appSection.style.display = "none";

            loginBtn.style.display = "inline-block";

            if (logoutBtn) logoutBtn.style.display = "none";

        }

    });

    /* YEARS */

    function populateYears() {

        const currentYear = new Date().getFullYear();

        for (let year = currentYear; year >= 1990; year--) {

            const option = document.createElement("option");

            option.value = year;
            option.textContent = year;

            yearSelect.appendChild(option);

        }

    }

    /* LOAD INSTITUTIONS */

    async function loadInstitutions() {

        institutions = [];

        const snapshot = await getDocs(collection(db, "institutions"));

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            if (data.name) {
                institutions.push(data.name);
            }

        });

    }

    /* AUTOCOMPLETE */

    institutionInput?.addEventListener("input", () => {

        if (!suggestionBox) return;

        const value = institutionInput.value.toLowerCase();

        if (!value) {
            suggestionBox.innerHTML = "";
            suggestionBox.style.display = "none";
            return;
        }

        const matches = institutions.filter(i =>
            i.toLowerCase().includes(value)
        );

        if (matches.length === 0) {
            suggestionBox.innerHTML = "";
            suggestionBox.style.display = "none";
            return;
        }

        suggestionBox.style.display = "block";

        matches.slice(0, 5).forEach(match => {

            const li = document.createElement("li");

            li.textContent = match;

            li.onclick = () => {

                institutionInput.value = match;

                suggestionBox.innerHTML = "";
                suggestionBox.style.display = "none";

                updatePreview();

            };

            suggestionBox.appendChild(li);

        });

    });

    /* PREVIEW */

    function updatePreview() {

        const institution = institutionInput?.value?.trim();
        const year = yearSelect?.value;

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

    institutionInput?.addEventListener("input", updatePreview);
    yearSelect?.addEventListener("change", updatePreview);

    /* DUPLICATE CHECK */

    function isDuplicate(institution, year) {

        if (!institution || !year) return false;

        return allBatches.some(batch => {

            const batchInstitution = batch?.institution || "";
            const batchYear = batch?.year || "";

            return (
                batchInstitution.toLowerCase() === institution.toLowerCase() &&
                batchYear == year
            );

        });

    }

    /* CREATE BATCH */

    createBtn?.addEventListener("click", async () => {

        try {

            if (!currentUser) return alert("Please sign in");

            const institution = sanitizeInput(institutionInput.value);
            const year = yearSelect.value;

            if (!institution) {
                showToast("Please enter an institution name", "error");
                return;
            }
            if (!year) {
                showToast("Please select a graduation year", "error");
                return;
            }

            if (isDuplicate(institution, year)) {
                showToast("This memory wall already exists", "error");
                return;
            }

            if (!institutions.includes(institution)) {

                await addDoc(collection(db, "institutions"), {
                    name: institution
                });

                institutions.push(institution);

            }

            await addDoc(collection(db, "batches"), {

                name: `${institution} ${year}`,
                institution: institution,
                year: parseInt(year),

                createdAt: serverTimestamp(),

                createdBy: currentUser.uid,
                createdByEmail: currentUser.email

            });

            institutionInput.value = "";
            yearSelect.value = "";

            updatePreview();

            loadBatches();

        } catch (e) {
            console.error(e);
            showToast("Failed to create memory wall. Please try again.", "error");
        }

    });

    /* LOAD BATCHES */

    async function loadBatches() {

        batchList.innerHTML = "Loading...";

        const snapshot = await getDocs(collection(db, "batches"));

        allBatches = [];

        snapshot.forEach(d => {

            const data = d.data();

            allBatches.push({
                id: d.id,
                name: data.name || "",
                institution: data.institution || "",
                year: data.year || ""
            });

        });

        renderBatches(allBatches);

    }

    /* RENDER */

    function renderBatches(batches) {

        batchList.innerHTML = "";

        const isAdmin = currentUser?.email === ADMIN_EMAIL;

        if (batches.length === 0) {
            batchList.innerHTML = '<li class="empty-state">No memory walls found. Create one above!</li>';
            return;
        }

        batches.forEach(batch => {

            const li = document.createElement("li");
            li.className = "batch-card";

            li.innerHTML = `
<div class="card-left">
<div class="batch-item-text">${escapeHtml(batch.name)}</div>
<div class="batch-item-meta">${escapeHtml(batch.institution)} • ${escapeHtml(batch.year)}</div>
</div>
${isAdmin ? `<button class="batch-delete" aria-label="Delete memory wall">Delete</button>` : ""}
`;

            li.addEventListener("click", () => {

                const url =
                    `batch.html?batchId=${batch.id}&name=${encodeURIComponent(batch.name)}`;

                location.href = url;

            });

            if (isAdmin) {

                li.querySelector(".batch-delete")?.addEventListener("click", async (e) => {

                    e.stopPropagation();

                    if (!confirm("Delete this memory wall? This action cannot be undone.")) return;
                    
                    try {
                        await deleteDoc(doc(db, "batches", batch.id));
                        showToast("Memory wall deleted successfully", "success");
                        loadBatches();
                    } catch (error) {
                        console.error("Delete failed:", error);
                        showToast("Failed to delete memory wall", "error");
                    }

                });

            }

            batchList.appendChild(li);

        });

    }

});