const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configuration multer pour les photos de profil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'));
        }
    }
});

// Middleware de vérification admin
const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (!['admin', 'super_admin'].includes(decoded.role)) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide' });
    }
};

// Middleware de vérification simple (utilisateur connecté)
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide' });
    }
};

// ============================================
// 1. Récupérer son propre profil (AUTH)
// ============================================
router.get('/me', verifyAuth, async (req, res) => {
    const db = req.db;
    
    try {
        const [users] = await db.execute(
            `SELECT id, email, nom, prenom, telephone, photo, biographie, role, verified, created_at, last_login 
             FROM users WHERE id = ?`,
            [req.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const user = users[0];
        
        // Récupérer les formations de l'utilisateur
        const [formations] = await db.execute(
            `SELECT f.id, f.titre, f.image, i.progression, i.score_final, i.certificat_genere, i.date_inscription
             FROM inscriptions i
             JOIN formations f ON i.formation_id = f.id
             WHERE i.user_id = ?`,
            [req.userId]
        );
        user.formations = formations;
        
        // Récupérer les notifications non lues
        const [notifications] = await db.execute(
            `SELECT * FROM notifications WHERE user_id = ? AND lu = FALSE ORDER BY date_creation DESC LIMIT 20`,
            [req.userId]
        );
        user.notifications = notifications;
        
        res.json(user);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 2. Mettre à jour son profil (AUTH)
// ============================================
router.put('/me', verifyAuth, upload.single('photo'), [
    body('nom').optional().notEmpty(),
    body('prenom').optional().notEmpty(),
    body('telephone').optional(),
    body('biographie').optional().isLength({ max: 500 })
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { nom, prenom, telephone, biographie } = req.body;
    
    try {
        let updateFields = [];
        let updateValues = [];
        
        if (nom) { updateFields.push('nom = ?'); updateValues.push(nom); }
        if (prenom) { updateFields.push('prenom = ?'); updateValues.push(prenom); }
        if (telephone !== undefined) { updateFields.push('telephone = ?'); updateValues.push(telephone || null); }
        if (biographie !== undefined) { updateFields.push('biographie = ?'); updateValues.push(biographie || null); }
        if (req.file) { updateFields.push('photo = ?'); updateValues.push(`/uploads/avatars/${req.file.filename}`); }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }
        
        updateValues.push(req.userId);
        await db.execute(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        
        res.json({ message: 'Profil mis à jour avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

// ============================================
// 3. Changer son mot de passe (AUTH)
// ============================================
router.put('/me/password', verifyAuth, [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    try {
        const [users] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.userId]);
        
        res.json({ message: 'Mot de passe changé avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 4. Récupérer les inscriptions de l'utilisateur (AUTH)
// ============================================
router.get('/me/enrollments', verifyAuth, async (req, res) => {
    const db = req.db;
    
    try {
        const [enrollments] = await db.execute(
            `SELECT i.*, f.titre, f.image, f.duree, f.categorie, f.prix
             FROM inscriptions i
             JOIN formations f ON i.formation_id = f.id
             WHERE i.user_id = ?
             ORDER BY i.date_inscription DESC`,
            [req.userId]
        );
        
        res.json(enrollments);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 4b. Mettre à jour la progression d'un cours (AUTH)
// ============================================
router.post('/me/progress', verifyAuth, [
    body('courseId').notEmpty(),
    body('progress').isInt({ min: 0, max: 100 })
], async (req, res) => {
    const db = req.db;
    const { courseId, progress } = req.body;
    
    try {
        await db.execute(
            'UPDATE inscriptions SET progression = ? WHERE user_id = ? AND formation_id = ?',
            [progress, req.userId, courseId]
        );
        
        res.json({ message: 'Progression mise à jour avec succès', progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la progression' });
    }
});

// Route additionnelle pour correspondre à l'appel frontend
router.get('/:userId/enrollments', verifyAuth, async (req, res) => {
    const db = req.db;
    const userId = parseInt(req.params.userId);
    
    try {
        const [enrollments] = await db.execute(
            `SELECT i.*, f.titre, f.image, f.duree, f.categorie, f.prix
             FROM inscriptions i
             JOIN formations f ON i.formation_id = f.id
             WHERE i.user_id = ?
             ORDER BY i.date_inscription DESC`,
            [userId]
        );
        
        res.json(enrollments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 5. S'inscrire à une formation (AUTH)
// ============================================
router.post('/me/enroll/:formationId', verifyAuth, [
    param('formationId').isInt()
], async (req, res) => {
    const db = req.db;
    const { formationId } = req.params;
    
    try {
        // Vérifier si déjà inscrit
        const [existing] = await db.execute(
            'SELECT id FROM inscriptions WHERE user_id = ? AND formation_id = ?',
            [req.userId, formationId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Déjà inscrit à cette formation' });
        }
        
        // Vérifier si la formation existe
        const [formation] = await db.execute('SELECT id FROM formations WHERE id = ?', [formationId]);
        if (formation.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        const [result] = await db.execute(
            'INSERT INTO inscriptions (user_id, formation_id, progression) VALUES (?, ?, 0)',
            [req.userId, formationId]
        );
        
        // Envoyer notification
        await db.execute(
            `INSERT INTO notifications (user_id, titre, message, type) 
             VALUES (?, ?, ?, ?)`,
            [req.userId, 'Inscription confirmée', `Vous êtes inscrit à la formation`, 'success']
        );
        
        res.status(201).json({ 
            message: 'Inscription réussie',
            inscriptionId: result.insertId
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

// ============================================
// 6. ADMIN: Récupérer tous les utilisateurs
// ============================================
router.get('/admin/users', verifyAdmin, async (req, res) => {
    const db = req.db;
    const { role, search, page = 1, limit = 20 } = req.query;
    
    try {
        let query = 'SELECT id, email, nom, prenom, telephone, photo, role, verified, created_at, last_login FROM users WHERE 1=1';
        const params = [];
        
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }
        
        if (search) {
            query += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const offset = (page - 1) * limit;
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const [users] = await db.execute(query, params);
        
        // Compter le total
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM users',
            []
        );
        
        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 7. ADMIN: Récupérer un utilisateur par ID
// ============================================
router.get('/admin/users/:id', verifyAdmin, [
    param('id').isInt()
], async (req, res) => {
    const db = req.db;
    
    try {
        const [users] = await db.execute(
            `SELECT id, email, nom, prenom, telephone, photo, biographie, role, verified, created_at, last_login 
             FROM users WHERE id = ?`,
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const user = users[0];
        
        // Récupérer les inscriptions
        const [enrollments] = await db.execute(
            `SELECT f.titre, i.progression, i.score_final, i.certificat_genere, i.date_inscription
             FROM inscriptions i
             JOIN formations f ON i.formation_id = f.id
             WHERE i.user_id = ?`,
            [req.params.id]
        );
        user.enrollments = enrollments;
        
        // Récupérer l'historique des paiements
        const [payments] = await db.execute(
            `SELECT p.*, f.titre as formation_titre
             FROM paiements p
             JOIN inscriptions i ON p.inscription_id = i.id
             JOIN formations f ON i.formation_id = f.id
             WHERE p.user_id = ?
             ORDER BY p.date_paiement DESC`,
            [req.params.id]
        );
        user.payments = payments;
        
        res.json(user);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 8. ADMIN: Créer un utilisateur
// ============================================
router.post('/admin/users', verifyAdmin, [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('nom').notEmpty(),
    body('prenom').notEmpty(),
    body('role').isIn(['etudiant', 'formateur', 'secretaire', 'admin'])
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, nom, prenom, telephone, role } = req.body;
    
    try {
        // Vérifier si l'email existe déjà
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const [result] = await db.execute(
            `INSERT INTO users (email, password_hash, nom, prenom, telephone, role, verified) 
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [email, hashedPassword, nom, prenom, telephone || null, role]
        );
        
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            userId: result.insertId
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
});

// ============================================
// 9. ADMIN: Mettre à jour un utilisateur
// ============================================
router.put('/admin/users/:id', verifyAdmin, [
    param('id').isInt(),
    body('role').optional().isIn(['etudiant', 'formateur', 'secretaire', 'admin']),
    body('verified').optional().isBoolean()
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { role, verified, nom, prenom, telephone } = req.body;
    const userId = req.params.id;
    
    try {
        let updateFields = [];
        let updateValues = [];
        
        if (role) { updateFields.push('role = ?'); updateValues.push(role); }
        if (verified !== undefined) { updateFields.push('verified = ?'); updateValues.push(verified); }
        if (nom) { updateFields.push('nom = ?'); updateValues.push(nom); }
        if (prenom) { updateFields.push('prenom = ?'); updateValues.push(prenom); }
        if (telephone !== undefined) { updateFields.push('telephone = ?'); updateValues.push(telephone || null); }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }
        
        updateValues.push(userId);
        await db.execute(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        
        res.json({ message: 'Utilisateur mis à jour avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

// ============================================
// 10. ADMIN: Supprimer un utilisateur
// ============================================
router.delete('/admin/users/:id', verifyAdmin, [
    param('id').isInt()
], async (req, res) => {
    const db = req.db;
    const userId = req.params.id;
    
    try {
        // Ne pas supprimer son propre compte
        if (parseInt(userId) === req.userId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }
        
        // Supprimer les données liées
        await db.execute('DELETE FROM inscriptions WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM paiements WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM messages WHERE expediteur_id = ? OR destinataire_id = ?', [userId, userId]);
        await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'Utilisateur supprimé avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

// ============================================
// 11. ADMIN: Statistiques globales
// ============================================
router.get('/admin/stats', verifyAdmin, async (req, res) => {
    const db = req.db;
    
    try {
        // Nombre total d'utilisateurs par rôle
        const [usersByRole] = await db.execute(
            'SELECT role, COUNT(*) as count FROM users GROUP BY role'
        );
        
        // Nouveaux inscrits ce mois
        const [newUsersThisMonth] = await db.execute(
            'SELECT COUNT(*) as count FROM users WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
        );
        
        // Utilisateurs actifs (connectés dans les 30 derniers jours)
        const [activeUsers] = await db.execute(
            'SELECT COUNT(*) as count FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
        
        // Taux de vérification des emails
        const [verifiedStats] = await db.execute(
            'SELECT COUNT(*) as total, SUM(verified) as verified FROM users'
        );
        
        // Revenu total (paiements validés)
        const [revenue] = await db.execute(
            'SELECT SUM(montant) as total FROM paiements WHERE statut = "valide"'
        );
        
        res.json({
            usersByRole,
            newUsersThisMonth: newUsersThisMonth[0].count,
            activeUsers: activeUsers[0].count,
            totalRevenue: revenue[0].total || 0,
            verificationRate: verifiedStats[0].total > 0 
                ? (verifiedStats[0].verified / verifiedStats[0].total * 100).toFixed(1)
                : 0
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;