/**
 * TIA INFO — Seed Complets des Rôles
 * Crée un compte étudiant ET formateur avec inscription démo
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedRoles() {
  let connection;
  try {
    console.log('🔗 Connexion à MySQL...\n');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tia_info_db'
    });

    const users = [
      {
        email: 'etudiant@tia.mg',
        password: 'etudiant123',
        nom: 'Razanatsoa',
        prenom: 'Miora',
        role: 'etudiant',
        label: '🎓 ÉTUDIANT'
      },
      {
        email: 'formateur@tia.mg',
        password: 'formateur123',
        nom: 'Rakoto',
        prenom: 'Jean-Pierre',
        role: 'formateur',
        label: '👨‍🏫 FORMATEUR'
      }
    ];

    const createdIds = {};

    for (const u of users) {
      console.log(`--- Création du compte ${u.label} ---`);
      const hashed = await bcrypt.hash(u.password, 12);

      // Vérifier si l'utilisateur existe
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?', [u.email]
      );

      let userId;
      if (existing.length > 0) {
        userId = existing[0].id;
        await connection.execute(
          'UPDATE users SET password_hash = ?, nom = ?, prenom = ?, role = ?, verified = TRUE WHERE id = ?',
          [hashed, u.nom, u.prenom, u.role, userId]
        );
        console.log(`  ⚠️  Compte existant mis à jour.`);
      } else {
        const [result] = await connection.execute(
          `INSERT INTO users (email, password_hash, nom, prenom, role, verified) VALUES (?, ?, ?, ?, ?, TRUE)`,
          [u.email, hashed, u.nom, u.prenom, u.role]
        );
        userId = result.insertId;
        console.log(`  ✅ Compte créé (ID: ${userId}).`);
      }

      createdIds[u.role] = userId;
      console.log(`  📧 Email    : ${u.email}`);
      console.log(`  🔑 Password : ${u.password}\n`);
    }

    // Inscrire l'étudiant à 2 formations avec progression
    console.log('--- Inscription de l\'étudiant aux formations ---');
    const studentId = createdIds['etudiant'];
    const formations = [
      { id: 2, titre: 'Développement Web Fullstack', progression: 45 },
      { id: 8, titre: 'Google Intelligence Artificielle', progression: 17 }
    ];

    for (const f of formations) {
      // Supprimer l'inscription existante si elle existe
      await connection.execute(
        'DELETE FROM inscriptions WHERE user_id = ? AND formation_id = ?',
        [studentId, f.id]
      );
      await connection.execute(
        'INSERT INTO inscriptions (user_id, formation_id, progression) VALUES (?, ?, ?)',
        [studentId, f.id, f.progression]
      );
      console.log(`  ✅ Inscrit à "${f.titre}" (${f.progression}% complété).`);
    }

    // Ajouter un paiement simulé pour l'étudiant
    console.log('\n--- Simulation paiement étudiant ---');
    const [ins] = await connection.execute(
      'SELECT id FROM inscriptions WHERE user_id = ? AND formation_id = 2', [studentId]
    );
    if (ins.length > 0) {
      const [payExist] = await connection.execute(
        'SELECT id FROM paiements WHERE user_id = ? AND inscription_id = ?', [studentId, ins[0].id]
      );
      if (payExist.length === 0) {
        await connection.execute(
          `INSERT INTO paiements (user_id, inscription_id, montant, operateur, telephone, transaction_id, statut)
           VALUES (?, ?, ?, ?, ?, ?, 'valide')`,
          [studentId, ins[0].id, 350000, 'mvola', '0341234567', `MV-SEED-${Date.now()}`]
        );
        console.log('  ✅ Paiement de 350 000 Ar (Mvola) validé.');
      } else {
        console.log('  ⚠️  Paiement déjà existant.');
      }
    }

    console.log('\n========================================');
    console.log('   ✅ TOUS LES COMPTES SONT PRÊTS !');
    console.log('========================================\n');
    console.log('🎓 ÉTUDIANT');
    console.log('   Email    : etudiant@tia.mg');
    console.log('   Password : etudiant123');
    console.log('   Accès    : Dashboard Étudiant\n');
    console.log('👨‍🏫 FORMATEUR');
    console.log('   Email    : formateur@tia.mg');
    console.log('   Password : formateur123');
    console.log('   Accès    : Dashboard Formateur\n');
    console.log('🔐 ADMIN');
    console.log('   Email    : admin@tia.mg');
    console.log('   Password : admin123');
    console.log('   Accès    : Dashboard Admin\n');
    console.log('👉 Connectez-vous sur : http://localhost:5000/login');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seedRoles();
