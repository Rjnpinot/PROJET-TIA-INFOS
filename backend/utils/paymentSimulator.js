/**
 * TIA INFO — Simulateur de Paiement Mobile
 */
class PaymentSimulator {
  /**
   * Simule une transaction mobile avec délai
   * @param {string} operator - mvola, orange, airtel
   * @param {string} phone - Téléphone client
   * @param {number} amount - Montant
   * @returns {Promise<Object>} Résultat
   */
  static async process(operator, phone, amount) {
    console.log(`[SIMULATEUR] Traitement ${operator.toUpperCase()} : ${amount} Ar pour ${phone}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // En mode démo, on accepte tout après 2 secondes
        resolve({
          success: true,
          transactionId: `${operator.substring(0,2).toUpperCase()}-${Date.now()}`,
          message: `Paiement ${operator} validé.`
        });
      }, 2000);
    });
  }
}

module.exports = PaymentSimulator;
