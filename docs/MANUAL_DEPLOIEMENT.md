# Manuel de Déploiement — TIA INFO 2026

Ce guide explique comment déployer l'application TIA INFO sur un serveur local ou distant.

## Pré-requis

- **Node.js** (v18 ou supérieur)
- **MySQL** (v8.0 ou supérieur) ou MariaDB
- **Accès Terminal** (Git Bash, PowerShell, etc.)

---

## Étape 1 : Configuration de la Base de Données

1. Créez une nouvelle base de données MySQL nommée `tia_info_db` via votre client MySQL préféré (ex: phpMyAdmin, MySQL Workbench).
2. Importez le fichier de schéma situé dans `backend/sql/database.sql` :
   ```bash
   mysql -u root -p tia_info_db < backend/sql/database.sql
   ```

---

## Étape 2 : Configuration des Variables d'Environnement

1. Accédez au dossier `backend`.
2. Créez un fichier `.env` à partir du modèle :
   ```bash
   # Config DB
   DB_HOST=localhost
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=tia_info_db

   # Authentification
   JWT_SECRET=votre_cle_secrete_longue_et_aleatoire
   JWT_REFRESH_SECRET=votre_cle_refresh_secrete

   # E-mail (Gmail par défaut)
   EMAIL_USER=contact@votre-domaine.mg
   EMAIL_PASS=votre_mot_de_passe_app_gmail

   # Web-Push (VAPID)
   VAPID_PUBLIC_KEY=cl_publique_generee
   VAPID_PRIVATE_KEY=cle_privee_generee
   ```

---

## Étape 3 : Installation des Dépendances

Exécutez la commande suivante dans le dossier `backend` :
```bash
npm install
```

---

## Étape 4 : Lancement de l'Application

### En local (Développement)
Utilisez `nodemon` (si installé) ou simple `node` :
```bash
node server.js
```
Le serveur sera accessible sur `http://localhost:5000`.

### En production
Il est recommandé d'utiliser **PM2** pour garantir que le serveur redémarre automatiquement :
```bash
npm install -m pm2
pm2 start server.js --name "tia-info-backend"
```

---

## Étape 5 : Accès au Frontend

Puisque l'application est une PWA statique, vous pouvez simplement ouvrir `index.html` via un serveur web de votre choix (ex: Apache, Nginx ou l'extension Live Server de VS Code).

Pour Nginx, pointez la configuration vers le dossier racine du projet.

---

## Maintenance

- **Logs** : Les logs du backend peuvent être consultés via PM2 (`pm2 logs`).
- **Sauvegarde** : Exportez régulièrement la base de données via `mysqldump`.
- **Certificats SSL** : Utilisez **Let's Encrypt** (Certbot) pour sécuriser l'accès via HTTPS.
