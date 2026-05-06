const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function simulate() {
  let connection;
  try {
    console.log('--- Simulation d\'inscription Étudiant ---');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tia_info_db'
    });

    // 1. Créer un étudiant de test
    const email = `test_student_${Date.now()}@tia.mg`;
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    console.log(`Création de l'étudiant: ${email}...`);
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password_hash, nom, prenom, role, verified) VALUES (?, ?, ?, ?, ?, TRUE)',
      [email, hashedPassword, 'Test', 'Etudiant', 'etudiant']
    );
    const userId = userResult.insertId;

    // 2. Choisir une formation (ex: Web Fullstack id=2)
    const formationId = 2;
    console.log(`Inscription à la formation ID ${formationId}...`);
    const [insResult] = await connection.execute(
      'INSERT INTO inscriptions (user_id, formation_id, progression) VALUES (?, ?, 10)',
      [userId, formationId]
    );
    const insId = insResult.insertId;

    // 3. Simuler un paiement validé de 350 000 Ar
    console.log(`Validation du paiement (350 000 Ar)...`);
    await connection.execute(
      `INSERT INTO paiements (user_id, inscription_id, montant, operateur, telephone, transaction_id, statut) 
       VALUES (?, ?, ?, ?, ?, ?, 'valide')`,
      [userId, insId, 350000, 'mvola', '0340000000', `MV-SIM-${Date.now()}`]
    );

    console.log('\n✅ SIMULATION RÉUSSIE !');
    console.log('-----------------------------------');
    console.log(`Nouvel Étudiant : ${email}`);
    console.log(`Formation : Développement Web Fullstack`);
    console.log(`Revenu généré : +350 000 Ar`);
    console.log('-----------------------------------');
    console.log('Actualisez votre page Admin pour voir l\'augmentation du chiffre d\'affaires.');

  } catch (error) {
    console.error('❌ Erreur simulation:', error);
  } finally {
    if (connection) await connection.end();
  }
}

simulate();
