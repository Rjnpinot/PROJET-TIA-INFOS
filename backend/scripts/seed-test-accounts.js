const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedRoles() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tia_info_db'
    });

    const roles = [
      { email: 'formateur@tia.mg', pass: 'formateur123', role: 'formateur', nom: 'RAZAFY', prenom: 'Andry' },
      { email: 'etudiant@tia.mg', pass: 'etudiant123', role: 'etudiant', nom: 'SOA', prenom: 'Lova' }
    ];

    for (const u of roles) {
        const hashedPassword = await bcrypt.hash(u.pass, 12);
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [u.email]);
        
        if (existing.length === 0) {
            console.log(`Création de ${u.role}: ${u.email}...`);
            await connection.execute(
                'INSERT INTO users (email, password_hash, nom, prenom, role, verified) VALUES (?, ?, ?, ?, ?, TRUE)',
                [u.email, hashedPassword, u.nom, u.prenom, u.role]
            );
        } else {
            console.log(`${u.email} existe déjà.`);
        }
    }

    console.log('✅ Comptes de test créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seedRoles();
