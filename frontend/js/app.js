/**
 * TIA INFO TOAMASINA — Application Frontend Corrigée
 */
import { STUDENT_DEMO, FORMATIONS, CATEGORIES, EVENTS, TRAINER_DEMO, BESTCOUR_RESOURCES } from './data.js';
import { api } from './api.js';
import { authManager } from './auth.js';

// Configuration API
const API_URL = 'http://localhost:5000/api';

// État global de l'application
let currentUser = null;
let authToken = null;

// ─── Menu Hamburger ────────────────────────────────────────
export function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.toggle('active');
}

// ─── Mise à jour UI Auth ────────────────────────────────────
function updateAuthUI() {
    const user = (typeof authManager !== 'undefined') ? authManager.currentUser : null;

    const btnConnexion = document.getElementById('btn-connexion');
    const userDisplayName = document.getElementById('user-display-name');
    const sidebarUserName = document.getElementById('sidebar-user-name');

    if (user) {
        if (btnConnexion) {
            btnConnexion.textContent = `${user.prenom || user.nom || 'Mon Compte'} 👤`;
            btnConnexion.onclick = () => {
                const isInPages = window.location.pathname.includes('/pages/');
                const base = isInPages ? '' : 'frontend/pages/';
                let target = 'dashboard.html';
                if (user.role === 'admin' || user.role === 'super_admin') target = 'admin.html';
                if (user.role === 'formateur') target = 'formateur.html';
                window.location.href = base + target;
            };
        }
        if (userDisplayName) userDisplayName.textContent = `${user.prenom || ''} ${user.nom || ''}`;
        if (sidebarUserName) sidebarUserName.textContent = `${user.prenom || ''} ${user.nom || ''}`;
    } else {
        if (btnConnexion) {
            btnConnexion.textContent = 'Connexion';
            const isInPages = window.location.pathname.includes('/pages/');
            btnConnexion.onclick = () => {
                window.location.href = isInPages ? 'login.html' : 'frontend/pages/login.html';
            };
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Synchroniser l'état global avec authManager
    if (typeof authManager !== 'undefined') {
        currentUser = authManager.currentUser;
        authToken = authManager.token;
    } else {
        // Fallback pour assurer que currentUser n'est pas indéfini
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        authToken = localStorage.getItem('access_token');
    }

    updateAuthUI();

    // Initialiser IndexedDB pour le mode hors-ligne
    if (window.dbManager) {
        try { await window.dbManager.init(); } catch(e) { console.warn('IndexedDB non disponible', e); }
    }

    // Rendu des composants
    await renderHomeFormations();
    await renderAllFormations();

    // Pages spécifiques
    if (window.location.pathname.includes('dashboard.html')) {
        await renderDashboard();
    }
    if (window.location.pathname.includes('formateur.html')) {
        await renderTrainerDashboard();
    }
    if (window.location.pathname.includes('admin.html')) {
        await renderAdminPanel();
    }
    if (window.location.pathname.includes('evenements.html')) {
        renderEvents();
    }
    if (window.location.pathname.includes('formations.html')) {
        setupSearchFilter();
    }

    // Initialiser les animations
    initAnimations();

    // Enregistrer le service worker pour PWA
    if ('serviceWorker' in navigator) {
        // Détecter le chemin racine dynamiquement
        const swPath = window.location.pathname.includes('/frontend/')
            ? '../../sw.js'
            : 'sw.js';
        navigator.serviceWorker.register(swPath)
            .then(reg => console.log('SW enregistré', reg))
            .catch(err => console.warn('SW non enregistré (normal en local)', err));
    }
});

// Fonction d'authentification générique corrigée
export async function handleAuth(event, type = 'login') {
    if (event) event.preventDefault();
    
    showToast('Traitement en cours...', 'info');
    
    try {
        let authData;
        
        if (type === 'login') {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-pass').value; // CORRIGÉ: login-pass
            authData = await authManager.asyncLogin(email, password);
        } else {
            // Register Mode
            const userData = {
                nom: document.getElementById('reg-nom').value,
                prenom: document.getElementById('reg-prenom').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-pass').value,
                role: 'etudiant'
            };
            authData = await authManager.register(userData);
            showToast('Compte créé ! Vérifiez vos emails.', 'success');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        console.log(`${type} success:`, authData);
        showToast(`Bienvenue, ${authData.user.prenom || authData.user.nom} !`, 'success');
        
        // Redirection intelligente
        setTimeout(() => {
            const user = authData.user;
            let target = 'dashboard.html';
            if (user.role === 'admin' || user.role === 'super_admin') target = 'admin.html';
            if (user.role === 'formateur') target = 'formateur.html';
            
            const isInPages = window.location.pathname.includes('/pages/');
            window.location.href = isInPages ? target : `frontend/pages/${target}`;
        }, 800);
        
    } catch (err) {
        console.error(`${type} failed:`, err);
        showToast(err.message, 'error');
        
        const errorDiv = document.getElementById(`${type}-error`);
        if (errorDiv) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    }
}

// Dashboard avec API réelle et Fallback Démo
export async function renderDashboard() {
    const container = document.getElementById('enrolled-courses-container');
    if (!container) return;

    // 1. Déterminer l'utilisateur courant (via authManager ou STUDENT_DEMO)
    const user = (typeof authManager !== 'undefined') ? authManager.getCurrentUser() : STUDENT_DEMO;
    if (!user) {
        const isInPages = window.location.pathname.includes('/pages/');
        window.location.href = isInPages ? 'login.html' : 'frontend/pages/login.html';
        return;
    }

    // --- Loading State ---
    container.innerHTML = '<div class="loading-skeleton">Chargement de votre univers...</div>';

    try {
        let enrollments = [];
        
        // --- Fetch Real Data if Access Token exists ---
        if (localStorage.getItem('access_token')) {
            try {
                const apiEnrollments = await api.getEnrollments();
                enrollments = apiEnrollments.map(e => ({
                    ...e,
                    id: e.formation_id || e.id,
                    titre: e.titre || `Formation #${e.formation_id}`,
                    progression: e.progression || 0,
                    image: e.image
                }));
            } catch (apiErr) {
                console.warn("API Enrollments failed, fallback to local/mock");
            }
        }

        // --- Demo Data Rehydration (if no API data or specific demo user) ---
        if (enrollments.length === 0 && user.id === 'std-001') {
            const savedProgress = JSON.parse(localStorage.getItem('demo_student_progress') || '{}');
            const savedScores = JSON.parse(localStorage.getItem('demo_student_scores') || '{}');
            user.progression = { ...user.progression, ...savedProgress };
            user.scores = { ...user.scores, ...savedScores };

            enrollments = (user.formations || []).map(fid => {
                const f = FORMATIONS.find(item => item.id === fid);
                return {
                    id: fid,
                    formation_id: fid,
                    titre: f ? f.titre : `Formation #${fid}`,
                    progression: user.progression ? (user.progression[fid] || 0) : 0
                };
            });
        }

        // --- NEW: Update global stats ---
        updateDashboardStats(enrollments);

        if (enrollments.length === 0) {
            container.innerHTML = `<div class="empty-state" style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:20px; border:1px dashed rgba(212,175,55,0.3)"><p class="text-muted">Aucune formation en cours pour le moment.</p><a href="formations.html" class="btn-gold-sm" style="display:inline-block; margin-top:1rem">Découvrir le catalogue</a></div>`;
            return;
        }

        container.innerHTML = enrollments.map(e => `
            <div class="course-progress-card" data-animate>
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3 style="margin-top:0">${e.titre}</h3>
                    <span class="badge-gold" style="font-size:0.7rem; padding:4px 8px; background:rgba(212,175,55,0.1); border-radius:8px; border:1px solid rgba(212,175,55,0.3); color:var(--gold-primary)">EN COURS</span>
                </div>
                <div class="progress-wrap">
                    <div class="progress-fill" style="width: ${e.progression || 0}%"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem">
                    <span style="font-size:0.9rem; color:var(--text-muted)">${e.progression || 0}% Complété</span>
                    ${e.progression >= 100 ? `<button onclick="generateCertificate(${e.formation_id || e.id})" class="btn-gold-sm">📜 Certificat</button>` : `<button onclick="continueCourse(${e.formation_id || e.id})" class="btn-gold-sm">Continuer →</button>`}
                </div>
            </div>
        `).join('');

        // Rendu des autres onglets si présents
        renderResources();
        loadMessages();
        loadNotifications();
        initAnimations();

    } catch (error) {
        console.error('Erreur Dashboard:', error);
        container.innerHTML = `
            <div class="error-state" style="text-align:center; padding:2rem;">
                <p class="text-muted">Impossible de charger vos formations en temps réel.</p>
                <button onclick="location.reload()" class="btn-gold-sm">Actualiser</button>
            </div>`;
    }
}

/**
 * Calcul des statistiques de progression pour le Header du Dashboard
 */
export function updateDashboardStats(enrollments) {
    const statsContainer = document.getElementById('dashboard-stats-summary');
    if (!statsContainer) return;

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progression >= 100).length;
    const avgProgress = totalCourses > 0 
        ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progression, 0) / totalCourses) 
        : 0;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <span class="stat-value">${totalCourses}</span>
            <span class="stat-label">Cours Inscrits</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${avgProgress}%</span>
            <span class="stat-label">Progression Moyenne</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${completedCourses}</span>
            <span class="stat-label">Certifications</span>
        </div>
    `;
}

/**
 * Met à jour la progression d'un cours (Demo)
 */
export function updateCourseProgress(formationId, progressIncrease = 10) {
    const user = (typeof authManager !== 'undefined') ? authManager.getCurrentUser() : STUDENT_DEMO;
    if (!user) return;

    if (!user.progression) user.progression = {};
    const current = user.progression[formationId] || 0;
    user.progression[formationId] = Math.min(100, current + progressIncrease);

    // Persister
    if (user.id === 'std-001') {
        localStorage.setItem('demo_student_progress', JSON.stringify(user.progression));
    }
    
    showToast(`Progression mise à jour : ${user.progression[formationId]}% 🚀`);
    
    // Rafraîchir l'UI si on est sur le dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        renderDashboard();
    }
}

// Render resources from BestCours based on enrolled formations
/**
 * Filtre les ressources BestCours par recherche et catégorie
 */
export function filterResources() {
    const searchVal = document.getElementById('resource-search')?.value.toLowerCase() || '';
    const catVal = document.getElementById('resource-category')?.value || 'all';
    
    const filtered = BESTCOUR_RESOURCES.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchVal) || 
                            res.category.toLowerCase().includes(searchVal);
        const matchesCat = catVal === 'all' || res.category.includes(catVal);
        return matchesSearch && matchesCat;
    });

    renderResources(filtered);
}

/**
 * Rendu des ressources BestCours
 */
export function renderResources(filteredList = null) {
    const grid = document.getElementById('resource-grid');
    if (!grid) return;

    const resources = filteredList || BESTCOUR_RESOURCES; 
    
    if (resources.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">Aucune ressource trouvée pour cette recherche.</div>`;
        return;
    }

    grid.innerHTML = resources.map(res => `
        <div class="resource-card" data-animate style="background: rgba(20,20,20,0.8); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 20px; padding: 1.5rem; transition: 0.3s; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; backdrop-filter:blur(10px);">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <div class="resource-icon" style="min-width:50px; height:50px; border-radius:12px; background:rgba(212,175,55,0.1); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                    ${res.type === 'pdf' ? '📄' : '🎥'}
                </div>
                <div class="resource-info">
                    <span class="badge-gold" style="font-size: 0.6rem; padding: 2px 8px; margin-bottom: 0.4rem; display: inline-block; background:rgba(212,175,55,0.1); color:var(--gold-primary); border-radius:5px; border:1px solid rgba(212,175,55,0.2)">${res.category}</span>
                    <h4 style="color: var(--white); margin: 0; line-height: 1.3; font-size:0.95rem;">${res.title}</h4>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 0.75rem; color: var(--text-muted);">BestCours.com</span>
                <button class="btn-gold-sm" onclick="window.open('${res.link}', '_blank')" style="padding: 6px 12px; font-size:0.8rem;">
                    ${res.type === 'pdf' ? 'Voir PDF' : 'Suivre Tuto'}
                </button>
            </div>
        </div>
    `).join('');
    
    initAnimations();
}

