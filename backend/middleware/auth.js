const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

// Guard: fail loudly if JWT_SECRET is missing — never fall back to a default
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET is not set in .env — server cannot start securely.');
    process.exit(1);
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token. Please login again.' });
    }
}

module.exports = { verifyToken };

