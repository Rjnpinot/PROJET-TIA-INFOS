/**
 * TIA INFO TOAMASINA — API Client
 * Gère les appels REST vers le backend Node.js.
 */

import { FORMATIONS } from './data.js';

const API_BASE_URL = 'http://localhost:5000/api';

class TiaAPI {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.error || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // --- Authentification ---
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Map backend 'accessToken' to our internal 'token' variable
        this.token = data.accessToken || data.token; 
        
        localStorage.setItem('access_token', this.token);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        window.location.href = '/frontend/pages/login.html';
    }

    // --- Formations ---
    async getCourses() {
        try {
            const courses = await this.request('/courses');
            return (courses && courses.length > 0) ? courses : FORMATIONS;
        } catch (e) {
            console.warn('API getCourses failed, using local data');
            return FORMATIONS;
        }
    }

    async getCourseDetails(id) {
        return this.request(`/courses/${id}`);
    }

    async getEnrollments() {
        return this.request('/users/me/enrollments');
    }

    async updateProgress(courseId, progress) {
        return this.request(`/users/me/progress`, {
            method: 'POST',
            body: JSON.stringify({ courseId, progress })
        });
    }

    // --- Ressources & Téléchargement ---
    async getResources(courseId) {
        return this.request(`/courses/${courseId}/resources`);
    }

    getDownloadUrl(filename) {
        return `http://localhost:5000/uploads/${filename}`;
    }
}

export const api = new TiaAPI();
window.tiaApi = api; // Exposer globalement pour certains scripts legacy si besoin
