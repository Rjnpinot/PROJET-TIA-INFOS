/**
 * TIA INFO — Middleware d'Authentification JWT
 * Vérifie les tokens JWT et expose les données utilisateur aux routes protégées
 */

const jwt = require('jsonwebtoken');

/**
 * Vérifie le JWT et extrait les données utilisateur
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    
    // Format : "Bearer TOKEN"
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expiré' });
        }
        return res.status(401).json({ error: 'Token invalide' });
    }
};

/**
 * Vérifie que l'utilisateur est administrateur
 */
const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (!['admin', 'super_admin'].includes(req.userRole)) {
            return res.status(403).json({ error: 'Accès administrateur requis' });
        }
        next();
    });
};

/**
 * Vérifie que l'utilisateur est formateur ou administrateur
 */
const verifyFormateur = (req, res, next) => {
    verifyToken(req, res, () => {
        if (!['formateur', 'admin', 'super_admin'].includes(req.userRole)) {
            return res.status(403).json({ error: 'Accès formateur requis' });
        }
        next();
    });
};

/**
 * Middleware d'authentification optionnel
 * Ne bloque pas la requête si le token est absent
 */
const verifyTokenOptional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            req.userId = decoded.id;
            req.userEmail = decoded.email;
            req.userRole = decoded.role;
            req.user = decoded;
        } catch (error) {
            console.warn('Token optionnel invalide :', error.message);
        }
    }
    
    next();
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyFormateur,
    verifyTokenOptional
};
