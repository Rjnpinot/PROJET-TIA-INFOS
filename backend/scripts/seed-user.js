const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedUser() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tia_info_db'
    });

    const email = 'admin@tia.mg';
    const password = 'admin123';
    const nom = 'RAZAKAMAHEFA';
    const prenom = 'Nicolas';
    const role = 'admin';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user exists
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      console.log(`User ${email} already exists. Updating password...`);
      await connection.execute(
        'UPDATE users SET password_hash = ?, verified = TRUE WHERE id = ?',
        [hashedPassword, existing[0].id]
      );
    } else {
      console.log(`Creating user ${email}...`);
      await connection.execute(
        `INSERT INTO users (email, password_hash, nom, prenom, role, verified) 
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [email, hashedPassword, nom, prenom, role]
      );
    }

    console.log('✅ Seed successful!');
    console.log(`Credentials: ${email} / ${password}`);

  } catch (error) {
    console.error('❌ Error seeding user:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seedUser();
