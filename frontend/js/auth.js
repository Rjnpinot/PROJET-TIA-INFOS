import { STUDENT_DEMO, TRAINER_DEMO } from './data.js';
import { api } from './api.js';

/**
 * TIA INFO TOAMASINA — Système d'Authentification (Version API)
 * Gère l'authentification réelle via le serveur Node.js/MySQL.
 */

class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.token = localStorage.getItem('access_token') || null;
    }

    /**
     * Connexion avec Fallback Démo
     */
    async asyncLogin(email, password) {
        try {
            const data = await api.login(email, password);
            console.log('✅ Connecté via API Real DB');
            this.saveSession(data);
            return data;
        } catch (error) {
            console.warn('⚠️ Échec Backend API, passage en mode Démo :', error.message);
            // Fallback Demo Mode
            const mockUser = (email === 'formateur@tia.mg') ? TRAINER_DEMO : STUDENT_DEMO;
            if (password === 'demo123') {
                const mockData = {
                    accessToken: 'mock-jwt-token',
                    refreshToken: 'mock-refresh-token',
                    user: mockUser
                };
                this.saveSession(mockData);
                return mockData;
            }
            throw new Error('Identifiants invalides (Mode Démo: demo123)');
        }
    }

    // Garder le nom login original pour compatibilité
    login(e, p) { return this.asyncLogin(e, p); }

    /**
     * Inscription
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'inscription');
            }

            return data;
        } catch (error) {
            console.error('Erreur Register API:', error);
            throw error;
        }
    }

    /**
     * Sauvegarde la session
     */
    saveSession(data) {
        this.currentUser = data.user;
        this.token = data.accessToken;
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Compatibilité avec l'ancien système local
        localStorage.setItem('tia_user', JSON.stringify(data.user));
    }

    /**
     * Déconnexion
     */
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tia_user');
        localStorage.removeItem('tia_tokens');
        this.currentUser = null;
        this.token = null;
        
        // Redirection vers l'accueil (racine du domaine)
        window.location.href = '/';
    }

    /**
     * Vérifier si connecté
     */
    isLoggedIn() {
        return !!this.token && !!this.currentUser;
    }

    /**
     * Obtenir l'utilisateur courant
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Vérifier les permissions
     */
    hasPermission(requiredRoles) {
        if (!this.currentUser) return false;
        return requiredRoles.includes(this.currentUser.role);
    }
}

// Instance globale
export const authManager = new AuthManager();
window.authManager = authManager;
