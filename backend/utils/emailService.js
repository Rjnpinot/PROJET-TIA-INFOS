/**
 * TIA INFO — Service d'envoi d'emails
 */
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Envoie un email formaté
   * @param {string} to - Destinataire
   * @param {string} subject - Objet
   * @param {string} html - Corps HTML
   */
  async send(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"TIA INFO" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      console.log(`[EMAIL] Envoyé à ${to} : ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[EMAIL ERROR] Erreur d'envoi à ${to} :`, error.message);
      // On ne bloque pas le processus si l'email échoue en démo
      return null;
    }
  }

  /**
   * Email de bienvenue après inscription
   */
  async sendWelcome(user) {
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h1 style="color: #d4af37; text-align: center;">Bienvenue chez TIA INFO !</h1>
        <p>Bonjour <strong>${user.prenom}</strong>,</p>
        <p>Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nos étudiants.</p>
        <p>Vous pouvez maintenant explorer notre catalogue et vous inscrire à vos premières formations.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:5000/login" style="background:#d4af37; color:#000; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight: bold;">Accéder à mon espace</a>
        </div>
        <p style="font-size: 0.9em; color: #888;">Si vous n'avez pas créé ce compte, veuillez ignorer cet email.</p>
      </div>
    `;
    return this.send(user.email, 'Bienvenue chez TIA INFO', html);
  }

  /**
   * Email de vérification de compte
   */
  async sendVerification(user, verificationLink) {
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h1 style="color: #d4af37; text-align: center;">Vérifiez votre compte</h1>
        <p>Bonjour <strong>${user.prenom}</strong>,</p>
        <p>Merci de vous être inscrit sur TIA INFO. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background:#d4af37; color:#000; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight: bold;">Vérifier mon email</a>
        </div>
        <p>Ou copiez ce lien : <br><a href="${verificationLink}">${verificationLink}</a></p>
        <p style="font-size: 0.8em; color: #888;">Ce lien expirera dans 24 heures.</p>
      </div>
    `;
    return this.send(user.email, 'Vérification de votre compte TIA INFO', html);
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordReset(user, resetLink) {
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h1 style="color: #d4af37; text-align: center;">Réinitialisation de mot de passe</h1>
        <p>Bonjour <strong>${user.prenom}</strong>,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte TIA INFO.</p>
        <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background:#d4af37; color:#000; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email en toute sécurité.</p>
      </div>
    `;
    return this.send(user.email, 'Réinitialisation de votre mot de passe TIA INFO', html);
  }

  /**
   * Confirmation de paiement
   */
  async sendPaymentConfirmation(user, formation, transactionId) {
    const html = `
      <div style="font-family: sans-serif;">
        <h1 style="color: green;">Paiement Validé !</h1>
        <p>Félicitations <strong>${user.prenom}</strong>,</p>
        <p>Votre inscription à la formation <strong>${formation.titre}</strong> est confirmée.</p>
        <p>ID Transaction : <code>${transactionId}</code></p>
        <p>Vous pouvez commencer votre apprentissage dès maintenant sur votre tableau de bord.</p>
      </div>
    `;
    return this.send(user.email, `Confirmation d'inscription : ${formation.titre}`, html);
  }
}

module.exports = new EmailService();
