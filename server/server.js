// ═══════════════════════════════════════════════════════════════
//  TREND IN LAW — server.js  (Entry Point)
//  Run from the project root:  npm start   (or: node server/server.js)
//  Routes:  ../routes/   Data:  ../data/   Frontend:  ../docs/
// ═══════════════════════════════════════════════════════════════

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Validate required env vars on startup ──────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET is missing or too short (min 32 chars).');
    console.error('Copy server/.env.example to server/.env and set a strong secret.');
    process.exit(1);
}

// ── Import Routes ──────────────────────────────────────────────
const authRoutes    = require('../routes/auth');
const productRoutes = require('../routes/products');
const orderRoutes   = require('../routes/orders');
const contactRoutes = require('../routes/contact');
const returnRoutes  = require('../routes/returns');
const cartRoutes    = require('../routes/cart');

// ── CORS ───────────────────────────────────────────────────────
//  Set CORS_ORIGINS="https://a.com,https://b.com" in production.
//  Unset = allow any origin (development only).
const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: allowed.length ? allowed : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsers (built into Express) ──────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Never serve server-side files; only the /docs folder is public.
const frontendPath = path.join(__dirname, '..', 'docs');
app.use(express.static(frontendPath));

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/returns',  returnRoutes);
app.use('/api/cart',     cartRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 for unknown API routes (works on Express 4 and 5) ──────
app.use('/api', (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

// ── Fallback: any other GET serves index.html ──────────────────
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global Error Handler (also catches malformed JSON bodies) ──
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON in request body.' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body too large.' });
    }
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ message: 'An internal server error occurred.' });
});

app.listen(PORT, () => {
    console.log(`\nServer running   ->  http://localhost:${PORT}`);
    console.log(`API base URL     ->  http://localhost:${PORT}/api`);
    console.log(`Frontend served  ->  http://localhost:${PORT}\n`);
});
