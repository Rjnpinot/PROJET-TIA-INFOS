/**
 * TIA INFO TOAMASINA — Script de Configuration des Tests
 * Ce script pré-configure des comptes de test pour chaque rôle utilisateur.
 * Run this in the browser console or include it temporarily.
 */

const setupTestUsers = async () => {
    console.log("🚀 Initialisation des comptes de test...");

    const users = [
        {
            email: 'admin@tia.mg',
            password: 'password123',
            nom: 'ADMIN',
            prenom: 'System',
            role: 'admin',
            telephone: '0340000001'
        },
        {
            email: 'formateur@tia.mg',
            password: 'password123',
            nom: 'FORMATEUR',
            prenom: 'Jean',
            role: 'formateur',
            telephone: '0340000002'
        },
        {
            email: 'etudiant@tia.mg',
            password: 'password123',
            nom: 'Razakamahefa',
            prenom: 'Nicolas',
            role: 'student',
            telephone: '0340000003'
        }
    ];

    // Nettoyer l'existant pour les tests
    localStorage.removeItem('tia_users');
    localStorage.removeItem('tia_user');
    localStorage.removeItem('tia_tokens');

    const auth = new AuthManager();

    for (const userData of users) {
        try {
            await auth.register(userData);
            console.log(`✅ Compte créé : ${userData.email} (${userData.role})`);
            
            // Auto-vérifier l'email pour le test
            const user = auth.users.find(u => u.email === userData.email);
            if (user) {
                user.verified = true;
                user.verificationToken = null;
                auth.saveUsers();
                console.log(`📡 Email auto-vérifié pour ${userData.email}`);
            }
        } catch (error) {
            console.error(`❌ Erreur pour ${userData.email}:`, error.message);
        }
    }

    console.log("✨ Configuration terminée ! Vous pouvez maintenant vous connecter avec 'password123'.");
};

// Exposer globalement
window.setupTestUsers = setupTestUsers;
