export const CATEGORIES = {
  informatique: { id: "informatique", label: "Informatique & Dev", icon: "💻" },
  langues: { id: "langues", label: "Langues Étrangères", icon: "🌍" },
  gestion: { id: "gestion", label: "Gestion & Marketing", icon: "📊" },
  design: { id: "design", label: "Design & Multimédia", icon: "🎨" },
  ia: { id: "ia", label: "Intelligence Artificielle", icon: "🤖" },
  enfants: { id: "enfants", label: "TIA INFO Kids", icon: "🎮" },
  specialise: { id: "specialise", label: "Formations Spécialisées", icon: "⚙️" }
};

export const FORMATIONS = [
  {
    id: 1,
    titre: "Bureautique Avancée",
    categorie: "informatique",
    prix: "120000 Ar",
    duree: "2 mois",
    description: "Maîtrisez Word, Excel, PowerPoint et les outils collaboratifs.",
    image: "img/informatique-bureautique.jpg",
    populaire: true
  },
  {
    id: 2,
    titre: "Développement Web Fullstack",
    categorie: "informatique",
    prix: "350000 Ar",
    duree: "4 mois",
    description: "Apprenez HTML, CSS, JS, React, Node.js et SQL.",
    image: "img/course-web.png",
    populaire: true
  },
  {
    id: 3,
    titre: "Français Professionnel",
    categorie: "langues",
    prix: "100000 Ar",
    duree: "3 mois",
    description: "Communication fluide et rédaction commerciale.",
    image: "https://images.unsplash.com/photo-1543167664-4001cd663562?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 4,
    titre: "Anglais (Parler - Écrire)",
    categorie: "langues",
    prix: "100000 Ar",
    duree: "3 mois",
    description: "De débutant à conversationnel avec des formateurs natifs.",
    image: "img/Cours_de_langue.jpg",
    populaire: true
  },
  {
    id: 5,
    titre: "Comptabilité de Gestion",
    categorie: "gestion",
    prix: "250000 Ar",
    duree: "3 mois",
    description: "Maîtrisez le PCMN et les logiciels de comptabilité SAGE.",
    image: "https://images.unsplash.com/photo-1454165833267-024f1c32474d?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 6,
    titre: "Marketing Digital & SMM",
    categorie: "gestion",
    prix: "200000 Ar",
    duree: "2 mois",
    description: "Publicités Facebook, Instagram et stratégie de contenu.",
    image: "img/Marketing_digital.jpg",
  },
  {
    id: 7,
    titre: "Design Graphique & Vidéo",
    categorie: "design",
    prix: "250000 Ar",
    duree: "3 mois",
    description: "Photoshop, Illustrator, Canva, et Montage Vidéo.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop",
    populaire: true
  },
  {
    id: 8,
    titre: "Google Intelligence Artificielle",
    categorie: "ia",
    prix: "300000 Ar",
    duree: "1.5 mois",
    description: "Maîtrisez ChatGPT, Gemini et l'IA pour la productivité.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop",
    populaire: true
  },
  {
    id: 9,
    titre: "Maintenance Informatique",
    categorie: "informatique",
    prix: "200000 Ar",
    duree: "3 mois",
    description: "Dépannage matériel et logiciel, réseaux et sécurité.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 10,
    titre: "Secrétariat Bureautique",
    categorie: "gestion",
    prix: "150000 Ar",
    duree: "3 mois",
    description: "Gestion administrative, accueil et outils bureautiques.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 11,
    titre: "Allemand",
    categorie: "langues",
    prix: "120000 Ar",
    duree: "4 mois",
    description: "Apprentissage de la langue allemande pour tous niveaux.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 12,
    titre: "Chinois (Mandarin)",
    categorie: "langues",
    prix: "150000 Ar",
    duree: "4 mois",
    description: "Initiation et perfectionnement à la langue chinoise.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 13,
    titre: "Montage Vidéo Pro",
    categorie: "design",
    prix: "280000 Ar",
    duree: "2 mois",
    description: "Maîtrisez Adobe Premiere Pro et After Effects.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 14,
    titre: "Entrepreneuriat",
    categorie: "gestion",
    prix: "300000 Ar",
    duree: "2 mois",
    description: "Création et gestion de startup à Madagascar.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 15,
    titre: "TIA INFO Kids",
    categorie: "enfants",
    prix: "80000 Ar/mois",
    duree: "Continu",
    description: "Le codage et la robotique expliqués aux enfants.",
    image: "img/nos-formations.jpg"
  },
  {
    id: 16,
    titre: "Robotique & Arduino",
    categorie: "ia",
    prix: "320000 Ar",
    duree: "3 mois",
    description: "Construisez vos propres systèmes intelligents.",
    image: "img/cat_ai.png"
  }
];

// --- Contenu Détaillé des Cours ---
export const COURSES_CONTENT = {
  2: [ // Web Fullstack
    {
      id: "ch1",
      titre: "Introduction au HTML5",
      modules: [
        { id: "m1", titre: "Structure d'une page", type: "video", duration: "10:25" },
        { id: "m2", titre: "Les balises sémantiques", type: "pdf", pages: 5 },
        { id: "m3", titre: "Quiz : Fondations Web", type: "quiz" }
      ]
    },
    {
      id: "ch2",
      titre: "Maîtrise du CSS3",
      modules: [
        { id: "m4", titre: "Le Flexbox modernisé", type: "video", duration: "15:10" },
        { id: "m5", titre: "Animations & Transitions", type: "video", duration: "12:00" },
        { id: "m6", titre: "Quiz : Design Responsif", type: "quiz" }
      ]
    }
  ]
};

