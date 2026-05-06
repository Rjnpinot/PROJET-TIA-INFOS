/**
 * TIA INFO — Générateur de fichiers Excel
 */
const ExcelJS = require('exceljs');

class ExcelGenerator {

  /**
   * Génère un fichier Excel de la liste des étudiants
   * @param {Array} students - Données étudiants
   * @returns {Buffer} Buffer Excel
   */
  static async generateStudentsList(students) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TIA INFO';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Étudiants', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // En-têtes stylisés
    sheet.columns = [
      { header: 'ID',          key: 'id',         width: 8 },
      { header: 'Prénom',      key: 'prenom',      width: 18 },
      { header: 'Nom',         key: 'nom',         width: 18 },
      { header: 'Email',       key: 'email',       width: 30 },
      { header: 'Téléphone',   key: 'telephone',   width: 18 },
      { header: 'Formation',   key: 'formation',   width: 30 },
      { header: 'Progression', key: 'progression', width: 14 },
      { header: 'Inscription', key: 'date',        width: 18 }
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Données
    for (const s of students) {
      const row = sheet.addRow({
        id: s.id,
        prenom: s.prenom,
        nom: s.nom,
        email: s.email,
        telephone: s.telephone || 'N/A',
        formation: s.formation || 'N/A',
        progression: `${s.progression || 0}%`,
        date: s.date_inscription
          ? new Date(s.date_inscription).toLocaleDateString('fr-MG')
          : 'N/A'
      });
      row.alignment = { horizontal: 'center' };
    }

    // Alternance lignes
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowNumber % 2 === 0 ? 'FFF7F0D6' : 'FFFFFFFF' }
          };
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFD4AF37' } }
          };
        });
      }
    });

    // Freeze la première ligne
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Génère un rapport de revenus mensuel
   * @param {Array} payments - Données paiements
   * @param {string} month - Mois (ex: "Mai 2026")
   * @returns {Buffer} Buffer Excel
   */
  static async generateRevenueReport(payments, month = '') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TIA INFO';

    const sheet = workbook.addWorksheet('Revenus');

    // Titre
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = `TIA INFO — Rapport des Revenus ${month}`;
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFD4AF37' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0A0A' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 40;

    sheet.columns = [
      { header: 'Date',        key: 'date',        width: 18 },
      { header: 'Étudiant',    key: 'etudiant',    width: 24 },
      { header: 'Formation',   key: 'formation',   width: 30 },
      { header: 'Opérateur',   key: 'operateur',   width: 14 },
      { header: 'Téléphone',   key: 'telephone',   width: 16 },
      { header: 'Montant (Ar)',key: 'montant',     width: 16 }
    ];

    const headerRow = sheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FF000000' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 22;

    let total = 0;
    for (const p of payments) {
      sheet.addRow({
        date: p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-MG') : 'N/A',
        etudiant: `${p.prenom || ''} ${p.nom || ''}`.trim(),
        formation: p.formation_titre || 'N/A',
        operateur: (p.operateur || '').toUpperCase(),
        telephone: p.telephone || 'N/A',
        montant: p.montant || 0
      });
      total += Number(p.montant) || 0;
    }

    // Ligne total
    const totalRow = sheet.addRow({ montant: total, formation: 'TOTAL' });
    totalRow.font = { bold: true };
    totalRow.getCell(6).numFmt = '#,##0 "Ar"';
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F0D6' } };

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = ExcelGenerator;
