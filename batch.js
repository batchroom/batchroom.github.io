import {
    addDoc,
    auth,
    collection,
    db,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    signOut,
    waitForAuth
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
    const logoutBtn = document.getElementById("logoutBtn");
    const title = document.getElementById("batchTitle");
    const input = document.getElementById("messageInput");
    const postBtn = document.getElementById("postBtn");
    const list = document.getElementById("messageList");
    const anonymousToggle = document.getElementById("anonymousToggle");
    const shareBtn = document.getElementById("shareBtn");
    const currentCity = document.getElementById("currentCity");
    const currentWork = document.getElementById("currentWork");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const peopleList = document.getElementById("peopleList");
    const messagesEmpty = document.getElementById("messagesEmpty");

    let batchId = null;
    let currentUser = null;
    let messagesUnsubscribe = null;
    let profilesUnsubscribe = null;

    /* LOGOUT */
    logoutBtn?.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout failed", err);
            showToast("Logout failed", "error");
        }
        location.href = "index.html";
    });

    /* SHARE FUNCTIONALITY */
    shareBtn?.addEventListener("click", async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            showToast("Link copied to clipboard!", "success");
        } catch (err) {
            console.error("Failed to copy:", err);
            showToast("Failed to copy link", "error");
        }
    });

    /* WAIT FOR AUTH */
    const user = await waitForAuth(5000);
    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;
    const params = new URLSearchParams(window.location.search);
    batchId = params.get("batchId");
    const batchName = params.get("name");

    if (!batchId) {
        showToast("Invalid batch ID", "error");
        location.href = "index.html";
        return;
    }

    title.textContent = escapeHtml(batchName) || "Batch";
    loadMessages();
    loadProfiles();

    /* POST MESSAGE */
    postBtn?.addEventListener("click", async () => {
        const text = sanitizeInput(input.value);
        
        if (!text) {
            showToast("Please write a message", "error");
            return;
        }
        
        if (text.length > 500) {
            showToast("Message is too long (max 500 characters)", "error");
            return;
        }

        try {
            const isAnonymous = anonymousToggle?.checked;
            const author = isAnonymous ? "Anonymous" : (currentUser.displayName || "Someone");
            
            await addDoc(collection(db, "batches", batchId, "messages"), {
                text: text,
                author: author,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            });
            
            input.value = "";
            showToast("Memory shared!", "success");
        } catch (error) {
            console.error("Failed to post message:", error);
            showToast("Failed to share memory", "error");
        }
    });

    /* PROFILE UPDATE */
    saveProfileBtn?.addEventListener("click", async () => {
        const city = sanitizeInput(currentCity.value);
        const work = sanitizeInput(currentWork.value);
        
        if (!city && !work) {
            showToast("Please enter your city or what you're doing", "error");
            return;
        }
        
        try {
            const profileRef = doc(db, "batches", batchId, "people", currentUser.uid);
            await setDoc(profileRef, {
                userId: currentUser.uid,
                displayName: currentUser.displayName || "Someone",
                email: currentUser.email,
                city: city,
                work: work,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            currentCity.value = "";
            currentWork.value = "";
            showToast("Profile updated!", "success");
        } catch (error) {
            console.error("Failed to update profile:", error);
            showToast("Failed to update profile", "error");
        }
    });

    /* LOAD MESSAGES */
    function loadMessages() {
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
        }
        
        const q = query(
            collection(db, "batches", batchId, "messages"),
            orderBy("createdAt", "asc")
        );

        messagesUnsubscribe = onSnapshot(q, snapshot => {
            list.innerHTML = "";
            
            if (snapshot.empty) {
                if (messagesEmpty) {
                    messagesEmpty.classList.remove("visually-hidden");
                }
                return;
            }
            
            if (messagesEmpty) {
                messagesEmpty.classList.add("visually-hidden");
            }

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const li = document.createElement("li");
                li.className = "message-card";

                const date = data.createdAt?.toDate?.() || new Date();
                const time = date.toLocaleString();

                const isAdmin = currentUser?.email === ADMIN_EMAIL;
                const isAuthor = data.userId === currentUser.uid;

                li.innerHTML = `
<div class="message-content">
<div class="message-author">${escapeHtml(data.author)}</div>
<div class="message-text">${escapeHtml(data.text)}</div>
<div class="message-time">${time}</div>
${isAdmin || isAuthor ? `<button class="admin-delete" aria-label="Delete memory">Delete</button>` : ""}
</div>
`;

                if (isAdmin || isAuthor) {
                    li.querySelector(".admin-delete")?.addEventListener("click", async () => {
                        if (!confirm("Delete this memory? This action cannot be undone.")) return;
                        
                        try {
                            await deleteDoc(doc(db, "batches", batchId, "messages", docSnap.id));
                            showToast("Memory deleted", "success");
                        } catch (error) {
                            console.error("Delete failed:", error);
                            showToast("Failed to delete memory", "error");
                        }
                    });
                }

                list.appendChild(li);
            });
        }, error => {
            console.error("Messages load error:", error);
            showToast("Failed to load messages", "error");
        });
    }

    /* LOAD PROFILES */
    function loadProfiles() {
        if (profilesUnsubscribe) {
            profilesUnsubscribe();
        }
        
        const q = query(
            collection(db, "batches", batchId, "people"),
            orderBy("updatedAt", "desc")
        );

        profilesUnsubscribe = onSnapshot(q, snapshot => {
            if (!peopleList) return;
            
            peopleList.innerHTML = "";
            
            if (snapshot.empty) {
                peopleList.innerHTML = '<li class="empty-profile">No profiles yet. Be the first to share!</li>';
                return;
            }

            const profiles = new Map();
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                profiles.set(data.userId, data);
            });

            profiles.forEach(profile => {
                const li = document.createElement("li");
                const city = profile.city ? `<span class="profile-city">📍 ${escapeHtml(profile.city)}</span>` : "";
                const work = profile.work ? `<span class="profile-work">💼 ${escapeHtml(profile.work)}</span>` : "";
                
                li.innerHTML = `
<div class="profile-item">
<strong>${escapeHtml(profile.displayName)}</strong>
${city}
${work}
</div>
`;
                
                peopleList.appendChild(li);
            });
        }, error => {
            console.error("Profiles load error:", error);
        });
    }

    /* CLEANUP */
    window.addEventListener("beforeunload", () => {
        if (messagesUnsubscribe) messagesUnsubscribe();
        if (profilesUnsubscribe) profilesUnsubscribe();
    });

    /* ENTER KEY TO POST */
    input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            postBtn?.click();
        }
    });
});