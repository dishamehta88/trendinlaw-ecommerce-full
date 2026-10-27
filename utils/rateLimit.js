// Tiny in-memory rate limiter (no extra dependency).
// For multi-server deployments use a shared store such as Redis instead.
module.exports = ({ windowMs = 15 * 60 * 1000, max = 20, message } = {}) => {
    const hits = new Map();
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }, windowMs).unref();

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.reset <= now) {
            entry = { count: 0, reset: now + windowMs };
            hits.set(key, entry);
        }
        entry.count++;
        if (entry.count > max) {
            res.set('Retry-After', Math.ceil((entry.reset - now) / 1000));
            return res.status(429).json({ message: message || 'Too many requests. Please try again later.' });
        }
        next();
    };
};
