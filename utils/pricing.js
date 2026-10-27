// Shared shipping rule (must match docs/order.html and docs/api.js)
exports.FREE_SHIPPING_THRESHOLD = 3000;
exports.SHIPPING_FEE = 200;
exports.shippingFor = (subtotal) => (subtotal >= exports.FREE_SHIPPING_THRESHOLD ? 0 : exports.SHIPPING_FEE);
