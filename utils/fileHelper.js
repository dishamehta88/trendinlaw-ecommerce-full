// ═══════════════════════════════════════════════════════════════
//  utils/fileHelper.js
//  JSON flat-file database helpers. All data files live in /data/
// ═══════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');

// Per-file promise chains so concurrent requests never interleave
// their read-modify-write cycles (prevents lost updates / corrupt files).
const queues = new Map();

/** Reads a JSON data file. Returns [] if the file is missing or empty. */
exports.readData = async (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    let raw;
    try {
        raw = await fs.promises.readFile(filePath, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw new Error(`readData failed for "${filename}": ${err.message}`);
    }
    try {
        const trimmed = raw.trim();
        return trimmed ? JSON.parse(trimmed) : [];
    } catch (parseErr) {
        throw new Error(`JSON parse failed for "${filename}": ${parseErr.message}`);
    }
};

/** Atomically writes an array to a JSON data file (temp file + rename). */
exports.writeData = (filename, data) => {
    const filePath = path.join(DATA_DIR, filename);
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const json     = JSON.stringify(data, null, 2);

    const prev = queues.get(filename) || Promise.resolve();
    const next = prev.catch(() => {}).then(async () => {
        await fs.promises.mkdir(DATA_DIR, { recursive: true });
        await fs.promises.writeFile(tempPath, json, 'utf8');
        await fs.promises.rename(tempPath, filePath);
    });
    queues.set(filename, next);
    return next;
};

/**
 * Runs fn() exclusively for the given set of files, so a read-modify-write
 * spanning several requests can't be interleaved with another one.
 * Usage: await withLock('orders', async () => { read → change → write });
 */
let lockChain = Promise.resolve();
exports.withLock = (fn) => {
    const run = lockChain.catch(() => {}).then(fn);
    lockChain = run;
    return run;
};

exports.ensureDataDir = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
};
