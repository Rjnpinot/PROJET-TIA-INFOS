const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const courseController = require('../controllers/courseController');
const { verifyAdmin, verifyToken } = require('../middleware/auth');

// Configuration multer pour l'upload des images de formations
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/courses/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
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
const verifyAdminMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// ============================================
// 1. Récupérer toutes les formations (public)
// ============================================
router.get('/', courseController.getCourses);

// ============================================
// 2. Récupérer une formation par ID (public)
// ============================================
router.get('/:id', [
    param('id').isInt().withMessage('ID invalide')
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const [formations] = await db.execute(
            'SELECT * FROM formations WHERE id = ?',
            [req.params.id]
        );
        
        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        const formation = formations[0];
        
        // Récupérer les cours/chapitres
        const [cours] = await db.execute(
            'SELECT * FROM cours WHERE formation_id = ? ORDER BY ordre ASC',
            [formation.id]
        );
        formation.cours = cours;
        
        // Récupérer le formateur principal
        const [formateurs] = await db.execute(
            `SELECT u.id, u.nom, u.prenom, u.photo, u.biographie 
             FROM users u 
             JOIN inscriptions i ON i.user_id = u.id 
             WHERE i.formation_id = ? AND u.role = 'formateur' 
             LIMIT 1`,
            [formation.id]
        );
        formation.formateur = formateurs[0] || null;
        
        // Récupérer les avis
        const [avis] = await db.execute(
            `SELECT u.nom, u.prenom, a.note, a.commentaire, a.date_avis 
             FROM avis a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.formation_id = ? 
             ORDER BY a.date_avis DESC 
             LIMIT 10`,
            [formation.id]
        );
        formation.avis = avis;
        
        res.json(formation);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la formation' });
    }
});

