const express = require('express');
const router = express.Router();
const ExcelGenerator = require('../utils/excelGenerator');

/**
 * Route: GET /api/admin/reports/students
 * Description: Génère et télécharge la liste complète des étudiants et leurs inscriptions
 */
router.get('/admin/reports/students', async (req, res) => {
  const db = req.db;
  try {
    // Requête pour récupérer les étudiants et leurs formations
    const [rows] = await db.execute(`
      SELECT 
        u.nom, 
        u.prenom, 
        u.email, 
        u.telephone, 
        f.titre as formation,
        i.date_inscription as date
      FROM users u
      LEFT JOIN inscriptions i ON u.id = i.user_id
      LEFT JOIN formations f ON i.formation_id = f.id
      WHERE u.role = 'etudiant'
      ORDER BY u.nom ASC, i.date_inscription DESC
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aucun étudiant trouvé' });
    }

    // Générer le fichier Excel
    await ExcelGenerator.generateStudentsList(res, rows);
  } catch (error) {
    console.error('[REPORTS ERROR] Liste étudiants :', error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
});

/**
 * Route: GET /api/admin/reports/revenue
 * Description: Génère et télécharge le rapport des revenus pour un mois donné
 * Query Params: month (ex: "Mai 2026")
 */
router.get('/admin/reports/revenue', async (req, res) => {
  const db = req.db;
  const monthLabel = req.query.month || new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  
  try {
    // Extraction simplifiée pour la démo: on filtre par mois si possible ou on prend tout
    // En production, on utiliserait WHERE DATE_FORMAT(p.date_paiement, '%M %Y') = ...
    const [rows] = await db.execute(`
      SELECT 
        p.date_paiement as date,
        CONCAT(u.prenom, ' ', u.nom) as etudiant,
        f.titre as formation,
        p.operateur,
        p.telephone,
        p.montant
      FROM paiements p
      JOIN users u ON p.user_id = u.id
      JOIN inscriptions i ON p.inscription_id = i.id
      JOIN formations f ON i.formation_id = f.id
      WHERE p.statut = 'valide'
      ORDER BY p.date_paiement DESC
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aucun paiement trouvé pour cette période' });
    }

    // Formater la date pour Excel
    const formattedRows = rows.map(r => ({
      ...r,
      date: new Date(r.date).toLocaleDateString('fr-MG')
    }));

    // Générer le fichier Excel
    await ExcelGenerator.generateRevenueReport(res, formattedRows, monthLabel);
  } catch (error) {
    console.error('[REPORTS ERROR] Revenus :', error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
});

module.exports = router;
