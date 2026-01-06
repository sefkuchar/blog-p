import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

async function loadPage() {
    try {
        // 1. HERO LOAD (Full monitor height)
        const heroSnap = await getDoc(doc(db, "websiteContent", "hero"));
        if (heroSnap.exists()) {
            const d = heroSnap.data();
            if(document.querySelector('.hero-headline-main')) document.querySelector('.hero-headline-main').textContent = d.mainTitle || "";
            if(document.querySelector('.hero-headline-sub')) document.querySelector('.hero-headline-sub').textContent = d.subTitle || "";
            if(document.querySelector('.hero-description')) document.querySelector('.hero-description').textContent = d.description || "";
            if(d.backgroundImage && document.querySelector('.hero-image')) {
                document.querySelector('.hero-image').style.backgroundImage = `url('${d.backgroundImage}')`;
            }
        }

        // 2. DYNAMIC SECTIONS
        const sections = ['about', 'activities', 'history', 'nature', 'rules', 'magic'];
        for (const s of sections) {
            const snap = await getDoc(doc(db, "websiteContent", s));
            const cont = document.getElementById(`${s}Content`);
            
            if (snap.exists() && cont) {
                const data = snap.data();
                const isBlog = ['rules', 'history', 'nature'].includes(s);
                const isGallery = (s === 'magic');
                
                // HEADER with padding and centering
                let html = `<header class="section-header centered" style="padding-top: 80px; margin-bottom: 40px;">
                                <h2 class="section-title">${data.title || ''}</h2>
                                <div class="rich-text-content">${data.description || ''}</div>
                            </header>`;

                if (isGallery) {
                    html += `<div class="gallery-grid">`;
                    (data.subItems || []).forEach(item => {
                        html += `<div class="gallery-item" onclick="window.openLightbox('${item.image}', '${item.title}')">
                                    <img src="${item.image}"><div class="gallery-caption">${item.title}</div>
                                 </div>`;
                    });
                } else {
                    html += `<div class="${isBlog ? 'blog-container' : 'items-grid'}">`;
                    (data.subItems || []).forEach((item, index) => {
                        const contentId = `content-${s}-${index}`;
                        
                        if (isBlog) {
                            // Newspaper style with "Čítať viac" button restored
                            const needsReadMore = (item.text || '').length > 500;
                            html += `
                                <article class="blog-post" style="margin-bottom: 30px;">
                                    ${item.image ? `<img src="${item.image}" class="blog-img" style="width:100%; border-radius:10px;">` : ''}
                                    <h3 style="margin-top:20px;">${item.title || ''}</h3>
                                    <div id="${contentId}" class="blog-preview rich-text-content">${item.text || ''}</div>
                                    ${needsReadMore ? `<button onclick="window.toggleReadMore('${contentId}', this)" class="read-more-btn" style="margin-top:10px;">Čítať viac</button>` : ''}
                                </article>`;
                        } else {
                            // Card style with "Viac informácií" button
                            const safeText = (item.text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                            html += `
                                <div class="card" onclick="window.openActivityModal('${item.image}', '${item.title}', '${safeText}')">
                                    <img src="${item.image}">
                                    <div class="card-content">
                                        <h3>${item.title || ''}</h3>
                                        <div class="rich-text-content">${item.text || ''}</div>
                                    </div>
                                    <div class="card-action-area">
                                        <button class="btn-more-info">Viac informácií</button>
                                    </div>
                                </div>`;
                        }
                    });
                }
                cont.innerHTML = html + `</div>`;
            }
        }

        // 3. CONTACT INFO (Centered layout with padding)
        const contactSnap = await getDoc(doc(db, "websiteContent", "contact"));
        if (contactSnap.exists()) {
            const d = contactSnap.data();
            if(document.getElementById('contact-address')) document.getElementById('contact-address').textContent = d.address || "";
            if(document.getElementById('contact-phone')) document.getElementById('contact-phone').textContent = d.phone || "";
            if(document.getElementById('contact-email')) document.getElementById('contact-email').textContent = d.email || "";
        }

    } catch (e) { console.error("Error loading data:", e); }
}

// Global UI Functions
window.toggleReadMore = (id, btn) => {
    const el = document.getElementById(id);
    const expanded = el.classList.toggle('expanded');
    btn.textContent = expanded ? 'Zobraziť menej' : 'Čítať viac';
};

window.openActivityModal = (img, title, text) => {
    document.getElementById('modalActivityImg').src = img;
    document.getElementById('modalActivityTitle').textContent = title;
    document.getElementById('modalActivityText').innerHTML = text;
    document.getElementById('activityModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.openLightbox = (src, caption) => {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-caption').textContent = caption;
    document.getElementById('lightbox').style.display = 'flex';
};

document.addEventListener('click', e => {
    if (e.target.id === 'activityModal' || e.target.id === 'closeActivityModal') {
        document.getElementById('activityModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (e.target.id === 'lightbox' || e.target.id === 'closeLightbox') document.getElementById('lightbox').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', loadPage);