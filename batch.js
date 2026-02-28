import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    setDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const title = document.getElementById("batchTitle");
const input = document.getElementById("messageInput");
const postBtn = document.getElementById("postBtn");
const list = document.getElementById("messageList");
const peopleList = document.getElementById("peopleList");

const batchId = localStorage.getItem("currentBatchId");
const batchName = localStorage.getItem("currentBatchName");

if (!batchId) {
    location.href = "index.html";
    throw new Error("No batch selected");
}

title.textContent = batchName;


// hold unsubscribe functions
let unsubMessages = null;
let unsubPeople = null;
let unsubDay = null;

onAuthStateChanged(auth, user => {

    if (user) {

        console.log("Logged in:", user.email);

        // Hide login UI
        loginSection.style.display = "none";
        loginBtn.style.display = "none";

        // Show app
        appSection.style.display = "block";

        loadBatches();

    } else {

        console.log("Logged out");

        loginSection.style.display = "flex";
        appSection.style.display = "none";
        loginBtn.style.display = "block";

        batchList.innerHTML = "";
    }
});
// POST
postBtn.onclick = async () => {

    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    const anonymous = document.getElementById("anonymousToggle").checked;

    await addDoc(collection(db, "batches", batchId, "messages"), {
        text,
        author: anonymous ? "Someone 👀" : (user.displayName || "Someone"),
        createdAt: serverTimestamp()
    });

    input.value = "";
};


// MESSAGES
function loadMessages() {

    const q = query(collection(db, "batches", batchId, "messages"), orderBy("createdAt","asc"));

    unsubMessages = onSnapshot(q, snapshot => {

        list.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();

            const date = data.createdAt?.toDate?.() || new Date();
            const li = document.createElement("li");

            li.innerHTML = `
              <div>
                <b>${data.author}</b>
                <div>${data.text}</div>
                <small>${timeAgo(date)}</small>
              </div>
            `;

            list.appendChild(li);
        });

    });
}


// PEOPLE
document.getElementById("saveProfileBtn").onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db,"batches",batchId,"people",user.uid),{
        name:user.displayName,
        city:document.getElementById("currentCity").value,
        work:document.getElementById("currentWork").value
    });
};

function loadPeople(){
    unsubPeople = onSnapshot(collection(db,"batches",batchId,"people"), snap=>{
        peopleList.innerHTML="";
        snap.forEach(d=>{
            const p=d.data();
            const li=document.createElement("li");
            li.textContent=`${p.name} — ${p.city} — ${p.work}`;
            peopleList.appendChild(li);
        });
    });
}


// ON THIS DAY
function loadOnThisDay(){

    const today=new Date();
    const list2=document.getElementById("onThisDayList");

    unsubDay = onSnapshot(collection(db,"batches",batchId,"messages"),snap=>{
        list2.innerHTML="";

        snap.forEach(d=>{
            const data=d.data();
            if(!data.createdAt) return;

            const dt=data.createdAt.toDate();
            if(dt.getDate()===today.getDate() && dt.getMonth()===today.getMonth() && dt.getFullYear()!==today.getFullYear()){
                const years=today.getFullYear()-dt.getFullYear();
                const li=document.createElement("li");
                li.textContent=`${years} yrs ago — ${data.author}: ${data.text}`;
                list2.appendChild(li);
            }
        });
    });
}


// TIME AGO
function timeAgo(date){
    const s=Math.floor((Date.now()-date)/1000);
    if(s<60) return "just now";
    if(s<3600) return Math.floor(s/60)+"m ago";
    if(s<86400) return Math.floor(s/3600)+"h ago";
    return Math.floor(s/86400)+"d ago";
}