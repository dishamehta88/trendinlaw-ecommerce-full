// ═══════════════════════════════════════════════════════════════
//  routes/orders.js
//  Mounted at:  /api/orders
// ═══════════════════════════════════════════════════════════════

const express         = require('express');
const router          = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../utils/authHelper');

// ── Public Route ───────────────────────────────────────────────
// GET  /api/orders/track/:orderId
// Used by track.html — anyone with an order ID can check their status.
router.get('/track/:orderId', orderController.trackOrder);

// ── Protected Routes (Login required) ─────────────────────────
// POST /api/orders        → Place a new order (reads cart from request body)
router.post('/', verifyToken, orderController.createOrder);

// GET  /api/orders        → Get all orders for the logged-in user
router.get('/', verifyToken, orderController.getOrders);

module.exports = router;