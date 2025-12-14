const mongoose = require("mongoose");

const BrandSettingsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "LOCAL CRAFT" },
    tagline: { type: String, default: "Premium Selection" },
    logoUrl: { type: String, default: "" }, // served from /uploads/brand
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandSettings", BrandSettingsSchema);
