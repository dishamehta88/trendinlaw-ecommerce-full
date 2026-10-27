// ═══════════════════════════════════════════════════════════════
//  routes/auth.js
//  Mounted at:  /api/auth
// ═══════════════════════════════════════════════════════════════

const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../utils/authHelper');
const rateLimit = require('../utils/rateLimit');

// Slow down brute-force login / mass sign-ups
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many attempts. Please try again in a few minutes.' });

// POST  /api/auth/register  → Create new account
router.post('/register', authLimiter, authController.register);

// POST  /api/auth/login     → Returns JWT token
router.post('/login', authLimiter, authController.login);

// POST  /api/auth/logout    → Client discards token; server confirms
router.post('/logout', authController.logout);

// GET   /api/auth/me        → Get current user profile (protected)
router.get('/me', verifyToken, authController.getMe);

module.exports = router;