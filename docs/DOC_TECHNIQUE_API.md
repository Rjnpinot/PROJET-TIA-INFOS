# Documentation Technique API — TIA INFO 2026

Cette documentation détaille les points de terminaison (endpoints) de l'API REST de la plateforme TIA INFO.

## Configuration Générale

- **URL de base** : `http://localhost:5000/api`
- **Format de réponse** : JSON
- **Authentification** : Bearer Token (JWT) à passer dans le header `Authorization`.

---

## 1. Authentification (`/auth`)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/register` | Inscription d'un nouvel étudiant. |
| POST | `/login` | Connexion et récupération des tokens (Access & Refresh). |
| POST | `/refresh` | Renouvellement du token d'accès via le refresh token. |
| POST | `/verify` | Vérification de l'email via le code envoyé. |
| POST | `/forgot-password` | Demande de réinitialisation de mot de passe. |
| POST | `/reset-password` | Réinitialisation effective du mot de passe. |

---

## 2. Utilisateurs (`/users`)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/me` | Récupère le profil complet de l'utilisateur connecté. |
| PUT | `/me` | Met à jour les informations du profil (nom, photo, etc.). |
| PUT | `/me/password` | Change le mot de passe de l'utilisateur. |
| GET | `/me/enrollments` | Liste les formations auxquelles l'utilisateur est inscrit. |
| POST | `/me/enroll/:fid` | Inscrit l'utilisateur à une formation spécifique. |

---

## 3. Catalogue de Formations (`/courses`)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | Liste toutes les formations disponibles. |
| GET | `/:id` | Récupère les détails d'une formation (chapitres, quiz). |
| GET | `/categories` | Liste les catégories de formations. |
| POST | `/` (Admin) | Crée une nouvelle formation. |
| PUT | `/:id` (Admin) | Modifie une formation existante. |
| DELETE | `/:id` (Admin) | Supprime une formation. |

---

## 4. Paiements (`/payments`)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/initiate` | Initie une transaction USSD (MVola, Orange, Airtel). |
| GET | `/status/:txid` | Vérifie le statut d'une transaction. |
| GET | `/report/excel` (Admin) | Génère et télécharge le rapport financier annuel. |

---

## 5. Newsletter (`/newsletter`)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/subscribe` | Inscription à la newsletter. |
| POST | `/unsubscribe` | Désinscription via un token unique. |
| POST | `/send` (Admin) | Envoi d'une newsletter à tous les abonnés. |

---

## 6. Systèmes de Notifications

L'API supporte les notifications Push via Web-Push (VAPID).
- **Endpoint d'inscription** : `/notifications/subscribe`
- **Méthode** : POST
- **Body** : Objet de souscription généré par le navigateur.

---

## Codes d'Erreurs Communs

- `400 Bad Request` : Paramètres manquants ou invalides.
- `401 Unauthorized` : Token manquant ou expiré.
- `403 Forbidden` : Droits insuffisants (ex: non-admin).
- `404 Not Found` : Ressource inexistante.
- `500 Internal Server Error` : Erreur critique côté serveur.
