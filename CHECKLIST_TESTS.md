# 🧪 LISTE DE CONTRÔLE DES TESTS - TIA INFO TOAMASINA

## ✅ VÉRIFICATIONS À FAIRE

### **1. Installation Backend**

- [ ] `cd backend` - Se placer dans le dossier
- [ ] `npm install` - Installer dépendances
- [ ] `cp .env.example .env` - Créer fichier d'env
- [ ] Éditer `.env` avec DB_HOST, DB_USER, DB_PASSWORD
- [ ] `npm run dev` - Démarrer serveur
- [ ] Vérifier : \"Connecté à MySQL\" dans le terminal

### **2. Base de Données**

- [ ] MySQL Server démarré
- [ ] Créer BD : `mysql -u root -p < backend/sql/database.sql`
- [ ] Vérifier les 9 tables créées
- [ ] Vérifier les 16 formations insérées
- [ ] Vérifier les 11 indices créés

### **3. API Endpoints**

#### Authentification
- [ ] POST `/api/auth/register` - Créer compte
  - Body: `{\"email\": \"test@example.com\", \"password\": \"password123\", \"nom\": \"Test\", \"prenom\": \"User\"}`
  - Réponse attendue: 201 + userId

- [ ] POST `/api/auth/login` - Se connecter
  - Body: `{\"email\": \"etudiant@tia.mg\", \"password\": \"demo123\"}`
  - Réponse attendue: accessToken + refreshToken + user

- [ ] GET `/api/auth/verify/:token` - Vérifier email
  - Réponse attendue: email vérifié

#### Formations
- [ ] GET `/api/courses` - Récupérer toutes les formations
  - Réponse attendue: Array de 16 formations
  - Tester filtres: `?categorie=informatique`, `?search=web`, `?populaire=true`

- [ ] GET `/api/courses/1` - Détails d'une formation
  - Réponse attendue: Détails + cours + avis

- [ ] POST `/api/courses` (Admin) - Créer formation
  - Besoin: Token Admin
  - Body: `{\"titre\": \"Nouveau Cours\", \"categorie\": \"tech\", \"prix\": 100000}`
  - Réponse attendue: 201 + formationId

- [ ] PUT `/api/courses/1` (Admin) - Modifier formation
  - Besoin: Token Admin
  - Body: `{\"titre\": \"Titre modifié\"}`
  - Réponse attendue: 200 + message

- [ ] DELETE `/api/courses/1` (Admin) - Supprimer formation
  - Besoin: Token Admin
  - Réponse attendue: 200 + message

#### Paiements
- [ ] POST `/api/payments/initiate` - Initier paiement
  - Body: `{\"userId\": 1, \"formationId\": 1, \"operateur\": \"mvola\", \"telephone\": \"+261201234567\"}`
  - Réponse attendue: 200 + transactionId

- [ ] GET `/api/payments/history/:userId` - Historique paiements
  - Besoin: Token valide
  - Réponse attendue: Array de paiements

- [ ] GET `/api/payments/status/:transactionId` - Vérifier statut
  - Réponse attendue: Détails paiement + statut

- [ ] GET `/api/payments/receipt/:paymentId` - Télécharger reçu PDF
  - Réponse attendue: Fichier PDF

- [ ] GET `/api/payments/stats/admin/all` (Admin) - Statistiques
  - Besoin: Token Admin
  - Réponse attendue: Statistiques paiements

### **4. Frontend**

- [ ] Accueil : `http://localhost:5000/`
  - [ ] Page charge correctement
  - [ ] Formations affichées
  - [ ] Navigation fonctionne

- [ ] Connexion : `http://localhost:5000/login`
  - [ ] Formulaire affiche
  - [ ] Connexion avec \"etudiant@tia.mg\" / \"demo123\"
  - [ ] Redirection vers dashboard
  - [ ] Token stocké dans localStorage

- [ ] Inscription : `http://localhost:5000/register`
  - [ ] Formulaire affiche
  - [ ] Validation des champs
  - [ ] Création de compte fonctionne
  - [ ] Message de confirmation

- [ ] Dashboard Étudiant : `http://localhost:5000/dashboard`
  - [ ] Affiche formations inscrites
  - [ ] Progression visible
  - [ ] Certificats téléchargeables

