// ═══════════════════════════════════════════════════════════════
//  routes/cart.js   —   Mounted at: /api/cart   (login required)
//  NOTE: the current frontend keeps its cart in localStorage; these
//  endpoints are available for a server-side cart.
// ═══════════════════════════════════════════════════════════════

const express        = require('express');
const router         = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../utils/authHelper');

router.use(verifyToken);

router.get('/',        cartController.getCart);
router.post('/add',    cartController.addItemToCart);
router.put('/update',  cartController.updateCartItem);
router.delete('/remove', cartController.removeItemFromCart);
router.delete('/clear',  cartController.clearCart);

module.exports = router;
