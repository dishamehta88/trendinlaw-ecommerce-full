// ═══════════════════════════════════════════════════════════════
//  controllers/returnController.js
// ═══════════════════════════════════════════════════════════════

const { readData, writeData } = require('../utils/fileHelper');
const { v4: uuidv4 }          = require('uuid');

const RETURN_FILE = 'returns.json';
const ORDER_FILE  = 'orders.json';

const VALID_TYPES = ['Return', 'Exchange'];

// ── POST /api/returns ──────────────────────────────────────────
//  Body: { orderId, email, productName, reason, type }
exports.submitReturnRequest = async (req, res) => {
    const { orderId, email, productName, reason, type } = req.body;

    // Input validation
    if (!orderId || !email || !productName || !reason || !type) {
        return res.status(400).json({
            message: 'All fields are required: orderId, email, productName, reason, type.',
        });
    }

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
            message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.`,
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    try {
        // The order must exist and the email must match the one on the order.
        const orders = await readData(ORDER_FILE);
        const order  = orders.find(o => o.id === String(orderId).trim());
        const orderEmail = order && order.customerDetails && order.customerDetails.email;
        if (!order || !orderEmail || orderEmail.toLowerCase() !== email.toLowerCase().trim()) {
            return res.status(404).json({ message: 'No order found with that Order ID and email. Please check your details.' });
        }

        const returns = await readData(RETURN_FILE);

        const newRequest = {
            id:          uuidv4(),
            orderId:     orderId.trim(),
            email:       email.toLowerCase().trim(),
            productName: productName.trim(),
            reason:      reason.trim(),
            type,
            date:        new Date().toISOString(),
            status:      'Pending Review',  // can be: Pending Review | Approved | Rejected | Processed
        };

        returns.push(newRequest);
        await writeData(RETURN_FILE, returns);

        return res.status(201).json({
            message:   `Your ${type.toLowerCase()} request has been submitted. We will review it within 2-3 business days.`,
            requestId: newRequest.id,
        });

    } catch (err) {
        console.error('submitReturnRequest Error:', err.message);
        return res.status(500).json({ message: 'Server error submitting your request. Please try again.' });
    }
};

// ── GET /api/returns  (Admin only) ────────────────────────────
//  Returns all return/exchange requests, sorted newest-first.
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await readData(RETURN_FILE);
        requests.sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json(requests);

    } catch (err) {
        console.error('getAllRequests Error:', err.message);
        return res.status(500).json({ message: 'Server error fetching return requests.' });
    }
};