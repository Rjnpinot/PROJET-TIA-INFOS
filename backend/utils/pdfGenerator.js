/**
 * TIA INFO — Générateur de PDF
 * Génère des reçus de paiement et des certificats de formation
 */
const PDFDocument = require('pdfkit');

class PdfGenerator {

  /**
   * Génère un reçu de paiement en PDF et le pipe dans la réponse Express
   * @param {Object} res - Réponse Express (stream)
   * @param {Object} payment - Données du paiement
   * @param {Object} user - Données de l'utilisateur
   * @param {Object} formation - Données de la formation
   */
  static generatePaymentReceipt(res, payment, user, formation) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu_${payment.transaction_id}.pdf"`);
    doc.pipe(res);

    // ── En-tête ──────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill('#0a0a0a');
    doc.fillColor('#d4af37').fontSize(28).font('Helvetica-Bold')
       .text('TIA INFO', 50, 35, { align: 'center' });
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica')
       .text('Centre de Formation Professionnelle — Toamasina, Madagascar', 50, 68, { align: 'center' });
    doc.fillColor('#d4af37').fontSize(10)
       .text('www.tia.mg | contact@tia.mg | +261 34 XX XXX XX', 50, 88, { align: 'center' });

    // ── Titre ─────────────────────────────────────────
    doc.moveDown(3);
    doc.fillColor('#0a0a0a').fontSize(20).font('Helvetica-Bold')
       .text('REÇU DE PAIEMENT', { align: 'center', underline: true });
    doc.moveDown(0.5);

    // ── Numéro de transaction ─────────────────────────
    doc.fillColor('#555').fontSize(11).font('Helvetica')
       .text(`Transaction : ${payment.transaction_id}`, { align: 'center' });
    doc.text(`Date : ${new Date(payment.date_paiement || Date.now()).toLocaleDateString('fr-MG')}`, { align: 'center' });

    // ── Séparateur ────────────────────────────────────
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d4af37').lineWidth(2).stroke();
    doc.moveDown(1);

    // ── Informations Client ───────────────────────────
    const infoColor = '#111';
    const labelX = 50, valueX = 250;

    const addRow = (label, value) => {
      const y = doc.y;
      doc.fillColor('#888').fontSize(10).font('Helvetica').text(label, labelX, y);
      doc.fillColor(infoColor).fontSize(11).font('Helvetica-Bold').text(value, valueX, y);
      doc.moveDown(0.8);
    };

    doc.fillColor('#d4af37').fontSize(13).font('Helvetica-Bold').text('Informations Client');
    doc.moveDown(0.5);
    addRow('Nom complet :', `${user.prenom} ${user.nom}`);
    addRow('Email :', user.email);
    addRow('Téléphone :', payment.telephone || 'N/A');

    // ── Séparateur ────────────────────────────────────
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d4af37').lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Détails du Paiement ───────────────────────────
    doc.fillColor('#d4af37').fontSize(13).font('Helvetica-Bold').text('Détails de la Formation');
    doc.moveDown(0.5);
    addRow('Formation :', formation.titre);
    addRow('Opérateur :', (payment.operateur || '').toUpperCase());
    addRow('Montant payé :', `${Number(payment.montant).toLocaleString('fr-MG')} Ar`);
    addRow('Statut :', 'VALIDÉ ✓');

    // ── Cadre Montant ─────────────────────────────────
    doc.moveDown(1);
    doc.rect(50, doc.y, 495, 60)
       .fillAndStroke('#f7f0d6', '#d4af37');
    doc.fillColor('#0a0a0a').fontSize(18).font('Helvetica-Bold')
       .text(`Montant Total : ${Number(payment.montant).toLocaleString('fr-MG')} Ar`,
             50, doc.y - 45, { align: 'center' });

    // ── Pied de page ──────────────────────────────────
    doc.moveDown(5);
    doc.fillColor('#888').fontSize(9).font('Helvetica')
       .text('Ce document est généré automatiquement et fait office de preuve de paiement officielle.', { align: 'center' });
    doc.text('Merci pour votre confiance. — TIA INFO Toamasina 2026', { align: 'center' });

    doc.end();
  }

  /**
   * Génère un certificat de réussite en PDF
   * @param {Object} res - Réponse Express (stream)
   * @param {Object} user - Données de l'utilisateur
   * @param {Object} formation - Données de la formation
   */
  static generateCertificate(res, user, formation) {
    const doc = new PDFDocument({ margin: 0, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificat_${user.id}_${formation.id}.pdf"`);
    doc.pipe(res);

    const { width, height } = doc.page;

    // ── Fond ──────────────────────────────────────────
    doc.rect(0, 0, width, height).fill('#0a0a0a');

    // ── Bordure dorée ─────────────────────────────────
    doc.rect(20, 20, width - 40, height - 40)
       .lineWidth(3).strokeColor('#d4af37').stroke();
    doc.rect(28, 28, width - 56, height - 56)
       .lineWidth(1).strokeColor('#d4af37').stroke();

    // ── Titre ─────────────────────────────────────────
    doc.fillColor('#d4af37').fontSize(42).font('Helvetica-Bold')
       .text('TIA INFO', 0, 60, { align: 'center' });
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica')
       .text('Centre de Formation Professionnelle — Toamasina, Madagascar', { align: 'center' });

    // ── Séparateur ────────────────────────────────────
    doc.moveTo(100, 140).lineTo(width - 100, 140)
       .strokeColor('#d4af37').lineWidth(1).stroke();

    // ── Corps du certificat ───────────────────────────
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica')
       .text('Certifie que', 0, 165, { align: 'center' });

    doc.fillColor('#d4af37').fontSize(36).font('Helvetica-Bold')
       .text(`${user.prenom} ${user.nom}`, 0, 195, { align: 'center' });

    doc.fillColor('#ffffff').fontSize(16).font('Helvetica')
       .text('a suivi et réussi avec succès la formation', 0, 255, { align: 'center' });

    doc.fillColor('#f7f0d6').fontSize(28).font('Helvetica-Bold')
       .text(formation.titre, 0, 285, { align: 'center' });

    doc.fillColor('#aaa').fontSize(13).font('Helvetica')
       .text(`Durée : ${formation.duree || 'N/A'} | Catégorie : ${formation.categorie || 'N/A'}`, 0, 330, { align: 'center' });

    // ── Date ──────────────────────────────────────────
    doc.moveTo(100, 365).lineTo(width - 100, 365)
       .strokeColor('#d4af37').lineWidth(1).stroke();

    const date = new Date().toLocaleDateString('fr-MG', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fillColor('#888').fontSize(11).font('Helvetica')
       .text(`Délivré le ${date} à Toamasina, Madagascar.`, 0, 380, { align: 'center' });

    // ── Zone Signature ────────────────────────────────
    doc.fillColor('#d4af37').fontSize(12).font('Helvetica-Bold')
       .text('_______________________________', 120, 420)
       .fillColor('#888').fontSize(10).font('Helvetica')
       .text('Directeur Pédagogique, TIA INFO', 120, 445);

    // ── ID Certificat ─────────────────────────────────
    doc.fillColor('#444').fontSize(9)
       .text(`ID Certificat : TIA-${user.id}-${formation.id}-${Date.now()}`, width - 300, height - 50);

    doc.end();
  }
}

module.exports = PdfGenerator;
