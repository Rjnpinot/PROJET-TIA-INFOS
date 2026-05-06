/**
 * TIA INFO — Contrôleur de Gestion des Formations
 * Gère les opérations CRUD des formations et des cours
 */

const mysql = require('mysql2/promise');

/**
 * Récupérer toutes les formations avec filtres
 */
exports.getCourses = async (req, res) => {
    const db = req.db;
    const { categorie, search, populaire } = req.query;
    
    try {
        let query = 'SELECT * FROM formations WHERE 1=1';
        const params = [];
        
        if (categorie) {
            query += ' AND categorie = ?';
            params.push(categorie);
        }
        
        if (search) {
            query += ' AND (titre LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (populaire === 'true') {
            query += ' AND populaire = TRUE';
        }
        
        query += ' ORDER BY populaire DESC, titre ASC LIMIT 100';
        
        const [formations] = await db.execute(query, params);
        
        // Enrichir avec statistiques
        for (let formation of formations) {
            const [inscrits] = await db.execute(
                'SELECT COUNT(*) as total FROM inscriptions WHERE formation_id = ?',
                [formation.id]
            );
            formation.nb_inscrits = inscrits[0]?.total || 0;
            
            const [notes] = await db.execute(
                'SELECT AVG(score_final) as moyenne FROM inscriptions WHERE formation_id = ? AND score_final IS NOT NULL',
                [formation.id]
            );
            formation.note_moyenne = notes[0]?.moyenne ? parseFloat(notes[0].moyenne).toFixed(1) : null;
        }
        
        res.json(formations);
    } catch (error) {
        console.error('Erreur getCourses:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des formations' });
    }
};

/**
 * Récupérer une formation par ID
 */
exports.getCourseById = async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    
    try {
        const [formations] = await db.execute('SELECT * FROM formations WHERE id = ?', [id]);
        
        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        const formation = formations[0];
        
        // Récupérer les cours associés
        const [cours] = await db.execute(
            'SELECT * FROM cours WHERE formation_id = ? ORDER BY ordre ASC',
            [id]
        );
        formation.cours = cours;
        
        // Statistiques
        const [inscrits] = await db.execute(
            'SELECT COUNT(*) as total FROM inscriptions WHERE formation_id = ?',
            [id]
        );
        formation.nb_inscrits = inscrits[0]?.total || 0;
        
        res.json(formation);
    } catch (error) {
        console.error('Erreur getCourseById:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la formation' });
    }
};

/**
 * Créer une nouvelle formation (Admin seulement)
 */
exports.createCourse = async (req, res) => {
    const db = req.db;
    const { titre, categorie, prix, duree, description, image } = req.body;
    
    if (!titre || !categorie || !prix) {
        return res.status(400).json({ error: 'Données manquantes (titre, categorie, prix requis)' });
    }
    
    try {
        const [result] = await db.execute(
            `INSERT INTO formations (titre, categorie, prix, duree, description, image) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [titre, categorie, prix, duree || null, description || null, image || null]
        );
        
        res.status(201).json({
            id: result.insertId,
            titre,
            categorie,
            prix,
            message: 'Formation créée avec succès'
        });
    } catch (error) {
        console.error('Erreur createCourse:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la formation' });
    }
};

/**
 * Mettre à jour une formation
 */
exports.updateCourse = async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { titre, categorie, prix, duree, description, image, populaire } = req.body;
    
    try {
        const updates = [];
        const params = [];
        
        if (titre !== undefined) { updates.push('titre = ?'); params.push(titre); }
        if (categorie !== undefined) { updates.push('categorie = ?'); params.push(categorie); }
        if (prix !== undefined) { updates.push('prix = ?'); params.push(prix); }
        if (duree !== undefined) { updates.push('duree = ?'); params.push(duree); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (image !== undefined) { updates.push('image = ?'); params.push(image); }
        if (populaire !== undefined) { updates.push('populaire = ?'); params.push(populaire); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }
        
        params.push(id);
        const query = `UPDATE formations SET ${updates.join(', ')} WHERE id = ?`;
        
        await db.execute(query, params);
        
        res.json({ message: 'Formation mise à jour avec succès' });
    } catch (error) {
        console.error('Erreur updateCourse:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

/**
 * Supprimer une formation
 */
exports.deleteCourse = async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    
    try {
        // Vérifier si formation existe
        const [formations] = await db.execute('SELECT id FROM formations WHERE id = ?', [id]);
        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        // Supprimer les inscriptions associées
        await db.execute('DELETE FROM inscriptions WHERE formation_id = ?', [id]);
        
        // Supprimer les cours
        await db.execute('DELETE FROM cours WHERE formation_id = ?', [id]);
        
        // Supprimer la formation
        await db.execute('DELETE FROM formations WHERE id = ?', [id]);
        
        res.json({ message: 'Formation supprimée avec succès' });
    } catch (error) {
        console.error('Erreur deleteCourse:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};

/**
 * Récupérer les cours/chapitres d'une formation
 */
exports.getCourseContent = async (req, res) => {
    const db = req.db;
    const { formationId } = req.params;
    
    try {
        const [cours] = await db.execute(
            'SELECT * FROM cours WHERE formation_id = ? ORDER BY ordre ASC',
            [formationId]
        );
        
        // Pour chaque cours, récupérer le quiz associé
        for (let c of cours) {
            if (c.type === 'quiz') {
                const [quizzes] = await db.execute('SELECT * FROM quiz WHERE cours_id = ?', [c.id]);
                c.quiz = quizzes;
            }
        }
        
        res.json(cours);
    } catch (error) {
        console.error('Erreur getCourseContent:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du contenu' });
    }
};

/**
 * Obtenir la progression d'un utilisateur dans une formation
 */
exports.getUserProgress = async (req, res) => {
    const db = req.db;
    const { userId, formationId } = req.params;
    
    try {
        const [inscriptions] = await db.execute(
            `SELECT * FROM inscriptions WHERE user_id = ? AND formation_id = ?`,
            [userId, formationId]
        );
        
        if (inscriptions.length === 0) {
            return res.status(404).json({ error: 'Inscription non trouvée' });
        }
        
        res.json(inscriptions[0]);
    } catch (error) {
        console.error('Erreur getUserProgress:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la progression' });
    }
};

