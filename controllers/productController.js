// ═══════════════════════════════════════════════════════════════
//  controllers/productController.js
// ═══════════════════════════════════════════════════════════════

const { readData, writeData } = require('../utils/fileHelper');
const { v4: uuidv4 }          = require('uuid');

const PRODUCT_FILE = 'products.json';

// The frontend expects colors/sizes as comma-separated strings ("Black,White").
const toCsv = (v) => Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean).join(',') : (v ? String(v).trim() : '');

// ── GET /api/products ──────────────────────────────────────────
//  Optional query params:
//    ?category=Apparel    → filter by category (case-insensitive)
//    ?search=jacket       → search by name or description
exports.getAllProducts = async (req, res) => {
    try {
        let products = await readData(PRODUCT_FILE);

        // Filter by category
        if (req.query.category) {
            const cat = req.query.category.toLowerCase();
            products = products.filter(p => (p.category || '').toLowerCase() === cat);
        }

        // Filter by search term
        if (req.query.search) {
            const term = req.query.search.toLowerCase();
            products = products.filter(p =>
                (p.name || '').toLowerCase().includes(term) ||
                (p.description && p.description.toLowerCase().includes(term))
            );
        }

        return res.status(200).json(products);

    } catch (err) {
        console.error('getAllProducts Error:', err.message);
        return res.status(500).json({ message: 'Server error fetching products.' });
    }
};

// ── GET /api/products/:id ──────────────────────────────────────
exports.getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const products = await readData(PRODUCT_FILE);
        const product  = products.find(p => p.id === id);

        if (!product) {
            return res.status(404).json({ message: `Product with ID "${id}" not found.` });
        }

        return res.status(200).json(product);

    } catch (err) {
        console.error(`getProductById Error [${id}]:`, err.message);
        return res.status(500).json({ message: 'Server error fetching product.' });
    }
};

// ── POST /api/products  (Admin only) ──────────────────────────
exports.addProduct = async (req, res) => {
    const { name, price, description, category, image, stock, sizes, colors } = req.body;

    if (!name || price === undefined || !category || stock === undefined) {
        return res.status(400).json({
            message: 'Required fields: name, price, category, stock.',
        });
    }

    try {
        const products = await readData(PRODUCT_FILE);

        const newProduct = {
            id:          uuidv4(),
            name:        String(name).trim(),
            price:       parseFloat(price),
            oldPrice:    req.body.oldPrice ? parseFloat(req.body.oldPrice) : null,
            description: (description || 'No description provided.').trim(),
            category:    String(category).trim(),
            badge:       req.body.badge || '',
            image:       image || 'image/placeholder.jpg',
            stock:       parseInt(stock, 10),
            sizes:       toCsv(sizes),
            colors:      toCsv(colors),
            createdAt:   new Date().toISOString(),
        };
        if (!Number.isFinite(newProduct.price) || newProduct.price < 0 || !Number.isInteger(newProduct.stock) || newProduct.stock < 0) {
            return res.status(400).json({ message: 'price and stock must be non-negative numbers.' });
        }

        products.push(newProduct);
        await writeData(PRODUCT_FILE, products);

        return res.status(201).json({
            message: 'Product added successfully.',
            product: newProduct,
        });

    } catch (err) {
        console.error('addProduct Error:', err.message);
        return res.status(500).json({ message: 'Server error adding product.' });
    }
};

// ── PUT /api/products/:id  (Admin only) ───────────────────────
exports.updateProduct = async (req, res) => {
    const { id }    = req.params;
    const updates   = req.body;

    try {
        const products = await readData(PRODUCT_FILE);
        const index    = products.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ message: `Product with ID "${id}" not found.` });
        }

        const ALLOWED = ['name', 'price', 'oldPrice', 'description', 'category', 'badge', 'image', 'stock', 'sizes', 'colors'];
        const changes = {};
        for (const key of ALLOWED) if (updates[key] !== undefined) changes[key] = updates[key];
        if (changes.price !== undefined) changes.price = parseFloat(changes.price);
        if (changes.oldPrice !== undefined) changes.oldPrice = changes.oldPrice ? parseFloat(changes.oldPrice) : null;
        if (changes.stock !== undefined) changes.stock = parseInt(changes.stock, 10);
        if (changes.sizes !== undefined) changes.sizes = toCsv(changes.sizes);
        if (changes.colors !== undefined) changes.colors = toCsv(changes.colors);
        if (('price' in changes && !Number.isFinite(changes.price)) || ('stock' in changes && !Number.isInteger(changes.stock))) {
            return res.status(400).json({ message: 'price and stock must be valid numbers.' });
        }

        const updatedProduct = {
            ...products[index],
            ...changes,
            id,
            updatedAt: new Date().toISOString(),
        };

        products[index] = updatedProduct;
        await writeData(PRODUCT_FILE, products);

        return res.status(200).json({
            message: 'Product updated successfully.',
            product: updatedProduct,
        });

    } catch (err) {
        console.error(`updateProduct Error [${id}]:`, err.message);
        return res.status(500).json({ message: 'Server error updating product.' });
    }
};

// ── DELETE /api/products/:id  (Admin only) ────────────────────
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const products      = await readData(PRODUCT_FILE);
        const filtered      = products.filter(p => p.id !== id);

        if (filtered.length === products.length) {
            return res.status(404).json({ message: `Product with ID "${id}" not found.` });
        }

        await writeData(PRODUCT_FILE, filtered);

        return res.status(200).json({ message: 'Product deleted successfully.' });

    } catch (err) {
        console.error(`deleteProduct Error [${id}]:`, err.message);
        return res.status(500).json({ message: 'Server error deleting product.' });
    }
};