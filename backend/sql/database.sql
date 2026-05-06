-- Structure MySQL exemple
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS tia_info_db;
USE tia_info_db;

-- Table utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    photo VARCHAR(255),
    biographie TEXT,
    role ENUM('etudiant', 'formateur', 'secretaire', 'admin', 'super_admin') DEFAULT 'etudiant',
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Table formations
CREATE TABLE formations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    duree VARCHAR(50),
    description TEXT,
    image VARCHAR(255),
    populaire BOOLEAN DEFAULT FALSE,
    programme TEXT,
    prerequis TEXT,
    objectifs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table inscriptions
CREATE TABLE inscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    formation_id INT NOT NULL,
    progression INT DEFAULT 0,
    score_final INT,
    certificat_genere BOOLEAN DEFAULT FALSE,
    certificat_code VARCHAR(100),
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (formation_id) REFERENCES formations(id)
);

-- Table paiements
CREATE TABLE paiements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    inscription_id INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    operateur ENUM('mvola', 'orange', 'airtel', 'especes') NOT NULL,
    telephone VARCHAR(20),
    transaction_id VARCHAR(100),
    statut ENUM('en_attente', 'valide', 'echoue') DEFAULT 'en_attente',
    recu_pdf VARCHAR(255),
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id)
);

-- Table cours/contenu
CREATE TABLE cours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    formation_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    type ENUM('video', 'pdf', 'quiz', 'devoir') NOT NULL,
    contenu TEXT,
    duree INT,
    ordre INT DEFAULT 0,
    FOREIGN KEY (formation_id) REFERENCES formations(id)
);

-- Table quiz
CREATE TABLE quiz (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cours_id INT NOT NULL,
    titre VARCHAR(255),
    score_minimum INT DEFAULT 70,
    FOREIGN KEY (cours_id) REFERENCES cours(id)
);

-- Table questions_quiz
CREATE TABLE questions_quiz (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question TEXT NOT NULL,
    option1 VARCHAR(255),
    option2 VARCHAR(255),
    option3 VARCHAR(255),
    option4 VARCHAR(255),
    bonne_reponse INT,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id)
);

-- Table resultats_quiz
CREATE TABLE resultats_quiz (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score INT,
    date_completion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quiz(id)
);

-- Table messages
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expediteur_id INT NOT NULL,
    destinataire_id INT NOT NULL,
    sujet VARCHAR(255),
    contenu TEXT,
    lu BOOLEAN DEFAULT FALSE,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id) REFERENCES users(id),
    FOREIGN KEY (destinataire_id) REFERENCES users(id)
);

-- Table evenements
CREATE TABLE evenements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    heure TIME,
    lieu VARCHAR(255),
    capacite INT,
    prix DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table inscriptions_evenements
CREATE TABLE inscriptions_evenements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    evenement_id INT NOT NULL,
    badge_genere BOOLEAN DEFAULT FALSE,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (evenement_id) REFERENCES evenements(id)
);

-- Table newsletter_subscribers
CREATE TABLE newsletter_subscribers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN DEFAULT TRUE
);

-- Table newsletter_history (Suivi des envois)
CREATE TABLE newsletter_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(255) NOT NULL,
    recipients_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_by INT,
    FOREIGN KEY (sent_by) REFERENCES users(id)
);

-- Ajout des indices pour optimiser les requêtes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_inscriptions_user_id ON inscriptions(user_id);
CREATE INDEX idx_inscriptions_formation_id ON inscriptions(formation_id);
CREATE INDEX idx_paiements_user_id ON paiements(user_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_paiements_transaction_id ON paiements(transaction_id);
CREATE INDEX idx_cours_formation_id ON cours(formation_id);
CREATE INDEX idx_quiz_cours_id ON quiz(cours_id);
CREATE INDEX idx_messages_destinataire_id ON messages(destinataire_id);
CREATE INDEX idx_newsletter_subscribers_actif ON newsletter_subscribers(actif);

-- Insertion des 16 formations (données corrigées avec bons encodages)
INSERT INTO formations (id, titre, categorie, prix, duree, description, populaire, image) VALUES
(1, 'Bureautique Avancée', 'informatique', 120000, '2 mois', 'Maîtrisez Word, Excel, PowerPoint et les outils collaboratifs.', true, 'img/informatique-bureautique.jpg'),
(2, 'Développement Web Fullstack', 'informatique', 350000, '4 mois', 'Apprenez HTML, CSS, JS, React, Node.js et SQL.', true, 'img/course-web.png'),
(3, 'Français Professionnel', 'langues', 100000, '3 mois', 'Communication fluide et rédaction commerciale.', false, 'https://images.unsplash.com/photo-1543167664-4001cd663562?q=80&w=600&auto=format&fit=crop'),
(4, 'Anglais (Parler - Écrire)', 'langues', 100000, '3 mois', 'De débutant à conversationnel avec des formateurs natifs.', true, 'img/Cours_de_langue.jpg'),
(5, 'Comptabilité de Gestion', 'gestion', 250000, '3 mois', 'Maîtrisez le PCMN et les logiciels de comptabilité SAGE.', false, 'https://images.unsplash.com/photo-1454165833267-024f1c32474d?q=80&w=600&auto=format&fit=crop'),
(6, 'Marketing Digital & SMM', 'gestion', 200000, '2 mois', 'Publicités Facebook, Instagram et stratégie de contenu.', false, 'img/Marketing_digital.jpg'),
(7, 'Design Graphique & Vidéo', 'design', 250000, '3 mois', 'Photoshop, Illustrator, Canva, et Montage Vidéo.', true, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop'),
(8, 'Google Intelligence Artificielle', 'ia', 300000, '1.5 mois', 'Maîtrisez ChatGPT, Gemini et l\'IA pour la productivité.', true, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop'),
(9, 'Maintenance Informatique', 'informatique', 200000, '3 mois', 'Dépannage matériel et logiciel, réseaux et sécurité.', false, 'img/nos-formations.jpg'),
(10, 'Secrétariat Bureautique', 'gestion', 150000, '3 mois', 'Gestion administrative, accueil et outils bureautiques.', false, 'img/nos-formations.jpg'),
(11, 'Allemand', 'langues', 120000, '4 mois', 'Apprentissage de la langue allemande pour tous niveaux.', false, 'img/nos-formations.jpg'),
(12, 'Chinois (Mandarin)', 'langues', 150000, '4 mois', 'Initiation et perfectionnement à la langue chinoise.', false, 'img/nos-formations.jpg'),
(13, 'Montage Vidéo Pro', 'design', 280000, '2 mois', 'Maîtrisez Adobe Premiere Pro et After Effects.', false, 'img/nos-formations.jpg'),
(14, 'Entrepreneuriat', 'gestion', 300000, '2 mois', 'Création et gestion de startup à Madagascar.', false, 'img/nos-formations.jpg'),
(15, 'TIA INFO Kids', 'enfants', 80000, 'Continu', 'Le codage et la robotique expliqués aux enfants.', true, 'img/nos-formations.jpg'),
(16, 'Robotique & Arduino', 'ia', 320000, '3 mois', 'Construisez vos propres systèmes intelligents.', false, 'img/cat_ai.png');