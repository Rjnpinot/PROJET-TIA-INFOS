const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const EmailService = require('../utils/emailService');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Inscription
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('nom').notEmpty(),
  body('prenom').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password, nom, prenom, telephone, role = 'etudiant' } = req.body;
  const db = req.db;
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    
    // Créer l'utilisateur
    const [result] = await db.execute(
      `INSERT INTO users (email, password_hash, nom, prenom, telephone, role, verification_token) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, nom, prenom, telephone || null, role, verificationToken]
    );
    
    // Envoyer email de vérification via le service dédié
    const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    await EmailService.sendVerification({ prenom, email }, verificationLink);
    
    res.status(201).json({ 
      message: 'Inscription réussie. Veuillez vérifier votre email.',
      userId: result.insertId 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Renvoyer l'email de vérification
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const { email } = req.body;
  const db = req.db;
  
  try {
    const [users] = await db.execute('SELECT id, nom, prenom, verified, verification_token FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = users[0];
    if (user.verified) {
        return res.status(400).json({ error: 'Compte déjà vérifié' });
    }
    
    let token = user.verification_token;
    if (!token) {
        token = require('crypto').randomBytes(32).toString('hex');
        await db.execute('UPDATE users SET verification_token = ? WHERE id = ?', [token, user.id]);
    }
    
    const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify/${token}`;
    await EmailService.sendVerification({ prenom: user.prenom || 'Étudiant', email }, verificationLink);
    
    res.json({ message: 'Email de vérification envoyé' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = req.db;
  try {
    // Connexion réelle uniquement
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const user = users[0];
    
    // Vérifier si le compte est verrouillé
    if (user.locked && user.locked_until > new Date()) {
      return res.status(401).json({ error: 'Compte verrouillé. Réessayez plus tard.' });
    }
    
    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier si l'email est vérifié
    if (!user.verified) {
      return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter' });
    }
    
    // Mettre à jour la dernière connexion
    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Générer les tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        photo: user.photo,
        telephone: user.telephone
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérification d'email
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  const db = req.db;
  
  try {
    const [users] = await db.execute('SELECT id FROM users WHERE verification_token = ?', [token]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Token invalide' });
    }
    
    await db.execute(
      'UPDATE users SET verified = TRUE, verification_token = NULL WHERE id = ?',
      [users[0].id]
    );
    
    res.redirect(`${FRONTEND_URL}/pages/login.html?verified=true`);
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const db = req.db;
  
  try {
    const [users] = await db.execute('SELECT id, nom, prenom FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.json({ message: 'Si cet email existe, un lien a été envoyé' });
    }
    
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, expiresAt, users[0].id]
    );
    
    const resetLink = `${req.protocol}://${req.get('host')}/pages/reset-password.html?token=${resetToken}`;
    await EmailService.sendPasswordReset({ prenom: users[0].prenom, email }, resetLink);
    
    res.json({ message: 'Lien de réinitialisation envoyé' });
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Réinitialisation de mot de passe
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const db = req.db;
  
  try {
    const [users] = await db.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );
    
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rafraîchir le token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ accessToken: newAccessToken });
    
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router;