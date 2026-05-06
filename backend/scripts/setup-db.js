const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setup() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let connection;
    try {
        console.log('🚀 Connexion au serveur MySQL...');
        connection = await mysql.createConnection(dbConfig);

        const dbName = process.env.DB_NAME || 'tia_info_db';
        console.log('📂 Création de la base de données... (DATABASE: ' + dbName + ')');
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log('📂 Utilisation de la base de données...');
        await connection.query(`USE \`${dbName}\`;`);

        console.log('📜 Lecture du fichier database.sql...');
        const sqlPath = path.join(__dirname, '../sql/database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⚡ Exécution du script SQL (longue opération possible)...');
        await connection.query(sql);
        console.log('✅ Requêtes SQL exécutées.');

        console.log('✅ Base de données initialisée avec succès !');

        // Ajout d'utilisateurs de test si nécessaire
        console.log('🌱 Souhaitez-vous peupler les utilisateurs de test ? (Inclus dans seed-users.js)');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation :', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('👋 Connexion fermée.');
        }
    }
}

setup();
