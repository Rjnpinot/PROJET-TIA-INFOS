# PROJET TIA INFOS

Plateforme de gestion de formations, paiements mobiles, certificats PDF, notifications et plus, pour TIA INFOS Toamasina.


## Structure du projet

```
PROJET TIA INFOS/
│
├── backend/                          # (optionnel, si présent) Backend Node.js
│
├── css/                              # Feuilles de style CSS (global, pages, modules)
│   ├── global.css
│   ├── home.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── admin.css
│   ├── formateur.css
│   ├── certificate.css
│   ├── paiement.css
│   ├── quiz.css
│   ├── contact.css
│   ├── formations.css
│   └── notifications.css
│
├── img/                              # Images du site
│   ├── Logo_Tia_Infos.jpg
│   ├── Photo_aceuil.jpg
│   ├── Masterclass_ia.jpg
│   ├── informatique-bureautique.jpg
│   ├── Cours_de_langue.jpg
│   ├── Marketing_digital.jpg
│   ├── nos-formations.jpg
│   ├── ouverture_tia_infos.jpg
│   └── Appel_aux_association-de_jeune.jpg
│   └── ...
│
├── js/                               # Scripts JavaScript
│   ├── app.js                        # Logique principale
│   ├── auth.js                       # Authentification
│   ├── data.js                       # Données statiques (fallback)
│   ├── db.js                         # IndexedDB (hors-ligne)
│   └── ...
│
├── pages/                            # Pages HTML du site
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── admin.html
│   ├── formateur.html
│   ├── formations.html
│   ├── evenements.html
│   ├── contact.html
│   ├── about.html
│   ├── paiement.html
│   ├── quiz.html
│   ├── certificat.html
│   ├── reset-password.html
│   └── verify.html
│
├── index.html                        # Page d'accueil
├── manifest.json                     # PWA (Progressive Web App)
├── sw.js                             # Service Worker (hors-ligne)
├── cdc_parsed.txt                    # (optionnel) CDC ou données importées
├── README.md                         # Documentation du projet
└── docs/                             # Documentation (guides, API, déploiement)
   ├── GUIDE_ADMIN.pdf
   ├── GUIDE_ETUDIANT.pdf
   ├── DOC_TECHNIQUE_API.md
   └── MANUAL_DEPLOIEMENT.md
```

## Fonctionnalités principales

- Authentification sécurisée (JWT)
- Paiement mobile (MVola, Orange Money, Airtel Money)
- Génération de certificats PDF
- Notifications push et email
- Tableau de bord étudiant, espace formateur, panel admin
- Catalogue de formations, inscription, suivi
- PWA (Progressive Web App) : mode hors-ligne, notifications
- Export Excel, gestion des utilisateurs, newsletter

## Installation rapide

1. Cloner le dépôt (https://github.com/Rjnpinot/)
2. Configurer le backend (`backend/.env` et `backend/sql/database.sql`)
3. Installer les dépendances backend :
   ```bash
   cd backend
   npm install
   ```
4. Lancer le serveur :
   ```bash
   npm run dev
   ```
5. Ouvrir le frontend dans un navigateur : http://localhost:5000

## Documentation

- Voir le dossier `docs/` pour les guides utilisateurs et techniques.
- Le backend expose une API REST documentée dans `docs/DOC_TECHNIQUE_API.md`.

---

Pour toute question, contacter l'équipe TIA INFOS.
