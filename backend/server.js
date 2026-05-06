const path = require('path');
const fs = require('fs');

// Point d'entrée du serveur Node.js (Express)
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');

// Import des routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const newsletterRoutes = require('./routes/newsletter');
const adminReportsRoutes = require('./routes/adminReports');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Sécurité & CSP relaxed pour le développement local
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' http://localhost:5000; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5000; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: http://localhost:5000; " +
        "connect-src 'self' http://localhost:5000 ws://localhost:5000;"
    );
    next();
});

app.use('/uploads', express.static('uploads'));

// Routes frontend amicales (Déplacées en haut pour priorité)
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html')));
app.get('/formateur', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/formateur.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/admin.html')));

// Servir le frontend (statique)
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/img', express.static(path.join(__dirname, '../frontend/img')));
app.use('/data', express.static(path.join(__dirname, '../frontend/data')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

// Redirection pour éviter le 404 sur index.html
app.get('/index.html', (req, res) => res.redirect('/'));

// Manifest et SW à la racine
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, '../manifest.json')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(__dirname, '../sw.js')));

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Configuration email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Configuration Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + process.env.EMAIL_USER,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID keys missing in .env. Push notifications disabled.');
}

//// Connexion à la base de données

// S'assurer que les dossiers d'uploads existent
const uploadDirs = ['uploads', 'uploads/avatars', 'uploads/courses'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const { MOCK_USERS, MOCK_COURSES, MOCK_ENROLLMENTS } = require('./mockData');

let db = null;
const mockDb = {
  execute: async (query, params) => {
    console.log('[MOCK DB] Executing:', query, params);
    // Plus de logique mock pour les routes communes
    if (query.includes('SELECT * FROM users WHERE email = ?')) {
        const user = MOCK_USERS.find(u => u.email === params[0]);
        return [user ? [user] : [], []];
    }
    if (query.includes('SELECT * FROM formations') || query.includes('SELECT * FROM courses')) {
        return [MOCK_COURSES, []];
    }
    if (query.includes('FROM inscriptions') || query.includes('FROM enrollments')) {
        return [MOCK_ENROLLMENTS, []];
    }
    return [[], []]; 
  },
  query: async (query, params) => {
    return this.execute(query, params);
  }
};

async function startServer() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tia_info_db'
    });
    console.log('✅ Connecté à MySQL (' + (process.env.DB_NAME || 'tia_info_db') + ')');
  } catch (error) {
    console.error('⚠️ ALERTE: Impossible de se connecter à MySQL. Mode "DÉGRADÉ" activé.');
    db = mockDb;
  }

  // Middleware pour injecter db dans les routes
  app.use((req, res, next) => {
    req.db = db;
    req.io = io;
    req.webpush = webpush;
    next();
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/newsletter', newsletterRoutes);
  app.use('/api', adminReportsRoutes);

  // Route de test
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db_connected: db !== null });
  });

  // Route pour upload de fichiers
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
    res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
  });

  // Gestion asynchrone des sockets
  io.on('connection', (socket) => {
    console.log('Nouvelle connexion socket:', socket.id);
    socket.on('disconnect', () => {
      console.log('Déconnexion:', socket.id);
    });
  });

  // Démarrage du serveur
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
  });
}

startServer();