// ============================================
// 3. Créer une nouvelle formation (ADMIN ONLY)
// ============================================
router.post('/', verifyAdmin, upload.single('image'), [
    body('titre').notEmpty().withMessage('Titre requis'),
    body('categorie').notEmpty().withMessage('Catégorie requise'),
    body('prix').isFloat({ min: 0 }).withMessage('Prix invalide'),
    body('duree').notEmpty().withMessage('Durée requise'),
    body('description').notEmpty().withMessage('Description requise')
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { titre, categorie, prix, duree, description, prerequis, objectifs, programme } = req.body;
    const imagePath = req.file ? `/uploads/courses/${req.file.filename}` : null;
    
    try {
        const [result] = await db.execute(
            `INSERT INTO formations (titre, categorie, prix, duree, description, prerequis, objectifs, programme, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titre, categorie, prix, duree, description, prerequis || null, objectifs || null, programme || null, imagePath]
        );
        
        res.status(201).json({
            message: 'Formation créée avec succès',
            formationId: result.insertId
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
});

// ============================================
// 4. Mettre à jour une formation (ADMIN ONLY)
// ============================================
router.put('/:id', verifyAdmin, upload.single('image'), [
    param('id').isInt().withMessage('ID invalide'),
    body('titre').optional().notEmpty(),
    body('categorie').optional().notEmpty(),
    body('prix').optional().isFloat({ min: 0 })
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { titre, categorie, prix, duree, description, prerequis, objectifs, programme, populaire } = req.body;
    
    try {
        // Vérifier si la formation existe
        const [existing] = await db.execute('SELECT id FROM formations WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        let updateFields = [];
        let updateValues = [];
        
        if (titre) { updateFields.push('titre = ?'); updateValues.push(titre); }
        if (categorie) { updateFields.push('categorie = ?'); updateValues.push(categorie); }
        if (prix) { updateFields.push('prix = ?'); updateValues.push(prix); }
        if (duree) { updateFields.push('duree = ?'); updateValues.push(duree); }
        if (description) { updateFields.push('description = ?'); updateValues.push(description); }
        if (prerequis !== undefined) { updateFields.push('prerequis = ?'); updateValues.push(prerequis); }
        if (objectifs !== undefined) { updateFields.push('objectifs = ?'); updateValues.push(objectifs); }
        if (programme !== undefined) { updateFields.push('programme = ?'); updateValues.push(programme); }
        if (populaire !== undefined) { updateFields.push('populaire = ?'); updateValues.push(populaire === 'true' || populaire === true); }
        if (req.file) { updateFields.push('image = ?'); updateValues.push(`/uploads/courses/${req.file.filename}`); }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }
        
        updateValues.push(req.params.id);
        await db.execute(`UPDATE formations SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        
        res.json({ message: 'Formation mise à jour avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

// ============================================
// 5. Supprimer une formation (ADMIN ONLY)
// ============================================
router.delete('/:id', verifyAdmin, [
    param('id').isInt().withMessage('ID invalide')
], async (req, res) => {
    const db = req.db;
    
    try {
        const [existing] = await db.execute('SELECT id FROM formations WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        // Supprimer d'abord les inscriptions liées
        await db.execute('DELETE FROM inscriptions WHERE formation_id = ?', [req.params.id]);
        // Supprimer les cours liés
        await db.execute('DELETE FROM cours WHERE formation_id = ?', [req.params.id]);
        // Supprimer la formation
        await db.execute('DELETE FROM formations WHERE id = ?', [req.params.id]);
        
        res.json({ message: 'Formation supprimée avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

// ============================================
// 6. Ajouter un cours/chapitre à une formation (ADMIN/FORMATEUR)
// ============================================
router.post('/:id/cours', verifyAdmin, [
    param('id').isInt(),
    body('titre').notEmpty(),
    body('type').isIn(['video', 'pdf', 'quiz', 'devoir']),
    body('contenu').optional(),
    body('duree').optional().isInt()
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { titre, type, contenu, duree, ordre } = req.body;
    
    try {
        // Récupérer le prochain ordre si non spécifié
        let ordreFinal = ordre;
        if (!ordreFinal) {
            const [maxOrdre] = await db.execute(
                'SELECT MAX(ordre) as max_ordre FROM cours WHERE formation_id = ?',
                [req.params.id]
            );
            ordreFinal = (maxOrdre[0].max_ordre || 0) + 1;
        }
        
        const [result] = await db.execute(
            `INSERT INTO cours (formation_id, titre, type, contenu, duree, ordre) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, titre, type, contenu || null, duree || null, ordreFinal]
        );
        
        res.status(201).json({
            message: 'Cours ajouté avec succès',
            coursId: result.insertId
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du cours' });
    }
});

// ============================================
// 7. Récupérer la progression d'un étudiant (AUTH)
// ============================================
router.get('/:id/progress/:userId', async (req, res) => {
    const db = req.db;
    const { id: formationId, userId } = req.params;
    
    try {
        const [progress] = await db.execute(
            `SELECT progression, score_final, certificat_genere, certificat_code 
             FROM inscriptions 
             WHERE formation_id = ? AND user_id = ?`,
            [formationId, userId]
        );
        
        if (progress.length === 0) {
            return res.status(404).json({ error: 'Inscription non trouvée' });
        }
        
        res.json(progress[0]);
        
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 8. Mettre à jour la progression (AUTH)
// ============================================
router.put('/:id/progress/:userId', [
    body('progression').isInt({ min: 0, max: 100 })
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { progression } = req.body;
    const { id: formationId, userId } = req.params;
    
    try {
        await db.execute(
            `UPDATE inscriptions SET progression = ? 
             WHERE formation_id = ? AND user_id = ?`,
            [progression, formationId, userId]
        );
        
        // Si progression 100%, vérifier si certificat peut être généré
        if (progression >= 100) {
            const [inscription] = await db.execute(
                `SELECT score_final, certificat_genere FROM inscriptions 
                 WHERE formation_id = ? AND user_id = ?`,
                [formationId, userId]
            );
            
            if (inscription[0] && inscription[0].score_final >= 70 && !inscription[0].certificat_genere) {
                // Déclencher génération certificat
                req.io.emit('certificate-ready', { userId, formationId });
            }
        }
        
        res.json({ message: 'Progression mise à jour', progression });
        
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// 9. Soumettre un quiz (AUTH)
// ============================================
router.post('/:id/quiz/:quizId/submit', [
    body('reponses').isArray(),
    body('score').isInt()
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, reponses, score } = req.body;
    const { id: formationId, quizId } = req.params;
    
    try {
        // Sauvegarder le résultat
        await db.execute(
            `INSERT INTO resultats_quiz (user_id, quiz_id, score) 
             VALUES (?, ?, ?)`,
            [userId, quizId, score]
        );
        
        // Mettre à jour le score final de la formation si c'est le quiz final
        const [quiz] = await db.execute(
            `SELECT titre FROM quiz WHERE id = ?`,
            [quizId]
        );
        
        if (quiz[0] && quiz[0].titre === 'Examen Final') {
            await db.execute(
                `UPDATE inscriptions SET score_final = ? 
                 WHERE formation_id = ? AND user_id = ?`,
                [score, formationId, userId]
            );
            
            if (score >= 70) {
                req.io.emit('quiz-passed', { userId, formationId, score });
            }
        }
        
        res.json({ message: 'Quiz soumis avec succès', score });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la soumission' });
    }
});

// ============================================
// 10. Ajouter un avis sur une formation (AUTH)
// ============================================
router.post('/:id/avis', [
    param('id').isInt(),
    body('note').isInt({ min: 1, max: 5 }),
    body('commentaire').optional().isLength({ max: 500 })
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, note, commentaire } = req.body;
    const formationId = req.params.id;
    
    try {
        // Vérifier si l'utilisateur est inscrit à la formation
        const [inscrit] = await db.execute(
            'SELECT id FROM inscriptions WHERE formation_id = ? AND user_id = ?',
            [formationId, userId]
        );
        
        if (inscrit.length === 0) {
            return res.status(403).json({ error: 'Vous devez être inscrit pour laisser un avis' });
        }
        
        // Vérifier si l'utilisateur a déjà laissé un avis
        const [existingAvis] = await db.execute(
            'SELECT id FROM avis WHERE formation_id = ? AND user_id = ?',
            [formationId, userId]
        );
        
        if (existingAvis.length > 0) {
            return res.status(400).json({ error: 'Vous avez déjà laissé un avis pour cette formation' });
        }
        
        await db.execute(
            `INSERT INTO avis (formation_id, user_id, note, commentaire) 
             VALUES (?, ?, ?, ?)`,
            [formationId, userId, note, commentaire || null]
        );
        
        res.status(201).json({ message: 'Avis ajouté avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'avis' });
    }
});

// ============================================
// 11. Statistiques des formations (ADMIN)
// ============================================
router.get('/stats/overview', verifyAdmin, async (req, res) => {
    const db = req.db;
    
    try {
        // Nombre total de formations
        const [totalFormations] = await db.execute('SELECT COUNT(*) as total FROM formations');
        
        // Répartition par catégorie
        const [parCategorie] = await db.execute(
            'SELECT categorie, COUNT(*) as count FROM formations GROUP BY categorie'
        );
        
        // Formation la plus populaire
        const [plusPopulaire] = await db.execute(
            `SELECT f.titre, COUNT(i.id) as inscrits 
             FROM formations f 
             JOIN inscriptions i ON f.id = i.formation_id 
             GROUP BY f.id 
             ORDER BY inscrits DESC 
             LIMIT 1`
        );
        
        // Taux de complétion moyen
        const [tauxCompletion] = await db.execute(
            'SELECT AVG(progression) as moyenne FROM inscriptions WHERE progression > 0'
        );
        
        res.json({
            total: totalFormations[0].total,
            parCategorie,
            plusPopulaire: plusPopulaire[0] || null,
            tauxCompletionMoyen: parseFloat(tauxCompletion[0].moyenne || 0).toFixed(1)
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;