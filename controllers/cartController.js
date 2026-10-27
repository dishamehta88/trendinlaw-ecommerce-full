const { readData, writeData } = require('../utils/fileHelper');

const CART_FILE = 'carts.json';
const PRODUCT_FILE = 'products.json';

// Utility function to get a specific user's cart
const getUserCart = (carts, userId) => {
    let userCart = carts.find(c => c.userId === userId);
    if (!userCart) {
        userCart = { userId, items: [] };
        carts.push(userCart);
    }
    return userCart;
};

// POST /api/cart/add - Add item to cart
exports.addItemToCart = async (req, res) => {
    const userId = req.user.id; // From verifyToken middleware
    const { productId, quantity = 1, size, color } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: 'productId and a positive whole-number quantity are required.' });
    }

    try {
        const products = await readData(PRODUCT_FILE);
        const product  = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const carts = await readData(CART_FILE);
        const userCart = getUserCart(carts, userId);

        const newItem = {
            productId,
            name: product.name,
            price: product.price,
            quantity: qty,
            size: size || 'N/A',
            color: color || 'N/A'
        };

        // Check if item already exists in cart (based on ID, size, and color)
        const existingItemIndex = userCart.items.findIndex(item => 
            item.productId === newItem.productId && item.size === newItem.size && item.color === newItem.color
        );

        if (existingItemIndex > -1) {
            // Item exists, update quantity
            userCart.items[existingItemIndex].quantity += newItem.quantity;
        } else {
            // New item, add to cart
            userCart.items.push(newItem);
        }

        await writeData(CART_FILE, carts);

        res.status(200).json({ message: 'Item added to cart successfully.', cart: userCart.items });
    } catch (error) {
        console.error('Add Item to Cart Error:', error);
        res.status(500).json({ message: 'Server error adding item to cart.' });
    }
};

// GET /api/cart - Get user's cart
exports.getCart = async (req, res) => {
    const userId = req.user.id;

    try {
        const carts = await readData(CART_FILE);
        const userCart = getUserCart(carts, userId);

        res.status(200).json(userCart.items);
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ message: 'Server error fetching cart.' });
    }
};

// PUT /api/cart/update - Update quantity of an item in the cart
exports.updateCartItem = async (req, res) => {
    const userId = req.user.id;
    const { productId, size, color, quantity } = req.body;

    if (!productId || !size || !color || quantity === undefined || isNaN(parseInt(quantity, 10))) {
        return res.status(400).json({ message: 'Missing required fields for update (productId, size, color, quantity).' });
    }

    try {
        const carts = await readData(CART_FILE);
        const userCart = getUserCart(carts, userId);
        const newQuantity = parseInt(quantity, 10);

        const itemIndex = userCart.items.findIndex(item => 
            item.productId === productId && item.size === size && item.color === color
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart.' });
        }
        
        if (newQuantity <= 0) {
            // If quantity is 0 or less, remove the item
            userCart.items.splice(itemIndex, 1);
            await writeData(CART_FILE, carts);
            return res.status(200).json({ message: 'Item removed from cart.', cart: userCart.items });
        } else {
            // Update quantity
            userCart.items[itemIndex].quantity = newQuantity;
            await writeData(CART_FILE, carts);
            return res.status(200).json({ message: 'Cart updated successfully.', cart: userCart.items });
        }
    } catch (error) {
        console.error('Update Cart Item Error:', error);
        res.status(500).json({ message: 'Server error updating cart item.' });
    }
};

// DELETE /api/cart/remove - Remove a specific item from cart
exports.removeItemFromCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, size, color } = req.body; // Using body for specific item removal criteria

    if (!productId || !size || !color) {
        return res.status(400).json({ message: 'Missing required fields for removal (productId, size, color).' });
    }

    try {
        const carts = await readData(CART_FILE);
        const userCart = getUserCart(carts, userId);
        
        const initialLength = userCart.items.length;
        
        // Filter out the item to be removed
        userCart.items = userCart.items.filter(item => 
            !(item.productId === productId && item.size === size && item.color === color)
        );

        if (userCart.items.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in cart.' });
        }

        await writeData(CART_FILE, carts);

        res.status(200).json({ message: 'Item removed from cart successfully.', cart: userCart.items });
    } catch (error) {
        console.error('Remove Item from Cart Error:', error);
        res.status(500).json({ message: 'Server error removing item from cart.' });
    }
};

// DELETE /api/cart/clear - Clear the entire cart
exports.clearCart = async (req, res) => {
    const userId = req.user.id;

    try {
        const carts = await readData(CART_FILE);
        const userCart = getUserCart(carts, userId);

        // Set items to an empty array
        userCart.items = [];

        await writeData(CART_FILE, carts);

        res.status(200).json({ message: 'Cart cleared successfully.', cart: userCart.items });
    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({ message: 'Server error clearing cart.' });
    }
};
