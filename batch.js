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
    signOut,
    waitForAuth
} from "./firebase.js";

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", async () => {

    await signOut(auth);

    location.href = "index.html";

});

/* ADMIN EMAIL */
const ADMIN_EMAIL = "maahistic@gmail.com";

const title = document.getElementById("batchTitle");
const input = document.getElementById("messageInput");
const postBtn = document.getElementById("postBtn");
const list = document.getElementById("messageList");

let batchId = null;
let currentUser = null;

waitForAuth(5000).then(user => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    currentUser = user;

    const params = new URLSearchParams(window.location.search);

    batchId = params.get("batchId");

    const batchName = params.get("name");

    title.textContent = batchName || "Batch";

    loadMessages();

});

postBtn?.addEventListener("click", async () => {

    const text = input.value.trim();

    if (!text) return;

    await addDoc(collection(db, "batches", batchId, "messages"), {

        text: text,

        author: currentUser.displayName || "Someone",

        createdAt: serverTimestamp()

    });

    input.value = "";

});

function loadMessages() {

    const q = query(
        collection(db, "batches", batchId, "messages"),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, snapshot => {

        list.innerHTML = "";

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            const li = document.createElement("li");

            const date = data.createdAt?.toDate?.() || new Date();

            const time = date.toLocaleString();

            const isAdmin = currentUser?.email === ADMIN_EMAIL;

            li.innerHTML = `

<div class="message-content">

<div class="message-author">${data.author}</div>

<div class="message-text">${data.text}</div>

<div class="message-time">${time}</div>

${isAdmin ? `<button class="admin-delete">Delete</button>` : ""}

</div>

`;

            if (isAdmin) {

                li.querySelector(".admin-delete")?.addEventListener("click", async () => {

                    if (!confirm("Delete this memory?")) return;

                    await deleteDoc(
                        doc(db, "batches", batchId, "messages", docSnap.id)
                    );

                });

            }

            list.appendChild(li);

        });

    });

}