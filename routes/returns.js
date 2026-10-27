// ═══════════════════════════════════════════════════════════════
//  routes/returns.js
//  Mounted at:  /api/returns
// ═══════════════════════════════════════════════════════════════

const express          = require('express');
const router           = express.Router();
const returnController = require('../controllers/returnController');
const { verifyToken, isAdmin } = require('../utils/authHelper');
const rateLimit = require('../utils/rateLimit');
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// POST /api/returns       → Submit a return/exchange request (public)
router.post('/', publicLimiter, returnController.submitReturnRequest);

// GET  /api/returns       → Fetch all return requests (admin only)
router.get('/', verifyToken, isAdmin, returnController.getAllRequests);

module.exports = router;