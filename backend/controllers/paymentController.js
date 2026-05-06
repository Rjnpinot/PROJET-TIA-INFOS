/**
 * TIA INFO — Contrôleur de Paiement
 * Gère les transactions et les paiements mobiles
 */

const PaymentSimulator = require('../utils/paymentSimulator');
const EmailService = require('../utils/emailService');
const PdfGenerator = require('../utils/pdfGenerator');

/**
 * Initier un paiement
 */
exports.initiatePayment = async (req, res) => {
    const { userId, formationId, operateur, telephone, montant } = req.body;
    const db = req.db;
    
    if (!userId || !formationId || !operateur || !telephone) {
        return res.status(400).json({ error: 'Données manquantes' });
    }
    
    try {
        // Vérifier utilisateur
        const [users] = await db.execute('SELECT id, email, nom, prenom FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Vérifier formation
        const [formations] = await db.execute('SELECT id, titre, prix FROM formations WHERE id = ?', [formationId]);
        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        
        const user = users[0];
        const formation = formations[0];
        const amount = montant || formation.prix;
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Créer inscription
        const [inscription] = await db.execute(
            'INSERT INTO inscriptions (user_id, formation_id) VALUES (?, ?)',
            [userId, formationId]
        );
        
        // Créer enregistrement paiement
        const [payment] = await db.execute(
            `INSERT INTO paiements (user_id, inscription_id, montant, operateur, telephone, transaction_id, statut) 
             VALUES (?, ?, ?, ?, ?, ?, 'en_attente')`,
            [userId, inscription.insertId, amount, operateur, telephone, transactionId]
        );
        
        // Traiter le paiement
        let paymentResult = { success: false, message: 'Opérateur non supporté' };
        
        const supportedOperators = ['mvola', 'orange', 'airtel', 'especes'];
        if (supportedOperators.includes(operateur)) {
            paymentResult = await PaymentSimulator.process(operateur, telephone, amount);
        }
        
        if (paymentResult.success) {
            // Mettre à jour statut
            await db.execute(
                'UPDATE paiements SET statut = "valide", transaction_id = ? WHERE id = ?',
                [paymentResult.transactionId, payment.insertId]
            );
            
            // Envoyer email de confirmation
            try {
                await EmailService.sendPaymentConfirmation(user, formation, paymentResult.transactionId);
            } catch (e) {
                console.warn('Email non envoyé:', e.message);
            }
            
            res.json({
                success: true,
                message: 'Paiement validé avec succès',
                transactionId: paymentResult.transactionId,
                inscriptionId: inscription.insertId
            });
        } else {
            await db.execute('UPDATE paiements SET statut = "echoue" WHERE id = ?', [payment.insertId]);
            res.status(400).json({ error: paymentResult.message });
        }
    } catch (error) {
        console.error('Erreur initiatePayment:', error);
        res.status(500).json({ error: 'Erreur lors du traitement du paiement' });
    }
};

/**
 * Récupérer l'historique des paiements d'un utilisateur
 */
exports.getPaymentHistory = async (req, res) => {
    const { userId } = req.params;
    const db = req.db;
    
    try {
        const [payments] = await db.execute(
            `SELECT p.*, f.titre as formation_titre 
             FROM paiements p 
             LEFT JOIN inscriptions i ON p.inscription_id = i.id 
             LEFT JOIN formations f ON i.formation_id = f.id 
             WHERE p.user_id = ? 
             ORDER BY p.date_paiement DESC 
             LIMIT 50`,
            [userId]
        );
        
        res.json(payments);
    } catch (error) {
        console.error('Erreur getPaymentHistory:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
};

/**
 * Vérifier le statut d'un paiement
 */
exports.checkPaymentStatus = async (req, res) => {
    const { transactionId } = req.params;
    const db = req.db;
    
    try {
        const [payments] = await db.execute(
            'SELECT * FROM paiements WHERE transaction_id = ?',
            [transactionId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        
        res.json(payments[0]);
    } catch (error) {
        console.error('Erreur checkPaymentStatus:', error);
        res.status(500).json({ error: 'Erreur lors de la vérification du paiement' });
    }
};

/**
 * Générer un reçu PDF
 */
exports.generateReceipt = async (req, res) => {
    const { paymentId } = req.params;
    const db = req.db;
    
    try {
        const [payments] = await db.execute(
            `SELECT p.*, u.nom, u.prenom, u.email, f.titre as formation_titre, f.prix 
             FROM paiements p 
             LEFT JOIN users u ON p.user_id = u.id 
             LEFT JOIN inscriptions i ON p.inscription_id = i.id 
             LEFT JOIN formations f ON i.formation_id = f.id 
             WHERE p.id = ?`,
            [paymentId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ error: 'Paiement non trouvé' });
        }
        
        const payment = payments[0];
        
        // Générer PDF
        const pdfBuffer = await PdfGenerator.generateReceipt(payment);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.transaction_id}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Erreur generateReceipt:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du reçu' });
    }
};

/**
 * Annuler un paiement en attente
 */
exports.cancelPayment = async (req, res) => {
    const { paymentId } = req.params;
    const db = req.db;
    
    try {
        const [payments] = await db.execute('SELECT * FROM paiements WHERE id = ?', [paymentId]);
        if (payments.length === 0) {
            return res.status(404).json({ error: 'Paiement non trouvé' });
        }
        
        const payment = payments[0];
        if (payment.statut !== 'en_attente') {
            return res.status(400).json({ error: 'Seuls les paiements en attente peuvent être annulés' });
        }
        
        await db.execute('UPDATE paiements SET statut = "annule" WHERE id = ?', [paymentId]);
        
        res.json({ message: 'Paiement annulé avec succès' });
    } catch (error) {
        console.error('Erreur cancelPayment:', error);
        res.status(500).json({ error: 'Erreur lors de l\'annulation' });
    }
};

/**
 * Obtenir les statistiques de paiement (Admin)
 */
exports.getPaymentStats = async (req, res) => {
    const db = req.db;
    
    try {
        // Total des paiements validés
        const [stats] = await db.execute(
            `SELECT 
                COUNT(*) as total_transactions,
                SUM(montant) as total_montant,
                COUNT(DISTINCT user_id) as total_users,
                statut,
                operateur
             FROM paiements 
             GROUP BY statut, operateur`
        );
        
        // Paiements du jour
        const [today] = await db.execute(
            `SELECT SUM(montant) as montant_jour 
             FROM paiements 
             WHERE DATE(date_paiement) = CURDATE() AND statut = 'valide'`
        );
        
        res.json({
            statistics: stats,
            today: today[0]
        });
    } catch (error) {
        console.error('Erreur getPaymentStats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
};

