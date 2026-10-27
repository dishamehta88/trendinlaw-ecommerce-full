// ═══════════════════════════════════════════════════════════════
//  utils/authHelper.js
//  Password hashing, JWT generation, and auth middleware.
// ═══════════════════════════════════════════════════════════════

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const SALT_ROUNDS = 10;

// ── 1. Hash a plain-text password ─────────────────────────────
/**
 * @param {string} password  Plain-text password from registration form
 * @returns {Promise<string>} bcrypt hash
 */
exports.hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

// ── 2. Compare plain-text password against stored hash ────────
/**
 * @param {string} password  Plain-text password from login form
 * @param {string} hash      Stored bcrypt hash from users.json
 * @returns {Promise<boolean>}
 */
exports.comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// ── 3. Generate a signed JWT ──────────────────────────────────
/**
 * Payload contains: { id, email, role }
 * Token expires in 2 hours — adjust as needed.
 *
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} JWT string
 */
exports.generateToken = (user) => {
    const payload = {
        id:    user.id,
        email: user.email,
        role:  user.role,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
};

// ── 4. verifyToken Middleware ──────────────────────────────────
/**
 * Protects routes that require authentication.
 * Reads the token from the Authorization header: "Bearer <token>"
 * On success: attaches decoded user { id, email, role } to req.user
 *
 * Usage in a route file:
 *   router.post('/orders', verifyToken, orderController.createOrder);
 */
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Access denied. No token provided. Please log in.',
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token is malformed.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// ── 5. isAdmin Middleware ─────────────────────────────────────
/**
 * Must be used AFTER verifyToken.
 * Grants access only to users with role === 'admin'.
 *
 * Usage:
 *   router.post('/products', verifyToken, isAdmin, productController.addProduct);
 */
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        message: 'Forbidden: Admin access required.',
    });
};