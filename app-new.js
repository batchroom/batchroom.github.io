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
import {
    escapeHtml,
    sanitizeInput,
    showToast,
    validateField,
    validateForm,
    setFocus,
    showLoading,
    hideLoading
} from "./utils.js";

/* ADMIN EMAIL */
const ADMIN_EMAIL = "maahistic@gmail.com";

/* TESTING MODE */
const TESTING_MODE = true; // Set to false for production

/* TEST UTILITIES */
function logTest(message, data = null) {
    if (TESTING_MODE) {
        console.log(`🧪 TEST: ${message}`, data);
    }
}

function simulateNetworkError() {
    if (TESTING_MODE) {
        return Math.random() < 0.2; // 20% chance of network error
    }
    return false;
}

function testFeature(featureName, testFn) {
    if (TESTING_MODE) {
        logTest(`Testing ${featureName}`);
        try {
            const result = testFn();
            logTest(`✅ ${featureName} passed`, result);
            return { success: true, result };
        } catch (error) {
            logTest(`❌ ${featureName} failed`, error);
            return { success: false, error };
        }
    }
    return { success: true, result: null };
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
        const testResult = testFeature('Batch Creation', async () => {
            try {
                if (!currentUser) {
                    showToast("Please sign in", "error");
                    return false;
                }

                const institution = sanitizeInput(institutionInput.value);
                const year = yearSelect.value;

                // Enhanced validation using shared utilities
                const institutionValidation = validateField(
                    { name: "institution name", required: true, minLength: 2, maxLength: 100 },
                    institution
                );
                
                if (!institutionValidation.isValid) {
                    showToast(institutionValidation.message, "error");
                    setFocus(institutionInput, institutionValidation.message);
                    return false;
                }
                
                const yearValidation = validateField(
                    { name: "graduation year", required: true },
                    year
                );
                
                if (!yearValidation.isValid) {
                    showToast(yearValidation.message, "error");
                    setFocus(yearSelect, yearValidation.message);
                    return false;
                }

                if (isDuplicate(institution, year)) {
                    showToast("This memory wall already exists", "error");
                    return false;
                }

                // Simulate network error for testing
                if (simulateNetworkError()) {
                    throw new Error('Simulated network error');
                }

                if (!institutions.includes(institution)) {
                    await addDoc(collection(db, "institutions"), {
                        name: institution
                    });
                    institutions.push(institution);
                }

                showLoading(batchList, "Creating memory wall...");
                
                const batchDoc = await addDoc(collection(db, "batches"), {
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
                
                return {
                    batchId: batchDoc.id,
                    batchName: `${institution} ${year}`,
                    success: true
                };
            } catch (e) {
                console.error(e);
                showToast("Failed to create memory wall. Please try again.", "error");
                return { success: false, error: e };
            }
        });
        
        if (!testResult.success) {
            logTest('Batch creation test failed', testResult.error);
        }
    });

    /* LOAD BATCHES */
    async function loadBatches() {
        showLoading(batchList, "Loading memory walls...");
        
        try {
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
        } catch (error) {
            console.error("Failed to load batches:", error);
            showToast("Failed to load memory walls", "error");
        } finally {
            hideLoading(batchList);
        }
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
                const url = `batch.html?batchId=${batch.id}&name=${encodeURIComponent(batch.name)}`;
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
