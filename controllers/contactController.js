// ═══════════════════════════════════════════════════════════════
//  controllers/contactController.js
// ═══════════════════════════════════════════════════════════════

const { readData, writeData } = require('../utils/fileHelper');
const { v4: uuidv4 }          = require('uuid');

const MESSAGE_FILE = 'messages.json';

// ── POST /api/contact ──────────────────────────────────────────
//  Saves a contact-form submission to messages.json
exports.submitMessage = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Input validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            message: 'All fields are required: name, email, subject, message.',
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (message.trim().length < 10) {
        return res.status(400).json({ message: 'Message must be at least 10 characters long.' });
    }

    try {
        const messages = await readData(MESSAGE_FILE);

        const newMessage = {
            id:      uuidv4(),
            name:    name.trim(),
            email:   email.toLowerCase().trim(),
            subject: subject.trim(),
            message: message.trim(),
            date:    new Date().toISOString(),
            status:  'New',  // can be: New | Read | Replied
        };

        messages.push(newMessage);
        await writeData(MESSAGE_FILE, messages);

        return res.status(201).json({
            message: 'Your message has been received! We typically respond within 24 hours.',
        });

    } catch (err) {
        console.error('submitMessage Error:', err.message);
        return res.status(500).json({ message: 'Server error submitting your message. Please try again.' });
    }
};

// ── GET /api/contact  (Admin only) ────────────────────────────
//  Returns all contact messages, sorted newest-first.
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await readData(MESSAGE_FILE);
        messages.sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json(messages);

    } catch (err) {
        console.error('getAllMessages Error:', err.message);
        return res.status(500).json({ message: 'Server error fetching messages.' });
    }
};