/**
 * Téléchargement réel de ressources
 */
export function downloadResource(filename) {
    showToast(`Préparation du téléchargement : ${filename}...`);
    const url = api.getDownloadUrl(filename);
    
    // Create a temporary link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Inscription avec paiement réel
export async function enrollInFormation(formationId) {
    if (!currentUser) {
        showToast('Veuillez vous connecter', 'warning');
        const isInPages = window.location.pathname.includes('/pages/');
        setTimeout(() => window.location.href = isInPages ? 'login.html' : 'frontend/pages/login.html', 1000);
        return;
    }
    
    // Vérifier si déjà inscrit
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}/enrollments`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const enrollments = await response.json();
        
        if (enrollments.some(e => e.formation_id === formationId)) {
            showToast('Vous êtes déjà inscrit à cette formation', 'info');
            const isInPages = window.location.pathname.includes('/pages/');
            setTimeout(() => window.location.href = isInPages ? 'dashboard.html' : 'frontend/pages/dashboard.html', 1000);
            return;
        }
    } catch (e) {
        console.error(e);
    }
    
    // Rediriger vers paiement
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = (isInPages ? '' : 'frontend/pages/') + `paiement.html?fid=${formationId}`;
}

// Traitement du paiement
async function processPayment() {
    const phone = document.getElementById('pay-phone').value;
    const name = document.getElementById('pay-name').value;
    const selectedOp = document.querySelector('.pay-method-btn.active')?.dataset.op;
    const formationId = new URLSearchParams(window.location.search).get('fid');
    
    if (!phone || phone.length < 10) {
        showToast('Numéro de téléphone invalide', 'error');
        return;
    }
    
    if (!selectedOp) {
        showToast('Sélectionnez un mode de paiement', 'error');
        return;
    }
    
    // Afficher modal de chargement
    const modal = document.getElementById('ussd-modal');
    modal.style.display = 'flex';
    
    try {
        const response = await fetch(`${API_URL}/payments/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                formationId: parseInt(formationId),
                operateur: selectedOp,
                telephone: phone,
                montant: document.getElementById('display-price').innerText.replace(' Ar', '')
            })
        });
        
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error("API non-JSON response:", text);
            throw new Error(`Le serveur a renvoyé une réponse inattendue (${response.status})`);
        }

        if (!response.ok) throw new Error(data.error || 'Erreur API');
        
        // Afficher succès
        document.getElementById('ussd-step-loading').style.display = 'none';
        document.getElementById('ussd-step-success').style.display = 'block';
        
        // Sauvegarder localement pour mode hors-ligne
        if (window.dbManager) {
            await window.dbManager.enroll(parseInt(formationId));
        }
        
    } catch (error) {
        showToast(error.message, 'error');
        modal.style.display = 'none';
    }
}

