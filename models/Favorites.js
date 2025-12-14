// models/Favorites.js
const mongoose = require("mongoose");

const favoritesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a unique index to prevent duplicate entries
favoritesSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Favorites", favoritesSchema);
