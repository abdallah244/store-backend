const express = require("express");
const Cart = require("../models/Cart");
const router = express.Router();

// Get cart by userId
router.get("/:userId", async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart)
      cart = await Cart.create({ userId: req.params.userId, items: [] });
    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Replace items (upsert)
router.put("/:userId", async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await Cart.findOneAndUpdate(
      { userId: req.params.userId },
      { items, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: "Failed to save cart" });
  }
});

// Add single item
router.post("/:userId/items", async (req, res) => {
  try {
    const item = req.body;
    const cart =
      (await Cart.findOne({ userId: req.params.userId })) ||
      new Cart({ userId: req.params.userId, items: [] });
    const idx = cart.items.findIndex(
      (x) =>
        String(x.productId) === String(item.productId) &&
        x.selectedSize === item.selectedSize &&
        x.selectedColor === item.selectedColor
    );
    if (idx > -1) {
      cart.items[idx] = item;
    } else {
      cart.items.push(item);
    }
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Remove item
router.delete("/:userId/items/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.json({ ok: true });
    cart.items = cart.items.filter(
      (x) => String(x.productId) !== String(productId)
    );
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// Clear cart
router.delete("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.params.userId },
      { items: [], updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

module.exports = router;
