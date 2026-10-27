// Usage:  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run create-admin
// Creates (or promotes) an admin account in data/users.json.
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/fileHelper');

(async () => {
    const email    = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    if (!email || password.length < 8) {
        console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) environment variables.');
        process.exit(1);
    }
    const users = await readData('users.json');
    const hash  = await bcrypt.hash(password, 10);
    const existing = users.find(u => (u.email || '').toLowerCase() === email);
    if (existing) {
        existing.password = hash;
        existing.role = 'admin';
        console.log(`Updated existing user ${email} -> admin`);
    } else {
        users.push({ id: uuidv4(), firstName: 'Admin', lastName: 'User', email, password: hash, role: 'admin', createdAt: new Date().toISOString() });
        console.log(`Created admin ${email}`);
    }
    await writeData('users.json', users);
})();
