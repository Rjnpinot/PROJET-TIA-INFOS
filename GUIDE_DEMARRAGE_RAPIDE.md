# 🚀 GUIDE DE DÉMARRAGE RAPIDE - TIA INFO TOAMASINA

## 📌 Prérequis

- Node.js 16+ et npm
- MySQL Server 5.7+
- Un navigateur moderne (Chrome, Firefox, Edge)

---

## ⚙️ Installation Rapide

### 1️⃣ Cloner/Télécharger le Projet
```bash
cd PROJET\ TIA\ INFOS
```

### 2️⃣ Configurer l'Environnement Backend
```bash
cd backend
cp .env.example .env
```

**Éditer le fichier `.env`** avec vos paramètres :
```env
# Base de Données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=tia_info_db

# Sécurité (Générer des chaînes aléatoires fortes)
JWT_SECRET=votre_clé_secrete_très_longue_et_complexe_min_32_caractères
JWT_REFRESH_SECRET=votre_autre_clé_très_longue_et_complexe_min_32_caractères

# Email (Gmail avec mot de passe d'application)
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app_google

# Port (optionnel)
PORT=5000
```

### 3️⃣ Installer les Dépendances
```bash
npm install
```

### 4️⃣ Créer la Base de Données
```bash
# Ouvrir MySQL
mysql -u root -p

# Puis exécuter :
mysql> source sql/database.sql;
```

**OU en ligne de commande :**
```bash
mysql -u root -p < sql/database.sql
```

### 5️⃣ Démarrer le Serveur Backend
```bash
npm run dev
```

**Résultat attendu :**
```
✅ Connecté à MySQL (tia_info_db)
🚀 Serveur en ligne sur http://localhost:5000
```

### 6️⃣ Ouvrir le Frontend
Dans le navigateur :
```
http://localhost:5000/
```

---

## 🧪 Tester l'API

### Vérifier la Connexion
```bash
curl http://localhost:5000/api/health
```

Réponse attendue :
```json
{ "status": "ok", "db_connected": true }
```

### Récupérer les Formations
```bash
curl http://localhost:5000/api/courses
```

### Se Connecter (Mode Démo)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"etudiant@tia.mg", "password":"demo123"}'
```

---

## 👥 Comptes de Test (Mode Démo)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Étudiant | `etudiant@tia.mg` | `demo123` |
| Formateur | `formateur@tia.mg` | `demo123` |
| Admin | `admin@tia.mg` | `demo123` |

---

## 🗂️ Structure du Projet

```
PROJET TIA INFOS/
├── backend/                    # API Node.js
│   ├── controllers/           # Logique métier
│   ├── routes/               # Endpoints API
│   ├── middleware/           # Authentification, validation
│   ├── utils/               # Services (email, PDF, paiement)
│   ├── sql/                 # Schéma base de données
│   ├── package.json         # Dépendances
│   ├── server.js            # Point d'entrée
│   └── .env                 # Variables d'environnement (à créer)
│
├── frontend/                   # Interface Web
│   ├── pages/               # Pages HTML
│   ├── js/                 # JavaScript (modules)
│   ├── css/                # Feuilles de styles
│   ├── img/                # Images
│   └── data/               # Données statiques
│
├── index.html              # Accueil
├── manifest.json           # Configuration PWA
├── sw.js                   # Service Worker
├── README.md               # Documentation
└── CORRECTIONS_EFFECTUEES.md  # Liste des corrections
```

---

## 📖 Pages Principales

| URL | Description |
|-----|-------------|
| `/` | Accueil public |
| `/login` | Connexion |
| `/register` | Inscription |
| `/dashboard` | Espace étudiant |
| `/formateur` | Espace formateur |
| `/admin` | Tableau de bord admin |
| `/formations` | Catalogue complet |

---

## 🔌 Endpoints API Principaux

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/verify/:token` - Vérifier email

### Formations
- `GET /api/courses` - Lister les formations
- `GET /api/courses/:id` - Détails formation
- `POST /api/courses` (admin) - Créer formation
- `PUT /api/courses/:id` (admin) - Modifier formation
- `DELETE /api/courses/:id` (admin) - Supprimer formation

### Paiements
- `POST /api/payments/initiate` - Payer une formation
- `GET /api/payments/history/:userId` - Historique paiements
- `GET /api/payments/status/:transactionId` - Statut paiement
- `GET /api/payments/receipt/:paymentId` - Télécharger reçu

### Utilisateurs
- `GET /api/users/profile/:id` - Profil utilisateur
- `PUT /api/users/profile/:id` - Mettre à jour profil
- `GET /api/users/my-enrollments` - Mes inscriptions

---

## 🐛 Dépannage

### ❌ "Impossible de se connecter à MySQL"
```bash
# Vérifier que MySQL est démarré
mysqld  # Windows
# ou
mysql.server start  # Mac

# Vérifier les identifiants en .env
```

### ❌ "Port 5000 déjà utilisé"
```bash
# Utiliser un port différent
PORT=3001 npm run dev
```

### ❌ "Token invalide"
- Vérifier que JWT_SECRET est configuré dans `.env`
- Régénérer les tokens de test

### ❌ "Erreur d'email non envoyé"
- Configurer un compte Gmail avec authentification d'application
- Activer les apps moins sécurisées si nécessaire

---

## 📱 Mode PWA (Hors-Ligne)

1. Ouvrir l'application dans Chrome
2. Cliquer sur l'icône d'installation (haut à droite)
3. "Installer"
4. L'app fonctionne maintenant hors-ligne

---

## 🔐 Sécurité - Avant Production

- [ ] Générer JWT_SECRET fort (32+ caractères aléatoires)
- [ ] Générer JWT_REFRESH_SECRET fort
- [ ] Configurer HTTPS (certificat SSL)
- [ ] Activer CORS que pour domaines autorisés
- [ ] Activer rate-limiting
- [ ] Configurer vraies APIs paiement (MVola, Orange Money)
- [ ] Configurer alertes d'erreurs
- [ ] Ajouter monitoring

---

## 📚 Documentation Supplémentaire

- 📄 [Documentation Technique API](./docs/DOC_TECHNIQUE_API.md)
- 👨‍💼 [Guide Administrateur](./docs/GUIDE_ADMIN.md)
- 👨‍🎓 [Guide Étudiant](./docs/GUIDE_ETUDIANT.md)
- 🚀 [Guide de Déploiement](./docs/MANUAL_DEPLOIEMENT.md)

---

## 💬 Support

Pour l'aide :
1. Consulter les logs : `npm run dev` avec mode verbeux
2. Vérifier la console navigateur (F12 > Console)
3. Regarder les fichiers de documentation
4. Vérifier que toutes les dépendances sont installées

---

## 🎯 Prochaines Étapes

1. ✅ **Installation terminée** - Vérifier que le serveur fonctionne
2. ⏭️ **Configurer les Paiements** - MVola, Orange Money
3. ⏭️ **Configurer Email** - Notifications et vérification
4. ⏭️ **Ajouter du Contenu** - Vidéos, cours, quiz
5. ⏭️ **Tests Complets** - Avant mise en production

---

**Bonne utilisation de TIA INFO Toamasina ! 🎓**
