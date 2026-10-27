// ═══════════════════════════════════════════════════════════════
//  routes/products.js
//  Mounted at:  /api/products
// ═══════════════════════════════════════════════════════════════

const express           = require('express');
const router            = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../utils/authHelper');

// ── Public Routes (no login required) ─────────────────────────
// GET  /api/products          → Fetch all products (with optional ?category= filter)
router.get('/', productController.getAllProducts);

// GET  /api/products/:id      → Fetch a single product by ID
router.get('/:id', productController.getProductById);

// ── Admin-only Routes (JWT + admin role required) ──────────────
// POST   /api/products         → Add a new product
router.post('/', verifyToken, isAdmin, productController.addProduct);

// PUT    /api/products/:id     → Update an existing product
router.put('/:id', verifyToken, isAdmin, productController.updateProduct);

// DELETE /api/products/:id     → Delete a product
router.delete('/:id', verifyToken, isAdmin, productController.deleteProduct);

module.exports = router;