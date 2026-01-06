import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCYRQij5th_tz0R6H7Fej-N6MOna9DVxmA",
    authDomain: "oz-podbanse.firebaseapp.com",
    projectId: "oz-podbanse",
    storageBucket: "oz-podbanse.firebasestorage.app",
    messagingSenderId: "825063297812",
    appId: "1:825063297812:web:52098c71748b40e659a801"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Quill
const quillOptions = { theme: 'snow', modules: { toolbar: [['bold', 'italic'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean']] }};
const mainEditor = new Quill('#mainDescriptionEditor', quillOptions);
const newPostEditor = new Quill('#newItemTextEditor', quillOptions);
const editPostEditor = new Quill('#editItemEditor', quillOptions);

let currentSubItems = [];

// --- LOGIN CHECK ---
function init() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminContent').classList.remove('hidden');
        loadBaseData();
    }
}

document.getElementById('loginSubmitBtn').addEventListener('click', () => {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    if (u === "admin" && p === "podban2025") {
        sessionStorage.setItem('isLoggedIn', 'true');
        location.reload();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('isLoggedIn');
    location.reload();
});

// --- LOAD DATA ---
async function loadBaseData() {
    const hSnap = await getDoc(doc(db, "websiteContent", "hero"));
    if (hSnap.exists()) {
        const d = hSnap.data();
        document.getElementById('heroMainTitle').value = d.mainTitle || "";
        document.getElementById('heroSubTitle').value = d.subTitle || "";
        document.getElementById('heroDesc').value = d.description || "";
        document.getElementById('heroImageUrl').value = d.backgroundImage || "";
    }

    const cSnap = await getDoc(doc(db, "websiteContent", "contact"));
    if (cSnap.exists()) {
        const d = cSnap.data();
        document.getElementById('contactAddress').value = d.address || "";
        document.getElementById('contactPhone').value = d.phone || "";
        document.getElementById('contactEmail').value = d.email || "";
    }
}

// --- SAVE HERO & CONTACT ---
document.getElementById('saveHeroBtn').addEventListener('click', async () => {
    await setDoc(doc(db, "websiteContent", "hero"), {
        mainTitle: document.getElementById('heroMainTitle').value,
        subTitle: document.getElementById('heroSubTitle').value,
        description: document.getElementById('heroDesc').value,
        backgroundImage: document.getElementById('heroImageUrl').value
    }, { merge: true });
    alert("Hero uložené!");
});

document.getElementById('saveContactBtn').addEventListener('click', async () => {
    try {
        await setDoc(doc(db, "websiteContent", "contact"), {
            address: document.getElementById('contactAddress').value,
            phone: document.getElementById('contactPhone').value,
            email: document.getElementById('contactEmail').value,
            title: "Spojte sa s nami",
            description: "Nájdete nás na nasledujúcich adresách a číslach."
        }, { merge: true });
        alert("Kontakt uložený!");
    } catch (e) { alert("Chyba: " + e.message); }
});

// --- SECTION & SUB-ITEMS (PODSEKCIE) ---
document.getElementById('sectionSelector').addEventListener('change', async (e) => {
    const s = e.target.value;
    if (!s) { document.getElementById('editorArea').classList.add('hidden'); return; }
    
    document.getElementById('editorArea').classList.remove('hidden');
    const snap = await getDoc(doc(db, "websiteContent", s));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('mainTitle').value = d.title || "";
        mainEditor.root.innerHTML = d.description || "";
        currentSubItems = d.subItems || [];
        renderList();
    }
});

function renderList() {
    const list = document.getElementById('subItemsList');
    list.innerHTML = currentSubItems.map((item, i) => `
        <div class="sub-item">
            <span><strong>${item.title || 'Bez názvu'}</strong></span>
            <div>
                <button class="btn" onclick="window.prepareEdit(${i})">Upraviť</button>
                <button class="btn" style="background:#e74c3c; color:white;" onclick="window.removeItem(${i})">Zmazať</button>
            </div>
        </div>
    `).join('');
}

window.prepareEdit = (i) => {
    const item = currentSubItems[i];
    document.getElementById('editItemIndex').value = i;
    document.getElementById('editItemTitle').value = item.title || "";
    document.getElementById('editItemImage').value = item.image || "";
    editPostEditor.root.innerHTML = item.text || "";
    document.getElementById('editItemModal').classList.remove('hidden');
};

document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const i = document.getElementById('editItemIndex').value;
    currentSubItems[i] = {
        title: document.getElementById('editItemTitle').value,
        image: document.getElementById('editItemImage').value,
        text: editPostEditor.root.innerHTML
    };
    await syncSection();
    document.getElementById('editItemModal').classList.add('hidden');
});

document.getElementById('addItemBtn').addEventListener('click', async () => {
    currentSubItems.push({
        title: document.getElementById('newItemTitle').value,
        image: document.getElementById('newItemImage').value,
        text: newPostEditor.root.innerHTML
    });
    await syncSection();
    document.getElementById('newItemTitle').value = "";
    document.getElementById('newItemImage').value = "";
    newPostEditor.root.innerHTML = "";
});

window.removeItem = async (i) => {
    if (confirm("Zmazať?")) {
        currentSubItems.splice(i, 1);
        await syncSection();
    }
};

async function syncSection() {
    const s = document.getElementById('sectionSelector').value;
    await setDoc(doc(db, "websiteContent", s), {
        title: document.getElementById('mainTitle').value,
        description: mainEditor.root.innerHTML,
        subItems: currentSubItems
    }, { merge: true });
    renderList();
    alert("Aktualizované!");
}

document.getElementById('saveMainBtn').addEventListener('click', syncSection);
document.addEventListener('DOMContentLoaded', init);