// --- Données des Quiz ---
export const QUIZZES_DATA = {
  "ch1": {
    title: "Fondations Web",
    questions: [
      { q: "Que signifie HTML ?", options: ["HyperText Markup Language", "High Tech Modern Language", "Hyperlink Text Management"], correct: 0 },
      { q: "Quelle balise définit le titre principal ?", options: ["<title>", "<h1>", "<head>"], correct: 1 }
    ]
  },
  "ch2": {
    title: "Design Responsif",
    questions: [
      { q: "Quelle propriété active Flexbox ?", options: ["display: flex", "position: flex", "align: block"], correct: 0 },
      { q: "Que signifie CSS ?", options: ["Cascading Style Sheets", "Creative Style System", "Computer Style Sheet"], correct: 0 }
    ]
  }
};

export const EVENTS = [
  {
    id: "evt-ia-2026",
    titre: "Masterclass Intelligence Artificielle",
    date: "2026-04-15",
    heure: "14h00",
    description: "Boostez votre productivité avec les derniers outils d'IA générative.",
    badge: "🔥 POPULAIRE",
    image: "img/Masterclass_ia.jpg"
  }
];

export const STUDENT_DEMO = {
  id: "std-001",
  isLoggedIn: true,
  username: "Nicolas Razakamahefa",
  nom: "Razakamahefa",
  prenom: "Nicolas",
  email: "etudiant@tia.mg",
  role: "student",
  formations: [2, 8],
  progression: { 2: 45, 8: 10 },
  scores: { "ch1": 95, 2: 95, 8: null },
  notifications: [
    { id: 1, text: "Nouveau cours disponible : React.js", date: "30/03/2026", read: false },
    { id: 2, text: "Votre quiz HTML a été noté", date: "29/03/2026", read: true }
  ]
};

export const TRAINER_DEMO = {
  id: "tr-001",
  username: "M. Razakamahefa",
  email: "formateur@tia.mg",
  role: "formateur",
  activeStudents: 124,
  courses: [2, 8],
  tasks: [
    { id: "t1", student: "Nicolas R.", course: "Web Fullstack", task: "Devoir Chapitre 2", status: "pending" }
  ]
};

export const BESTCOUR_RESOURCES = [
  {
    id: 1,
    title: "React Next.js 2026 : Formation Complète Débutant",
    category: "Développement Web",
    type: "pdf",
    link: "https://www.bestcours.com/react-nextjs-2026-formation-complete-debutant"
  },
  {
    id: 2,
    title: "Tuto React.js Next.js Débutant : Guide Front-End Moderne",
    category: "Développement Web",
    type: "video",
    link: "https://www.bestcours.com/tuto-reactjs-nextjs-debutant-guide-front-end-moderne"
  },
  {
    id: 3,
    title: "Comment Créer des Agents IA Autonomes avec n8n et ChatGPT ?",
    category: "Intelligence Artificielle",
    type: "pdf",
    link: "https://www.bestcours.com/comment-creer-des-agents-ia-autonomes-avec-n8n-et-chatgpt"
  },
  {
    id: 4,
    title: "Fortinet Firewall – Guide de configuration pour débutants",
    category: "Sécurité & Réseaux",
    type: "pdf",
    link: "https://www.bestcours.com/fortinet-firewall-guide-de-configuration-pour-debutants"
  },
  {
    id: 5,
    title: "Wi-Fi 7 et IA : optimisez vos réseaux d'entreprise",
    category: "Réseaux & IA",
    type: "pdf",
    link: "https://www.bestcours.com/wi-fi-7-et-ia-optimisez-vos-reseaux-dentreprise"
  },
  {
    id: 10,
    title: "Cours Technologies du web - PDF Gratuit",
    category: "Développement Web",
    type: "pdf",
    link: "https://www.bestcours.com/technologies-du-web"
  },
  {
    id: 11,
    title: "Cours Programmation Web : HTML - PDF Gratuit",
    category: "Développement Web",
    type: "pdf",
    link: "https://www.bestcours.com/programmation-web-html"
  },
  {
    id: 12,
    title: "Initiation au développement Web - PDF Gratuit",
    category: "Développement Web",
    type: "pdf",
    link: "https://www.bestcours.com/initiation-au-developpement-web"
  },
  {
    id: 13,
    title: "Cours Approche développement backend - PDF Gratuit",
    category: "Développement Web",
    type: "pdf",
    link: "https://www.bestcours.com/approche-developpement-backend"
  },
  {
    id: 14,
    title: "Introduction à Vue.js (v3) - PDF Gratuit",
    category: "Développement Web",
    type: "pdf",
    link: "https://www.bestcours.com/introduction-a-vue-js-v3"
  },
  {
    id: 15,
    title: "Cours de bases de données – Modèles et langages - PDF",
    category: "Bases de Données",
    type: "pdf",
    link: "https://www.bestcours.com/cours-de-bases-de-donnees-modeles-et-langages"
  }
];