- [ ] Espace Formateur : `http://localhost:5000/formateur`
  - [ ] Connecté en tant que formateur
  - [ ] Liste des étudiants
  - [ ] Gestion des cours

- [ ] Panel Admin : `http://localhost:5000/admin`
  - [ ] Connecté en tant qu'admin
  - [ ] Dashboard avec KPIs
  - [ ] Gestion des formations
  - [ ] Statistiques paiements

### **5. Sécurité**

- [ ] JWT Token invalide → 401
- [ ] Token expiré → 401
- [ ] Admin accès refusé pour non-admin → 403
- [ ] Mot de passe hashé en BD (pas en clair)
- [ ] HTTPS à configurer en prod

### **6. Performance**

- [ ] GET `/api/courses` < 500ms
- [ ] Pas de requêtes N+1
- [ ] Indices fonctionnent correctement
- [ ] Pagination implémentée

### **7. PWA (Hors-Ligne)**

- [ ] Service Worker installé
- [ ] Offline.html configure
- [ ] Cache stratégie fonctionne
- [ ] App installable sur mobile

### **8. Email**

- [ ] Email vérifié après inscription
- [ ] Email de récupération mot de passe
- [ ] Notifications paiement reçues

### **9. Paiements**

- [ ] MVola simulé fonctionne
- [ ] Orange Money simulé fonctionne
- [ ] Airtel Money simulé fonctionne
- [ ] Reçu PDF généré
- [ ] Statut de paiement mis à jour

### **10. Erreurs & Logs**

- [ ] Aucune erreur 500 non gérée
- [ ] Messages d'erreur explicites
- [ ] Logs en console serveur
- [ ] Pas de révélation d'informations sensibles

---

## 🐛 Débogage

### Logs Importants
```bash
# Terminal serveur
npm run dev

# Devtools Navigateur (F12)
Network tab : Vérifier requêtes API
Console : Chercher erreurs JS
Storage : Vérifier tokens
```

### Tester une Route Manuellement
```bash
# Via curl
curl http://localhost:5000/api/courses

# Via Postman
1. Importer la collection API
2. Configurer variables d'env
3. Tester chaque endpoint

# Via VSCode REST Client extension
1. Créer fichier test.http
2. Envoyer requêtes
```

### Exemple test.http
```http
### Health Check
GET http://localhost:5000/api/health

### Get Courses
GET http://localhost:5000/api/courses

### Login Demo
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  \"email\": \"etudiant@tia.mg\",
  \"password\": \"demo123\"
}

### Get My Enrollments (avec token)
GET http://localhost:5000/api/users/my-enrollments
Authorization: Bearer <VOTRE_TOKEN>
```

---

## 📋 Checklist Finale

**Avant de dire \\\"Prêt en Production\\\"**

- [ ] ✅ Tous les endpoints répondent
- [ ] ✅ Authentication fonctionne
- [ ] ✅ Paiements testés
- [ ] ✅ Erreurs gérées proprement
- [ ] ✅ Frontend charges sans erreurs
- [ ] ✅ BD bien structurée
- [ ] ✅ .env configuré avec les bonnes valeurs
- [ ] ✅ .gitignore en place
- [ ] ✅ Code revu pour sécurité
- [ ] ✅ Documentation complète
- [ ] ✅ Logs visibles pour déboguer

---

## 🎯 Problèmes Courants & Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| \"Cannot POST /api/auth/login\" | Route non trouvée | Vérifier que server.js charge les routes |
| \"Connection Refused\" | MySQL pas démarré | `mysql.server start` (Mac) ou MySQL Server (Windows) |
| \"Invalid token\" | JWT_SECRET pas configuré | Ajouter JWT_SECRET dans .env |
| \"CORS Error\" | Domaine origine non autorisé | Vérifier cors() config en server.js |
| \"Accents mal affichés\" | Encodage UTF-8 | Vérifier `charset=utf8mb4` en BD |
| \"Port déjà utilisé\" | Port 5000 pris | Changer `PORT=3001` dans .env |

---

**Succès quand :**
✅ Le serveur démarre  
✅ La BD répond  
✅ Les routes retournent des données  
✅ L'authentification fonctionne  
✅ Le frontend communique avec l'API  

🎉 **Vous êtes prêt !**
