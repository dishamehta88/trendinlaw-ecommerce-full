// ═══════════════════════════════════════════════════════════════
//  controllers/authController.js
// ═══════════════════════════════════════════════════════════════

const { readData, writeData }                       = require('../utils/fileHelper');
const { hashPassword, comparePassword, generateToken } = require('../utils/authHelper');
const { v4: uuidv4 }                                = require('uuid');

const USER_FILE = 'users.json';

// ── POST /api/auth/register ────────────────────────────────────
exports.register = async (req, res) => {
    const { firstName, lastName, password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';

    // Input validation
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof password !== 'string'
        || !firstName.trim() || !lastName.trim() || !email || !password) {
        return res.status(400).json({ message: 'All fields are required: firstName, lastName, email, password.' });
    }
    if (password.length < 6 || password.length > 72) {
        // bcrypt only uses the first 72 bytes of a password
        return res.status(400).json({ message: 'Password must be between 6 and 72 characters long.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    try {
        const users = await readData(USER_FILE);

        // Check for duplicate email
        const existing = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = {
            id:           uuidv4(),
            firstName:    firstName.trim(),
            lastName:     lastName.trim(),
            email:        email.toLowerCase().trim(),
            password:     hashedPassword,
            role:         'customer',           // default role
            createdAt:    new Date().toISOString(),
        };

        users.push(newUser);
        await writeData(USER_FILE, users);

        const token = generateToken(newUser);

        return res.status(201).json({
            message: 'Registration successful! Welcome to Trend In Law.',
            token,
            user: {
                id:        newUser.id,
                firstName: newUser.firstName,
                lastName:  newUser.lastName,
                email:     newUser.email,
                role:      newUser.role,
            },
        });

    } catch (err) {
        console.error('Register Error:', err.message);
        return res.status(500).json({ message: 'Server error during registration. Please try again.' });
    }
};

// ── POST /api/auth/login ───────────────────────────────────────
exports.login = async (req, res) => {
    const email    = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = req.body.password;

    if (!email || typeof password !== 'string' || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const users = await readData(USER_FILE);
        const user  = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());

        // Use a generic message to avoid leaking which accounts exist
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id:        user.id,
                firstName: user.firstName,
                lastName:  user.lastName,
                email:     user.email,
                role:      user.role,
            },
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({ message: 'Server error during login. Please try again.' });
    }
};

// ── POST /api/auth/logout ──────────────────────────────────────
//  JWT is stateless — logout is handled client-side by deleting the token.
//  This endpoint just confirms the action to the client.
exports.logout = (req, res) => {
    return res.status(200).json({
        message: 'Logged out successfully. Please remove the token from your client storage.',
    });
};

// ── GET /api/auth/me ───────────────────────────────────────────
//  Returns the profile of the currently authenticated user.
//  Requires the verifyToken middleware on the route.
exports.getMe = async (req, res) => {
    try {
        const users = await readData(USER_FILE);
        const user  = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({
            id:        user.id,
            firstName: user.firstName,
            lastName:  user.lastName,
            email:     user.email,
            role:      user.role,
            createdAt: user.createdAt,
        });

    } catch (err) {
        console.error('Get Me Error:', err.message);
        return res.status(500).json({ message: 'Server error fetching profile.' });
    }
};