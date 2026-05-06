/**
 * TIA INFO TOAMASINA — Base de Données Locale (IndexedDB)
 * Gère le stockage des cours, de la progression et de l'utilisateur hors-ligne.
 */

const DB_NAME = 'TiaInfoDB';
const DB_VERSION = 3;

class TiaDB {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('user')) db.createObjectStore('user', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('formations')) db.createObjectStore('formations', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('enrollments')) db.createObjectStore('enrollments', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('messages')) db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('event_regs')) db.createObjectStore('event_regs', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('quiz_results')) db.createObjectStore('quiz_results', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('submissions')) db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    // --- Gestion Utilisateur ---
    async saveUser(userData) {
        const tx = this.db.transaction('user', 'readwrite');
        tx.objectStore('user').put({ id: 'current_user', ...userData });
        return new Promise((res) => tx.oncomplete = () => res());
    }

    async getUser() {
        const tx = this.db.transaction('user', 'readonly');
        const store = tx.objectStore('user');
        return new Promise((res) => {
            const req = store.get('current_user');
            req.onsuccess = () => res(req.result);
        });
    }

    // --- Gestion Formations ---
    async saveFormations(formations) {
        const tx = this.db.transaction('formations', 'readwrite');
        const store = tx.objectStore('formations');
        formations.forEach(f => store.put(f));
        return new Promise((res) => tx.oncomplete = () => res());
    }

    async getAllFormations() {
        const tx = this.db.transaction('formations', 'readonly');
        const store = tx.objectStore('formations');
        return new Promise((res) => {
            const req = store.getAll();
            req.onsuccess = () => res(req.result);
        });
    }

    // --- Inscriptions ---
    async enroll(formationId) {
        const tx = this.db.transaction('enrollments', 'readwrite');
        const store = tx.objectStore('enrollments');
        store.add({ formationId, date: new Date(), progress: 0 });
        return new Promise((res) => tx.oncomplete = () => res());
    }

    async getEnrollments() {
        const tx = this.db.transaction('enrollments', 'readonly');
        const store = tx.objectStore('enrollments');
        return new Promise((res) => {
            const req = store.getAll();
            req.onsuccess = () => res(req.result);
        });
    }

    // --- Messagerie ---
    async saveMessage(msg) {
        const tx = this.db.transaction('messages', 'readwrite');
        tx.objectStore('messages').add({ ...msg, timestamp: new Date() });
        return new Promise((res) => tx.oncomplete = () => res());
    }

    async getMessages() {
        const tx = this.db.transaction('messages', 'readonly');
        return new Promise((res) => {
            const req = tx.objectStore('messages').getAll();
            req.onsuccess = () => res(req.result);
        });
    }

    // --- Quiz & Évaluations ---
    async saveQuizResult(result) {
        const tx = this.db.transaction('quiz_results', 'readwrite');
        tx.objectStore('quiz_results').add({ ...result, date: new Date() });
        return new Promise((res) => tx.oncomplete = () => res());
    }

    async getQuizResults(userId) {
        const tx = this.db.transaction('quiz_results', 'readonly');
        return new Promise((res) => {
            const req = tx.objectStore('quiz_results').openCursor();
            const results = [];
            req.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.userId === userId) results.push(cursor.value);
                    cursor.continue();
                } else {
                    res(results);
                }
            };
        });
    }

    // --- Événements ---
    async registerEvent(reg) {
        const tx = this.db.transaction('event_regs', 'readwrite');
        tx.objectStore('event_regs').add({ ...reg, date: new Date() });
        return new Promise((res) => tx.oncomplete = () => res());
    }

    async getEventRegs(userId) {
        const tx = this.db.transaction('event_regs', 'readonly');
        return new Promise((res) => {
            const req = tx.objectStore('event_regs').getAll();
            req.onsuccess = () => {
                const regs = req.result.filter(r => r.userId === userId);
                res(regs);
            };
        });
    }
}

const dbManager = new TiaDB();
window.dbManager = dbManager; // Exposer globalement pour app.js
