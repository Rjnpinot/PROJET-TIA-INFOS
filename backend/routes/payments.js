/**
 * TIA INFO — Routes de Paiement
 * Gère les paiements et transactions
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// ============================================
// Endpoints Paiement
// ============================================

// Initier un paiement
router.post('/initiate', paymentController.initiatePayment);

// Récupérer l'historique des paiements d'un utilisateur
router.get('/history/:userId', verifyToken, paymentController.getPaymentHistory);

// Vérifier le statut d'un paiement
router.get('/status/:transactionId', paymentController.checkPaymentStatus);

// Générer un reçu PDF
router.get('/receipt/:paymentId', verifyToken, paymentController.generateReceipt);

// Annuler un paiement en attente
router.post('/cancel/:paymentId', verifyToken, paymentController.cancelPayment);

// Statistiques de paiement (Admin)
router.get('/stats/admin/all', verifyAdmin, paymentController.getPaymentStats);

// Gestion des erreurs globale
router.use((error, req, res, next) => {
    console.error('Erreur API Paiement:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
});

module.exports = router;

// Générer un certificat de réussite
router.get('/certificate/:inscriptionId', async (req, res) => {
  const { inscriptionId } = req.params;
  const db = req.db;
  
  try {
    const [rows] = await db.execute(
      `SELECT u.id as user_id, u.nom, u.prenom, f.id as formation_id, f.titre, f.categorie 
       FROM inscriptions i 
       JOIN users u ON i.user_id = u.id 
       JOIN formations f ON i.formation_id = f.id 
       WHERE i.id = ?`,
      [inscriptionId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    
    const user = { id: rows[0].user_id, nom: rows[0].nom, prenom: rows[0].prenom };
    const formation = { id: rows[0].formation_id, titre: rows[0].titre, categorie: rows[0].categorie };
    
    // Générer le certificat PDF
    PdfGenerator.generateCertificate(res, user, formation);
    
  } catch (error) {
    console.error('[CERTIFICATE ERROR] :', error);
    res.status(500).json({ error: 'Erreur lors de la génération du certificat' });
  }
});

module.exports = router;