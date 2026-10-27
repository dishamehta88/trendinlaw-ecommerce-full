// ═══════════════════════════════════════════════════════════════
//  routes/contact.js
//  Mounted at:  /api/contact
// ═══════════════════════════════════════════════════════════════

const express           = require('express');
const router            = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, isAdmin } = require('../utils/authHelper');
const rateLimit = require('../utils/rateLimit');
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// POST /api/contact       → Submit a contact form message (public)
router.post('/', publicLimiter, contactController.submitMessage);

// GET  /api/contact       → Fetch all messages (admin only)
router.get('/', verifyToken, isAdmin, contactController.getAllMessages);

module.exports = router;