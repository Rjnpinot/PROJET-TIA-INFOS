// Route de newsletter
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Middleware de vérification admin
const verifyAdmin = async (req, res, next) => {
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
// 1. S'inscrire à la newsletter (public)
// ============================================
router.post('/subscribe', [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide')
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, nom, prenom } = req.body;
    
    try {
        // Vérifier si déjà inscrit
        const [existing] = await db.execute(
            'SELECT id, actif FROM newsletter_subscribers WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            if (!existing[0].actif) {
                // Réactiver l'abonnement
                await db.execute(
                    'UPDATE newsletter_subscribers SET actif = TRUE, date_inscription = NOW() WHERE email = ?',
                    [email]
                );
                return res.json({ message: 'Abonnement réactivé avec succès' });
            }
            return res.status(400).json({ error: 'Cet email est déjà inscrit à la newsletter' });
        }
        
        // Créer un nouvel abonné
        await db.execute(
            'INSERT INTO newsletter_subscribers (email, nom, prenom) VALUES (?, ?, ?)',
            [email, nom || null, prenom || null]
        );
        
        // Envoyer un email de bienvenue
        await req.transporter.sendMail({
            from: '"TIA INFO" <contact@tia.mg>',
            to: email,
            subject: 'Bienvenue à la newsletter TIA INFO !',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <img src="https://tia.mg/img/Logo_Tia_Infos.jpg" alt="TIA INFO" style="width: 100px;">
                    <h1 style="color: #d4af37;">Bienvenue dans notre communauté !</h1>
                    <p>Merci de vous être inscrit à la newsletter de TIA INFO Toamasina.</p>
                    <p>Vous recevrez chaque mois :</p>
                    <ul>
                        <li>📅 Nos prochains événements et masterclasses</li>
                        <li>🎓 Les nouvelles formations disponibles</li>
                        <li>💡 Des conseils et astuces en technologies</li>
                        <li>🎁 Des offres exclusives pour les abonnés</li>
                    </ul>
                    <p>À très bientôt !</p>
                    <p style="color: #d4af37;">L'équipe TIA INFO</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">Vous pouvez vous désinscrire à tout moment en cliquant <a href="https://tia.mg/newsletter/unsubscribe?email=${encodeURIComponent(email)}">ici</a>.</p>
                </div>
            `
        });
        
        res.status(201).json({ message: 'Inscription à la newsletter réussie' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

// ============================================
// 2. Se désinscrire de la newsletter (public)
// ============================================
router.post('/unsubscribe', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email } = req.body;
    
    try {
        const [existing] = await db.execute(
            'SELECT id FROM newsletter_subscribers WHERE email = ? AND actif = TRUE',
            [email]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Email non trouvé ou déjà désinscrit' });
        }
        
        await db.execute(
            'UPDATE newsletter_subscribers SET actif = FALSE WHERE email = ?',
            [email]
        );
        
        res.json({ message: 'Désinscription réussie' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la désinscription' });
    }
});

// ============================================
// 3. ADMIN: Récupérer la liste des abonnés
// ============================================
router.get('/admin/subscribers', verifyAdmin, async (req, res) => {
    const db = req.db;
    const { actif, page = 1, limit = 50 } = req.query;
    
    try {
        let query = 'SELECT id, email, nom, prenom, date_inscription, actif FROM newsletter_subscribers WHERE 1=1';
        const params = [];
        
        if (actif !== undefined) {
            query += ' AND actif = ?';
            params.push(actif === 'true');
        }
        
        const offset = (page - 1) * limit;
        query += ' ORDER BY date_inscription DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const [subscribers] = await db.execute(query, params);
        
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM newsletter_subscribers',
            []
        );
        
        res.json({
            subscribers,
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
// 4. ADMIN: Envoyer une newsletter
// ============================================
router.post('/admin/send', verifyAdmin, [
    body('subject').notEmpty().withMessage('Sujet requis'),
    body('content').notEmpty().withMessage('Contenu requis'),
    body('sendTo').isIn(['all', 'active', 'test']).withMessage('Destinataire invalide'),
    body('testEmail').optional().isEmail()
], async (req, res) => {
    const db = req.db;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { subject, content, sendTo, testEmail } = req.body;
    
    try {
        let recipients = [];
        
        if (sendTo === 'test' && testEmail) {
            recipients = [{ email: testEmail, nom: null, prenom: null }];
        } else {
            const whereClause = sendTo === 'active' ? 'WHERE actif = TRUE' : '';
            const [subscribers] = await db.execute(
                `SELECT email, nom, prenom FROM newsletter_subscribers ${whereClause}`
            );
            recipients = subscribers;
        }
        
        if (recipients.length === 0) {
            return res.status(400).json({ error: 'Aucun destinataire trouvé' });
        }
        
        // Template HTML de la newsletter
        const htmlTemplate = (nom, prenom) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: #0f0f0f; border: 1px solid #d4af37; }
                    .header { background: linear-gradient(135deg, #d4af37, #f4d03f); padding: 20px; text-align: center; }
                    .header img { max-width: 80px; border-radius: 10px; }
                    .content { padding: 30px; color: #ffffff; }
                    .content h1 { color: #d4af37; }
                    .footer { background: #1a1a1a; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    .btn { background: #d4af37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
                    .social { margin-top: 20px; }
                    .social a { color: #d4af37; text-decoration: none; margin: 0 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://tia.mg/img/Logo_Tia_Infos.jpg" alt="TIA INFO">
                        <h1 style="color: #000; margin-top: 10px;">TIA INFO</h1>
                    </div>
                    <div class="content">
                        ${prenom || nom ? `<p>Bonjour ${prenom || ''} ${nom || ''},</p>` : '<p>Bonjour,</p>'}
                        ${content}
                        <div style="text-align: center;">
                            <a href="https://tia.mg" class="btn">Visitez notre site</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>TIA INFO Toamasina - Centre de Formation Professionnelle</p>
                        <p>Boulevard Joffre, Toamasina, Madagascar</p>
                        <div class="social">
                            <a href="#">Facebook</a> | <a href="#">LinkedIn</a> | <a href="#">WhatsApp</a>
                        </div>
                        <p>Vous recevez cet email car vous êtes inscrit à notre newsletter.</p>
                        <p><a href="https://tia.mg/newsletter/unsubscribe" style="color: #d4af37;">Se désinscrire</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Envoyer les emails (avec limite de débit pour éviter le spam)
        let sentCount = 0;
        let failedCount = 0;
        
        for (const recipient of recipients) {
            try {
                await req.transporter.sendMail({
                    from: '"TIA INFO" <contact@tia.mg>',
                    to: recipient.email,
                    subject: subject,
                    html: htmlTemplate(recipient.nom, recipient.prenom)
                });
                sentCount++;
                
                // Pause de 1 seconde entre chaque email pour respecter les limites
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Erreur d'envoi à ${recipient.email}:`, error);
                failedCount++;
            }
        }
        
        // Enregistrer l'envoi dans l'historique
        await db.execute(
            `INSERT INTO newsletter_history (subject, recipients_count, sent_count, failed_count, sent_by) 
             VALUES (?, ?, ?, ?, ?)`,
            [subject, recipients.length, sentCount, failedCount, req.userId]
        );
        
        res.json({
            message: `Newsletter envoyée`,
            stats: {
                total: recipients.length,
                sent: sentCount,
                failed: failedCount
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de la newsletter' });
    }
});

// ============================================
// 5. ADMIN: Historique des envois
// ============================================
router.get('/admin/history', verifyAdmin, async (req, res) => {
    const db = req.db;
    const { page = 1, limit = 20 } = req.query;
    
    try {
        const offset = (page - 1) * limit;
        
        const [history] = await db.execute(
            `SELECT nh.*, u.nom, u.prenom 
             FROM newsletter_history nh
             LEFT JOIN users u ON nh.sent_by = u.id
             ORDER BY nh.sent_at DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), offset]
        );
        
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM newsletter_history'
        );
        
        res.json({
            history,
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
// 6. ADMIN: Exporter les abonnés (CSV)
// ============================================
router.get('/admin/export', verifyAdmin, async (req, res) => {
    const db = req.db;
    const { actif } = req.query;
    
    try {
        let query = 'SELECT email, nom, prenom, date_inscription, actif FROM newsletter_subscribers';
        const params = [];
        
        if (actif !== undefined) {
            query += ' WHERE actif = ?';
            params.push(actif === 'true');
        }
        
        query += ' ORDER BY date_inscription DESC';
        
        const [subscribers] = await db.execute(query, params);
        
        // Générer CSV
        let csv = 'Email,Nom,Prénom,Date d\'inscription,Actif\n';
        for (const sub of subscribers) {
            csv += `"${sub.email}","${sub.nom || ''}","${sub.prenom || ''}","${sub.date_inscription}","${sub.actif ? 'Oui' : 'Non'}"\n`;
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'export' });
    }
});

// ============================================
// 7. ADMIN: Supprimer un abonné
// ============================================
router.delete('/admin/subscribers/:id', verifyAdmin, [
    param('id').isInt()
], async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    
    try {
        await db.execute('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
        res.json({ message: 'Abonné supprimé avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

module.exports = router;