// Génération de certificat PDF
export async function generateCertificate(formationId) {
    if (!currentUser) return;
    
    showToast('Génération du certificat en cours...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/generate-certificate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                formationId: formationId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.open(data.certificateUrl, '_blank');
            showToast('Certificat généré avec succès !', 'success');
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Export Excel (admin)
async function exportFinancialReport() {
    showToast('Génération du rapport Excel...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/payments/report/excel`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_financier_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        
        showToast('Rapport téléchargé !', 'success');
        
    } catch (error) {
        showToast('Erreur lors de l\'export', 'error');
    }
}

// Newsletter avec envoi réel
async function subscribeNewsletter(email) {
    try {
        const response = await fetch(`${API_URL}/newsletter/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showToast('Inscription à la newsletter réussie !', 'success');
        } else {
            throw new Error();
        }
    } catch (error) {
        showToast('Erreur lors de l\'inscription', 'error');
    }
}

// Notifications push
async function subscribeToPushNotifications() {
    const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'; // Remplacer par votre clé VAPID
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            await fetch(`${API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
            showToast('Notifications activées !', 'success');
        } catch(e) {
            console.warn('Push notifications non disponibles', e);
        }
    }
}

// Utilitaires
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    toast.style.cssText = `background:${colors[type] || colors.success}; color:#fff; padding:1rem 2rem; border-radius:12px; margin-top:10px; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.3); cursor:pointer`;
    toast.innerText = message;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

export function logout() {
    if (typeof authManager !== 'undefined') {
        authManager.logout();
    } else {
        localStorage.clear();
        window.location.href = '/';
    }
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ─── Quiz Score Persistence ───────────────────────────────
export async function saveQuizScore(fid, qid, score, total, passed) {
    const user = (typeof authManager !== 'undefined') ? authManager.getCurrentUser() : STUDENT_DEMO;
    if (!user) return;

    const data = {
        userId: user.id || 'std-001',
        formationId: fid,
        chapterId: qid,
        score: score,
        total: total,
        passed: passed,
        timestamp: Date.now()
    };

    // 1. Sauvegarde locale (IndexedDB / LocalStorage)
    if (window.dbManager) {
        await window.dbManager.saveQuizResult(data);
    }
    
    // Sync to localStorage for teacher dashboard demo
    const demoScores = JSON.parse(localStorage.getItem('demo_student_scores') || '{}');
    demoScores[fid] = score;
    localStorage.setItem('demo_student_scores', JSON.stringify(demoScores));

    // 2. Notification auto
    if (passed) {
        showToast("Progression enregistrée ! 📈", "success");
        // Automatically update progress if passed
        updateCourseProgress(fid, 10);
    }
}

// ─── Rendu des Événements ───────────────────────────────────
function renderEvents() {
    const grid = document.getElementById('events-grid');
    if (!grid || typeof EVENTS === 'undefined') return;

    if (EVENTS.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); text-align:center">Aucun événement prévu pour le moment.</p>';
        return;
    }

    grid.innerHTML = EVENTS.map(evt => {
        const imgUrl = evt.image.startsWith('http') ? evt.image : resolveImgPath(evt.image);
        const dateStr = evt.date ? new Date(evt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        return `
        <div class="news-card" data-animate>
            <div class="news-img" style="background-image: url('${imgUrl}')"></div>
            <div class="news-body">
                <span class="news-date">${dateStr} ${evt.heure ? '· ' + evt.heure : ''}</span>
                ${evt.badge ? `<span style="font-size:0.75rem; background:var(--gold-gradient); color:#000; padding:3px 10px; border-radius:50px; font-weight:800; margin-left:8px">${evt.badge}</span>` : ''}
                <h4 style="margin:0.7rem 0">${evt.titre}</h4>
                <p style="color:var(--text-muted); font-size:0.9rem">${evt.description}</p>
                <a href="#" onclick="registerEvent('${evt.id}', event)" style="color:var(--gold-primary); font-size:0.9rem; font-weight:600">S'inscrire →</a>
            </div>
        </div>`;
    }).join('');

    initAnimations();
}

function registerEvent(evtId, e) {
    if (e) e.preventDefault();
    if (typeof authManager !== 'undefined' && !authManager.isLoggedIn()) {
        showToast('Connectez-vous pour vous inscrire à cet événement', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    if (window.dbManager) {
        window.dbManager.registerEvent({ eventId: evtId, userId: currentUser?.id || 'guest' });
    }
    showToast('Inscription à l\'événement confirmée ! 🎉', 'success');
    
    // Simuler la génération de badge
    setTimeout(() => {
        if (confirm("Votre badge de participant est prêt ! Voulez-vous le voir ?")) {
            showEventBadge(evtId);
        }
    }, 1000);
}

function showEventBadge(evtId) {
    const evt = EVENTS.find(e => e.id === evtId);
    if (!evt) return;

    const user = (typeof authManager !== 'undefined') ? authManager.currentUser : STUDENT_DEMO;
    if (!user) return;

    let modal = document.getElementById('badge-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'badge-modal';
        modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; display:flex; align-items:center; justify-content:center; padding:2rem";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="badge-card" style="background:#fff; color:#000; width:350px; border-radius:24px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5); text-align:center; position:relative">
            <div style="background:var(--gold-gradient); padding:2rem; color:#000">
                <img src="../img/Logo_Tia_Infos.jpg" alt="Logo" style="height:50px; border-radius:10px; margin-bottom:1rem">
                <h3 style="margin:0; letter-spacing:2px">PARTICIPANT</h3>
            </div>
            <div style="padding:2rem">
                <div style="font-size:3rem; margin-bottom:1rem">🎓</div>
                <h2 style="margin:0; color:#1a1a1a">${user.prenom || user.username} ${user.nom || ''}</h2>
                <p style="color:#666; margin:0.5rem 0">${evt.titre}</p>
                <div style="background:#f0f0f0; padding:1rem; border-radius:10px; margin-top:1.5rem">
                    <span style="font-family:monospace; font-weight:700">TIA-EVT-2026-${Math.floor(Math.random()*9999)}</span>
                </div>
            </div>
            <div style="padding:1.5rem; border-top:1px dashed #ddd; background:#fafafa; display:flex; justify-content:space-between; align-items:center">
                <span style="font-size:0.7rem; color:#999">TOAMASINA 2026</span>
                <button onclick="document.getElementById('badge-modal').remove()" class="btn-gold-sm">Fermer</button>
            </div>
        </div>
    `;
}

// ─── Recherche & filtre formations ─────────────────────────
function setupSearchFilter() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (cat) {
        filterFormations(cat, true);
    } else {
        renderAllFormations();
    }
}

function filterFormations(query, isCategoryExact = false) {
    const grid = document.getElementById('formations-grid');
    if (!grid || typeof FORMATIONS === 'undefined') return;

    const q = query.toLowerCase().trim();
    let filtered;
    
    if (isCategoryExact) {
        // e.g., cat=tech matched against catégorie 'informatique' (or just includes)
        filtered = FORMATIONS.filter(f => {
            const catId = f.categorie.toLowerCase();
            if (q === 'tech' && catId === 'informatique') return true;
            if (q === 'langues' && catId === 'langues') return true;
            if (q === 'gestion' && catId === 'gestion') return true;
            if (q === 'design' && catId === 'design') return true;
            return false;
        });
    } else {
        filtered = q ? FORMATIONS.filter(f =>
            f.titre.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            (CATEGORIES[f.categorie]?.label || '').toLowerCase().includes(q)
        ) : FORMATIONS;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted); text-align:center; grid-column:1/-1">Aucune formation ne correspond à votre recherche.</p>`;
        return;
    }
    grid.innerHTML = filtered.map(f => createFormationCard(f)).join('');
    initAnimations();
}

// ─── Dashboard Tabs ─────────────────────────────────────────
export function switchDashTab(tabName, linkEl) {
    // Masquer tous les onglets
    document.querySelectorAll('[id^="tab-"]').forEach(tab => tab.style.display = 'none');
    // Désactiver tous les liens
    document.querySelectorAll('.dash-nav-link').forEach(l => l.classList.remove('active'));
    // Afficher l'onglet sélectionné
    const target = document.getElementById('tab-' + tabName);
    if (target) target.style.display = 'block';
    if (linkEl) linkEl.classList.add('active');
    
    // Actions supplémentaires par onglet
    if (tabName === 'courses') renderDashboard();
    if (tabName === 'resources') renderResources();
    if (tabName === 'messaging') loadMessages();
    if (tabName === 'notifs') loadNotifications();
    
    // Trainer Tabs
    if (tabName === 'stats-prof') loadTrainerStats();
    if (tabName === 'courses-prof') loadTrainerCourses();
    if (tabName === 'students-prof') loadTrainerStudents();
    if (tabName === 'quiz-prof') loadTrainerQuizzes();
    if (tabName === 'grading-prof') loadTrainerGrading();
    if (tabName === 'planning-prof') loadTrainerPlanning();
}

// ─── Trainer Dashboard (Module Formateur) ───────────────────
export async function renderTrainerDashboard() {
    const user = (typeof authManager !== 'undefined') ? authManager.currentUser : TRAINER_DEMO;
    if (!user || user.role !== 'formateur') {
        console.warn("Accès formateur restreint (Démo activée)");
    }
    
    loadTrainerStats();
    // Default tab
    switchDashTab('stats-prof', document.querySelector('.prof-nav-link.active'));
}

function loadTrainerStats() {
    const user = (typeof authManager !== 'undefined') ? authManager.getCurrentUser() : TRAINER_DEMO;
    const stats = (user && user.role === 'formateur') ? user : TRAINER_DEMO;
    const container = document.getElementById('tab-stats-prof');
    if (!container) return;

    const statValues = container.querySelectorAll('.prof-stat-value');
    if (statValues.length >= 2) {
        statValues[0].innerText = stats.activeStudents || 42;
        // statValues[1] is Success rate (hardcoded for now)
    }
}

function loadTrainerCourses() {
    const container = document.getElementById('tab-courses-prof');
    if (!container) return;

    // Get current trainer's courses
    const user = (typeof authManager !== 'undefined') ? authManager.getCurrentUser() : TRAINER_DEMO;
    const trainerCoursesIds = user.courses || [2, 8];
    const trainerCourses = FORMATIONS.filter(f => trainerCoursesIds.includes(f.id));
    
    // Also include local new courses
    const localCourses = JSON.parse(localStorage.getItem('trainer_new_courses') || '[]');
    const allCourses = [...trainerCourses, ...localCourses];

    const listHtml = allCourses.map(f => `
        <div class="prof-course-card" data-animate>
            <div class="prof-course-info">
                <h3>📁 ${f.titre}</h3>
                <p class="prof-course-meta">Catégorie: ${CATEGORIES[f.categorie]?.label || f.categorie} · ${f.duree || 'Durée indéterminée'}</p>
            </div>
            <div class="prof-course-actions">
                <button class="btn-gold-sm" onclick="openCourseEditor(${f.id})">Modifier ⚙️</button>
            </div>
        </div>
    `).join('');

    // Clear existing besides the "Add" button
    const gridInner = container.querySelector('.prof-main-content') || container;
    const existingCards = container.querySelectorAll('.prof-course-card');
    existingCards.forEach(c => c.remove());
    
    const addButton = container.querySelector('button[onclick*="showToast(\'Ouverture de l\'editor...\')"]') 
                    || container.querySelector('button.btn-gold');
    
    if (addButton) {
        // Update the add button to use our new modal
        addButton.setAttribute('onclick', 'openCourseEditor()');
        addButton.insertAdjacentHTML('beforebegin', listHtml);
    }
}

// Modal Management
export function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
}

export function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
}

// Course Editor Logic
export function openCourseEditor(id = null) {
    const modal = document.getElementById('course-modal');
    const form = document.getElementById('course-form');
    if (!modal || !form) return;

    form.reset();
    form.dataset.editId = id || '';

    if (id) {
        const course = FORMATIONS.find(f => f.id === parseInt(id)) 
                     || JSON.parse(localStorage.getItem('trainer_new_courses') || '[]').find(f => f.id === parseInt(id));
        if (course) {
            document.getElementById('course-title').value = course.titre;
            document.getElementById('course-desc').value = course.description || '';
            document.getElementById('course-type').value = course.type || 'video';
            document.getElementById('course-url').value = course.url || '';
        }
    }

    openModal('course-modal');
}

export function saveCourse() {
    const form = document.getElementById('course-form');
    const editId = form.dataset.editId;
    
    const newCourse = {
        id: editId ? parseInt(editId) : Date.now(),
        titre: document.getElementById('course-title').value,
        description: document.getElementById('course-desc').value,
        categorie: 'informatique', // Default for now
        type: document.getElementById('course-type').value,
        url: document.getElementById('course-url').value,
        duree: "4h", // Mock
        image: "img/nos-formations.jpg"
    };

    if (editId) {
        // Simulation edit logic...
        showToast('Module mis à jour avec succès !');
    } else {
        const localCourses = JSON.parse(localStorage.getItem('trainer_new_courses') || '[]');
        localCourses.push(newCourse);
        localStorage.setItem('trainer_new_courses', JSON.stringify(localCourses));
        showToast('Nouveau module créé !');
    }

    closeModal('course-modal');
    loadTrainerCourses();
}

// Quiz Editor Logic
let currentQuizEdit = null;

export function openQuizEditor(qid = 'ch1') {
    currentQuizEdit = JSON.parse(JSON.stringify(QUIZZES_DATA[qid] || { title: "Nouveau Quiz", questions: [] }));
    document.getElementById('quiz-edit-title').value = currentQuizEdit.title;
    renderQuizQuestionsEdit();
    openModal('quiz-modal');
}

function renderQuizQuestionsEdit() {
    const list = document.getElementById('quiz-questions-list');
    list.innerHTML = currentQuizEdit.questions.map((q, qIdx) => `
        <div class="quiz-question-edit">
            <div class="form-group">
                <label>Question ${qIdx + 1}</label>
                <input type="text" value="${q.q}" onchange="updateQuizData(${qIdx}, 'q', this.value)">
            </div>
            <div class="options-edit">
                ${q.options.map((opt, oIdx) => `
                    <div class="quiz-option-edit">
                        <input type="radio" name="q-${qIdx}" ${q.correct === oIdx ? 'checked' : ''} onchange="updateQuizData(${qIdx}, 'correct', ${oIdx})">
                        <input type="text" value="${opt}" onchange="updateQuizOptionData(${qIdx}, ${oIdx}, this.value)">
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

window.updateQuizData = (qIdx, key, val) => {
    currentQuizEdit.questions[qIdx][key] = val;
};

window.updateQuizOptionData = (qIdx, oIdx, val) => {
    currentQuizEdit.questions[qIdx].options[oIdx] = val;
};

export function addQuizQuestionEdit() {
    currentQuizEdit.questions.push({
        q: "Nouvelle Question ?",
        options: ["Option A", "Option B", "Option C"],
        correct: 0
    });
    renderQuizQuestionsEdit();
}

export function saveQuiz() {
    currentQuizEdit.title = document.getElementById('quiz-edit-title').value;
    // Persist to LocalStorage for demo
    const localQuizzes = JSON.parse(localStorage.getItem('trainer_custom_quizzes') || '{}');
    localQuizzes[Date.now()] = currentQuizEdit;
    localStorage.setItem('trainer_custom_quizzes', JSON.stringify(localQuizzes));

    showToast('Quiz enregistré avec succès !');
    closeModal('quiz-modal');
}

// Grading Logic
export function openGradingModal(student, task) {
    document.getElementById('grade-student-name').innerText = student;
    document.getElementById('grade-course-title').innerText = task;
    openModal('grading-modal');
}

export function submitGrade() {
    const val = document.getElementById('grade-value').value;
    const comment = document.getElementById('grade-comment').value;
    
    showToast(`Note de ${val}/100 validée pour l'étudiant !`);
    closeModal('grading-modal');
    
    // Refresh student list to show update if needed
    loadTrainerStudents();
}

// Refresh Trainer Dashboard components on tab switch
function loadTrainerStudents() {
    const tableBody = document.querySelector('#prof-student-table tbody');
    const latestBody = document.getElementById('latest-enrollments-body');
    if (!tableBody && !latestBody) return;

    const students = [
        { name: "Nicolas Razakamahefa", course: "Web Fullstack", active: "En ligne", score: "95/100", progress: 45 },
        { name: "Lova Fenitra", course: "Marketing Digital", active: "Hier", score: "Pending", progress: 10 }
    ];

    if (tableBody) {
        tableBody.innerHTML = students.map(s => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:0.8rem">
                        <div class="prof-avatar" style="width:30px; height:30px; font-size:0.7rem">${s.name.split(' ').map(n=>n[0]).join('')}</div>
                        <span>${s.name}</span>
                    </div>
                </td>
                <td>${s.course}</td>
                <td>${s.active}</td>
                <td><span class="badge-${s.score === 'Pending' ? 'warning' : 'success'}" style="padding:4px 8px; border-radius:8px; font-size:0.8rem">${s.score}</span></td>
                <td><button class="btn-gold-sm" onclick="openStudentChat('${s.name}')">Chat 💬</button></td>
            </tr>
        `).join('');
    }

    if (latestBody) {
        latestBody.innerHTML = students.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.course}</td>
                <td>${s.active === 'En ligne' ? 'Aujourd\'hui' : 'Hier'}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px">
                        <div class="progress-wrap" style="height:6px; flex:1; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
                            <div class="progress-fill" style="width:${s.progress}%; height:100%; background:var(--gold-gradient)"></div>
                        </div>
                        <span style="font-size:0.7rem">${s.progress}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

function loadTrainerQuizzes() {
    const container = document.getElementById('tab-quiz-prof');
    if (!container) return;

    const quizList = Object.keys(QUIZZES_DATA).map(key => {
        const q = QUIZZES_DATA[key];
        return `
            <div class="prof-course-card">
                <div class="prof-course-info">
                    <h3>📝 Quiz : ${q.title}</h3>
                    <p class="prof-course-meta">${q.questions.length} Questions · Actif</p>
                </div>
                <div class="prof-course-actions">
                    <button class="btn-gold-sm" onclick="openQuizEditor('${key}')">Éditer ✍️</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="section-header" style="margin-bottom:2rem">
            <h2>Gestion des <span class="gradient-text">Quiz</span></h2>
            <p>Créez et modifiez les évaluations par chapitre.</p>
        </div>
        ${quizList}
        <button class="btn-gold" style="width:100%; border-radius:15px; padding:1.2rem; background:transparent; border:1px dashed var(--gold-primary); color:var(--gold-primary)" onclick="openQuizEditor()">+ CRÉER UN NOUVEAU QUIZ</button>
    `;
}

function loadTrainerGrading() {
    const container = document.getElementById('tab-grading-prof');
    if (!container) return;

    const tasks = TRAINER_DEMO.tasks || [];
    
    container.innerHTML = `
        <div class="section-header" style="margin-bottom:2rem">
            <h2>Évaluations <span class="gradient-text">& Devoirs</span></h2>
            <p>Notez les travaux pratiques de vos étudiants.</p>
        </div>
        <div class="admin-table-container">
            <table class="prof-student-table">
                <thead><tr><th>Étudiant</th><th>Cours</th><th>Travail</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                    ${tasks.map(t => `
                        <tr>
                            <td>${t.student}</td>
                            <td>${t.course}</td>
                            <td>${t.task}</td>
                            <td><span class="badge-warning">En attente</span></td>
                            <td><button class="btn-gold-sm" onclick="openGradingModal('${t.student}', '${t.task}')">Corriger ✍️</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function loadTrainerPlanning() {
    const container = document.getElementById('tab-planning-prof');
    if (!container) return;

    // Simulate upcoming sessions
    const sessions = [
        { date: "Demain", time: "14:00 - 16:00", title: "Live Intro React", type: "Masterclass" },
        { date: "Vendredi", time: "10:00 - 12:00", title: "Q&A Session", type: "Chat en direct" },
        { date: "Lundi prochain", time: "09:00 - 11:00", title: "Correction TP", type: "Atelier" }
    ];

    container.innerHTML = `
        <div class="section-header" style="margin-bottom:2rem">
            <h2>Mon <span class="gradient-text">Planning</span></h2>
            <p>Gérez vos sessions live et vos disponibilités.</p>
        </div>
        <div class="prof-stats-grid">
            ${sessions.map(s => `
                <div class="prof-stat-card" style="border-bottom:3px solid var(--gold-primary)">
                    <span class="prof-stat-label">${s.date} · ${s.time}</span>
                    <span class="prof-stat-value" style="font-size:1.2rem; margin-bottom:0.5rem; display:block">${s.title}</span>
                    <span style="font-size:0.8rem; background:rgba(212,175,55,0.1); color:var(--gold-primary); padding:3px 8px; border-radius:4px">${s.type}</span>
                </div>
            `).join('')}
        </div>
        <button class="btn-gold" style="width:100%; border-radius:15px; padding:1.2rem; background:transparent; border:1px dashed var(--gold-primary); color:var(--gold-primary); margin-top:2rem" onclick="showToast('Ouverture de l\\'agenda...')">+ PLANIFIER UNE SESSION</button>
    `;
}

// ─── Messagerie (Dashboard) ─────────────────────────────────
export function loadMessages() {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;
    
    const demoMsgs = [
        { sender: 'admin', text: 'Bienvenue Nicolas ! Comment pouvons-nous vous aider ?', timestamp: Date.now() - 3600000 },
        { sender: 'etudiant', text: 'Bonjour, j\'ai une question sur le module React.', timestamp: Date.now() - 1800000 }
    ];

    if (window.dbManager) {
        window.dbManager.getMessages().then(msgs => {
            const allMsgs = [...demoMsgs, ...msgs];
            chat.innerHTML = allMsgs.map(m => `
                <div class="chat-message ${m.sender === 'admin' ? 'admin' : 'student'}">
                    <p>${m.text}</p>
                    <span class="msg-time">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>`).join('');
            chat.scrollTop = chat.scrollHeight;
        });
    }
}

export function sendMessage(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('msg-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';

    if (window.dbManager) {
        window.dbManager.saveMessage({ text, sender: 'etudiant' }).then(() => loadMessages());
    }
    showToast('Message envoyé !');
}

// ─── Notifications (Dashboard) ──────────────────────────────
export function loadNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    const user = (typeof authManager !== 'undefined') ? authManager.getCurrentUser() : STUDENT_DEMO;
    const notifs = (user && user.notifications) ? user.notifications : [];

    if (notifs.length === 0) {
        list.innerHTML = '<p class="text-muted">🔔 Aucune notification.</p>';
        return;
    }

    list.innerHTML = notifs.map(n => `
        <div class="notification-item ${n.read ? 'read' : 'unread'}">
            <div class="notif-dot"></div>
            <div class="notif-content">
                <p>${n.text}</p>
                <span class="notif-date">${n.date}</span>
            </div>
        </div>`).join('');
}

// Continuer un cours
export function continueCourse(formationId) {
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = (isInPages ? '' : 'frontend/pages/') + `quiz.html?fid=${formationId}`;
}

// ─── Rendu des Formations ───────────────────────────────────
function resolveImgPath(imgPath, category = 'specialise') {
    const isInPages = window.location.pathname.includes('/pages/');
    const imgFolder = isInPages ? '../img/' : 'frontend/img/';
    
    // Si pas d'image, on retourne une image par défaut basée sur la catégorie
    if (!imgPath || imgPath === 'img/nos-formations.jpg') {
        switch(category.toLowerCase()) {
            case 'informatique':
            case 'ia': return imgFolder + 'cat_it.png';
            case 'langues': return imgFolder + 'cat_languages.png';
            case 'marketing':
            case 'gestion': return imgFolder + 'cat_it.png'; // Fallback to IT for now
            default: return imgFolder + 'nos-formations.jpg';
        }
    }
    
    if (imgPath.startsWith('http')) return imgPath;
    const filename = imgPath.split('/').pop();
    return imgFolder + filename;
}

export async function renderHomeFormations() {
    const grid = document.getElementById('home-formations-grid');
    if (!grid) return;
    
    try {
        const allCourses = await api.getCourses();
        const favorites = (allCourses || []).filter(f => f.populaire).slice(0, 4);
        
        if (favorites.length === 0) {
            grid.innerHTML = '<p class="text-muted">Aucune formation populaire à afficher.</p>';
            return;
        }
        
        grid.innerHTML = favorites.map(f => createFormationCard(f)).join('');
        initAnimations();
    } catch (err) {
        console.error("Failed to render home formations:", err);
        grid.innerHTML = '<p class="text-muted">Erreur lors du chargement des formations.</p>';
    }
}

export async function renderAllFormations() {
    const grid = document.getElementById('all-formations-grid-home') || document.getElementById('formations-grid');
    if (!grid) return;
    
    try {
        const allCourses = await api.getCourses();
        if (!allCourses || allCourses.length === 0) {
            grid.innerHTML = '<p class="text-muted">Le catalogue est actuellement vide.</p>';
            return;
        }
        
        grid.innerHTML = allCourses.map(f => createFormationCard(f)).join('');
        initAnimations();
    } catch (err) {
        console.error("Failed to render all formations:", err);
        grid.innerHTML = '<p class="text-muted">Erreur lors du chargement du catalogue.</p>';
    }
}

function createFormationCard(f) {
    const imgUrl = resolveImgPath(f.image, f.categorie);
    return `
        <div class="formation-card" data-category="${f.categorie}" data-animate>
            <div class="fcard-img" style="background-image: url('${imgUrl}')">
                ${f.populaire ? '<span class="fcard-badge">🔥 Populaire</span>' : ''}
            </div>
            <div class="fcard-content">
                <span class="fcard-cat">${CATEGORIES[f.categorie]?.icon || '📚'} ${CATEGORIES[f.categorie]?.label || f.categorie}</span>
                <h3 class="fcard-title">${f.titre}</h3>
                <p style="font-size:0.9rem; color:var(--text-muted); min-height:40px">${f.description}</p>
                <div class="fcard-meta">
                    <span>⌛ ${f.duree}</span>
                    <span style="color:var(--gold-primary); font-weight:bold">${f.prix}</span>
                </div>
                <button onclick="enrollInFormation(${f.id})" class="btn-gold-sm" style="width:100%; margin-top:1rem">M'inscrire</button>
            </div>
        </div>
    `;
}