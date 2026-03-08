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
            alert("Login failed");
        }

    });

    /* LOGOUT */

    logoutBtn?.addEventListener("click", async () => {

        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout failed", err);
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

        suggestionBox.innerHTML = "";

        if (!value) return;

        const matches = institutions.filter(i =>
            i.toLowerCase().includes(value)
        );

        matches.slice(0, 5).forEach(match => {

            const li = document.createElement("li");

            li.textContent = match;

            li.onclick = () => {

                institutionInput.value = match;

                suggestionBox.innerHTML = "";

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

            const institution = institutionInput.value.trim();
            const year = yearSelect.value;

            if (!institution) return alert("Enter institution");
            if (!year) return alert("Select year");

            if (isDuplicate(institution, year)) {

                alert("Memory wall already exists");
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
            alert("Failed to create wall");

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

        batches.forEach(batch => {

            const li = document.createElement("li");

            li.className = "batch-card";

            li.innerHTML = `

<div class="card-left">

<div class="batch-item-text">${escapeHtml(batch.name)}</div>

<div class="batch-item-meta">${batch.institution} • ${batch.year}</div>

</div>

${isAdmin ? `<button class="batch-delete">Delete</button>` : ""}

`;

            li.addEventListener("click", () => {

                const url =
                    `batch.html?batchId=${batch.id}&name=${encodeURIComponent(batch.name)}`;

                location.href = url;

            });

            if (isAdmin) {

                li.querySelector(".batch-delete")?.addEventListener("click", async (e) => {

                    e.stopPropagation();

                    if (!confirm("Delete this memory wall?")) return;

                    await deleteDoc(doc(db, "batches", batch.id));

                    loadBatches();

                });

            }

            batchList.appendChild(li);

        });

    }

    function escapeHtml(text) {

        const div = document.createElement("div");

        div.textContent = text;

        return div.innerHTML;

    }

});