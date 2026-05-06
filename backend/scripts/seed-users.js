require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const users = [
    {
        email: 'admin@tia.mg',
        password: 'password123',
        nom: 'ADMIN',
        prenom: 'System',
        role: 'admin',
        telephone: '0340000001'
    },
    {
        email: 'formateur@tia.mg',
        password: 'password123',
        nom: 'FORMATEUR',
        prenom: 'Jean',
        role: 'formateur',
        telephone: '0340000002'
    },
    {
        email: 'etudiant@tia.mg',
        password: 'password123',
        nom: 'ETUDIANT',
        prenom: 'Miora',
        role: 'etudiant',
        telephone: '0340000003'
    }
];

async function seed() {
    let connection;
    try {
        console.log("🚀 Connexion à la base de données...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tia_info_db'
        });

        console.log("🌱 Création des utilisateurs de test...");

        for (const user of users) {
            // Vérifier si l'utilisateur existe déjà
            const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);
            
            if (rows.length > 0) {
                console.log(`⚠️ L'utilisateur ${user.email} existe déjà. Ignoré.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 12);
            
            await connection.execute(
                `INSERT INTO users (email, password_hash, nom, prenom, role, telephone, verified) 
                 VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
                [user.email, hashedPassword, user.nom, user.prenom, user.role, user.telephone]
            );

            console.log(`✅ Utilisateur créé : ${user.email} (${user.role})`);
        }

        console.log("✨ Initialisation terminée avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors du seeding :", error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

seed();
