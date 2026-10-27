// ═══════════════════════════════════════════════════════════════
//  controllers/orderController.js
// ═══════════════════════════════════════════════════════════════

const { readData, writeData, withLock } = require('../utils/fileHelper');
const { shippingFor }                    = require('../utils/pricing');
const { v4: uuidv4 }                     = require('uuid');

const ORDER_FILE   = 'orders.json';
const PRODUCT_FILE = 'products.json';
const VALID_PAYMENT_METHODS = ['Paytm', 'GPay', 'PayPal', 'Card', 'COD', 'EasyPaisa', 'JazzCash'];

// ── POST /api/orders ───────────────────────────────────────────
//  Body: { items: [{ productId, quantity, size, color }],
//          customerDetails: { fullName, phone, email },
//          shippingAddress, paymentMethod }
//  Prices and the total are calculated on the server.
exports.createOrder = async (req, res) => {
    const userId = req.user.id; // set by verifyToken middleware
    const { items, paymentMethod } = req.body;
    const customerDetails = req.body.customerDetails
        ? { ...req.body.customerDetails, fullName: req.body.customerDetails.fullName || req.body.customerDetails.name }
        : null;
    // Accept the address as a string, or as { fullAddress, city, province, notes }
    const addr = req.body.shippingAddress;
    const shippingAddress = (addr && typeof addr === 'object')
        ? [addr.fullAddress, addr.city, addr.province].filter(Boolean).join(', ') + (addr.notes ? ` (Note: ${addr.notes})` : '')
        : addr;

    // ── Input validation ─────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
        return res.status(400).json({ message: 'Order must contain between 1 and 50 items.' });
    }
    if (!customerDetails || !customerDetails.fullName || !customerDetails.phone || !customerDetails.email) {
        return res.status(400).json({ message: 'Customer details (fullName, phone, email) are required.' });
    }
    if (typeof shippingAddress !== 'string' || !shippingAddress.trim()) {
        return res.status(400).json({ message: 'Shipping address is required.' });
    }
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({ message: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}.` });
    }
    for (const item of items) {
        const q = Number(item.quantity);
        if (!item.productId || !Number.isInteger(q) || q < 1 || q > 100) {
            return res.status(400).json({ message: 'Each item needs a productId and a whole-number quantity between 1 and 100.' });
        }
    }

    try {
        // Lock so two simultaneous orders can't both pass the stock check.
        const result = await withLock(async () => {
            const orders   = await readData(ORDER_FILE);
            const products = await readData(PRODUCT_FILE);

            // Total requested quantity per product (same product may appear on several lines)
            const requested = {};
            for (const item of items) {
                requested[item.productId] = (requested[item.productId] || 0) + Number(item.quantity);
            }

            for (const [productId, qty] of Object.entries(requested)) {
                const product = products.find(p => p.id === productId);
                if (!product) {
                    return { status: 404, body: { message: `Product (ID: ${productId}) no longer exists.` } };
                }
                if (product.stock < qty) {
                    return { status: 400, body: { message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${qty}.` } };
                }
            }

            // Prices, names and images come from OUR catalogue - never from the client.
            const orderItems = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    productId: product.id,
                    name:      product.name,
                    price:     product.price,
                    quantity:  Number(item.quantity),
                    size:      item.size  || 'N/A',
                    color:     item.color || 'N/A',
                    image:     product.image || '',
                };
            });
            const subtotal    = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const shippingFee = shippingFor(subtotal);
            const now         = new Date().toISOString();

            const newOrder = {
                id:              uuidv4(),
                userId,
                customerDetails: {
                    fullName: String(customerDetails.fullName).trim(),
                    phone:    String(customerDetails.phone).trim(),
                    email:    String(customerDetails.email).trim().toLowerCase(),
                },
                items:           orderItems,
                subtotal,
                shippingFee,
                totalAmount:     subtotal + shippingFee,
                shippingAddress: shippingAddress.trim(),
                paymentMethod,
                status:          'Pending',
                createdAt:       now,
                updatedAt:       now,
            };

            const updatedProducts = products.map(p =>
                requested[p.id] ? { ...p, stock: p.stock - requested[p.id] } : p
            );

            orders.push(newOrder);
            await writeData(ORDER_FILE, orders);
            await writeData(PRODUCT_FILE, updatedProducts);

            return { status: 201, body: {
                message:     'Order placed successfully! Thank you for shopping with Trend In Law.',
                orderId:     newOrder.id,
                status:      newOrder.status,
                totalAmount: newOrder.totalAmount,
            } };
        });

        return res.status(result.status).json(result.body);

    } catch (err) {
        console.error('createOrder Error:', err.message);
        return res.status(500).json({ message: 'Server error placing your order. Please try again.' });
    }
};

// ── GET /api/orders ────────────────────────────────────────────
//  Returns all orders belonging to the authenticated user.
exports.getOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const orders     = await readData(ORDER_FILE);
        const userOrders = orders
            .filter(o => o.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json(userOrders);

    } catch (err) {
        console.error('getOrders Error:', err.message);
        return res.status(500).json({ message: 'Server error fetching your orders.' });
    }
};

// ── GET /api/orders/track/:orderId ─────────────────────────────
//  Public endpoint — anyone with an order ID can track it.
//  Used by docs/track.html
exports.trackOrder = async (req, res) => {
    const { orderId } = req.params;

    if (!orderId || orderId.trim() === '') {
        return res.status(400).json({ message: 'Order ID is required.' });
    }

    try {
        const orders = await readData(ORDER_FILE);
        const order  = orders.find(o => o.id === orderId.trim());

        if (!order) {
            return res.status(404).json({
                message: `No order found with ID "${orderId}". Please check and try again.`,
            });
        }

        // Return safe tracking info (no user ID or other sensitive fields)
        return res.status(200).json({
            orderId:         order.id,
            status:          order.status,
            items:           order.items,
            totalAmount:     order.totalAmount,
            shippingAddress: order.shippingAddress,
            paymentMethod:   order.paymentMethod,
            createdAt:       order.createdAt,
            updatedAt:       order.updatedAt,
            customerName:    order.customerDetails?.fullName,
        });

    } catch (err) {
        console.error('trackOrder Error:', err.message);
        return res.status(500).json({ message: 'Server error tracking order.' });
    }
};