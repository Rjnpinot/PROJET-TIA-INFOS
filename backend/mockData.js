/**
 * Mock Data for TIA INFO
 * Utilisé en mode dégradé quand MySQL est déconnecté.
 */

const MOCK_USERS = [
  {
    id: 1,
    email: 'etudiant@tia.mg',
    password_hash: '$2b$12$LQv3c1VqBWbrYBatYq82beuTdf6O2JPr5ZupqgB/9K5G/.UaTqH6l', // password: password123
    nom: 'Razakamahefa',
    prenom: 'Nicolas',
    role: 'student',
    verified: true
  },
  {
    id: 2,
    email: 'formateur@tia.mg',
    password_hash: '$2b$12$LQv3c1VqBWbrYBatYq82beuTdf6O2JPr5ZupqgB/9K5G/.UaTqH6l',
    nom: 'Razakamahefa',
    prenom: 'M.',
    role: 'formateur',
    verified: true
  },
  {
    id: 3,
    email: 'admin@tia.mg',
    password_hash: '$2b$12$LQv3c1VqBWbrYBatYq82beuTdf6O2JPr5ZupqgB/9K5G/.UaTqH6l',
    nom: 'Admin',
    prenom: 'TIA',
    role: 'admin',
    verified: true
  }
];

const MOCK_COURSES = [
  {
    id: 1,
    titre: "Bureautique Avancée",
    categorie: "informatique",
    prix: 120000,
    duree: "2 mois",
    description: "Maîtrisez Word, Excel, PowerPoint et les outils collaboratifs.",
    image: "/frontend/img/informatique-bureautique.jpg",
    populaire: true
  },
  {
    id: 2,
    titre: "Développement Web Fullstack",
    categorie: "informatique",
    prix: 350000,
    duree: "4 mois",
    description: "Apprenez HTML, CSS, JS, React, Node.js et SQL.",
    image: "/frontend/img/course-web.png",
    populaire: true
  },
  {
    id: 3,
    titre: "Français Professionnel",
    categorie: "langues",
    prix: 100000,
    duree: "3 mois",
    description: "Communication fluide et rédaction commerciale.",
    image: "https://images.unsplash.com/photo-1543167664-4001cd663562?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 4,
    titre: "Anglais (Parler - Écrire)",
    categorie: "langues",
    prix: 100000,
    duree: "3 mois",
    description: "De débutant à conversationnel avec des formateurs natifs.",
    image: "/frontend/img/Cours_de_langue.jpg",
    populaire: true
  },
  {
    id: 5,
    titre: "Comptabilité de Gestion",
    categorie: "gestion",
    prix: 250000,
    duree: "3 mois",
    description: "Maîtrisez le PCMN et les logiciels de comptabilité SAGE.",
    image: "https://images.unsplash.com/photo-1454165833267-024f1c32474d?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 6,
    titre: "Marketing Digital & SMM",
    categorie: "gestion",
    prix: 200000,
    duree: "2 mois",
    description: "Publicités Facebook, Instagram et stratégie de contenu.",
    image: "/frontend/img/Marketing_digital.jpg"
  },
  {
    id: 7,
    titre: "Design Graphique & Vidéo",
    categorie: "design",
    prix: 250000,
    duree: "3 mois",
    description: "Photoshop, Illustrator, Canva, et Montage Vidéo.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop",
    populaire: true
  },
  {
    id: 8,
    titre: "Google Intelligence Artificielle",
    categorie: "ia",
    prix: 300000,
    duree: "1.5 mois",
    description: "Maîtrisez ChatGPT, Gemini et l'IA pour la productivité.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop",
    populaire: true
  },
  {
    id: 9,
    titre: "Maintenance Informatique",
    categorie: "informatique",
    prix: 200000,
    duree: "3 mois",
    description: "Dépannage matériel et logiciel, réseaux et sécurité.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 10,
    titre: "Secrétariat Bureautique",
    categorie: "gestion",
    prix: 150000,
    duree: "3 mois",
    description: "Gestion administrative, accueil et outils bureautiques.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 11,
    titre: "Allemand",
    categorie: "langues",
    prix: 120000,
    duree: "4 mois",
    description: "Apprentissage de la langue allemande pour tous niveaux.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 12,
    titre: "Chinois (Mandarin)",
    categorie: "langues",
    prix: 150000,
    duree: "4 mois",
    description: "Initiation et perfectionnement à la langue chinoise.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 13,
    titre: "Montage Vidéo Pro",
    categorie: "design",
    prix: 280000,
    duree: "2 mois",
    description: "Maîtrisez Adobe Premiere Pro et After Effects.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 14,
    titre: "Entrepreneuriat",
    categorie: "gestion",
    prix: 300000,
    duree: "2 mois",
    description: "Création et gestion de startup à Madagascar.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 15,
    titre: "TIA INFO Kids",
    categorie: "enfants",
    prix: 80000,
    duree: "Continu",
    description: "Le codage et la robotique expliqués aux enfants.",
    image: "/frontend/img/nos-formations.jpg"
  },
  {
    id: 16,
    titre: "Robotique & Arduino",
    categorie: "ia",
    prix: 320000,
    duree: "3 mois",
    description: "Construisez vos propres systèmes intelligents.",
    image: "/frontend/img/cat_ai.png"
  }
];

const MOCK_ENROLLMENTS = [
  { id: 1, formation_id: 2, user_id: 1, progression: 45, score_final: 95, date_inscription: '2026-03-01' },
  { id: 2, formation_id: 8, user_id: 1, progression: 10, score_final: null, date_inscription: '2026-03-15' }
];

module.exports = { MOCK_USERS, MOCK_COURSES, MOCK_ENROLLMENTS };
