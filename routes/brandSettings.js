const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const BrandSettings = require("../models/BrandSettings");
require("dotenv").config();

const router = express.Router();

// Ensure uploads/brand directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "brand");
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = "logo_" + Date.now();
    cb(null, base + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Allowed: PNG, JPG, WEBP, SVG"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});

// Get brand settings
router.get("/settings", async (req, res) => {
  try {
    let doc = await BrandSettings.findOne();
    if (!doc) {
      doc = await BrandSettings.create({});
    }
    res.json(doc);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to load brand settings", details: err.message });
  }
});

// Update brand settings (name/tagline)
// Simple admin protection using ADMIN_SECRET header
// In development, allow missing/incorrect secret to avoid blocking UI flows
const requireAdmin = (req, res, next) => {
  const provided = req.headers["x-admin-secret"];
  const secret = process.env.ADMIN_SECRET;

  // If no secret configured, allow but log
  if (!secret) {
    console.warn(
      "ADMIN_SECRET not set; allowing brand settings update without auth"
    );
    return next();
  }

  // If secret exists but we are in development, allow even if header missing
  if (process.env.NODE_ENV === "development" && !provided) {
    console.warn(
      "ADMIN_SECRET set but not provided; bypassing in development mode"
    );
    return next();
  }

  if (provided !== secret) {
    return res
      .status(401)
      .json({ error: "Unauthorized: invalid admin secret" });
  }
  next();
};

router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const { name, tagline } = req.body;
    let doc = await BrandSettings.findOne();
    if (!doc) doc = await BrandSettings.create({});
    if (typeof name === "string") doc.name = name.trim();
    if (typeof tagline === "string") doc.tagline = tagline.trim();
    doc.updatedBy = req.headers["x-admin-email"] || "admin";
    await doc.save();
    res.json(doc);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update brand settings", details: err.message });
  }
});

// Upload brand logo
router.post(
  "/settings/logo",
  requireAdmin,
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Logo file is required" });
      }
      const relativePath = "/uploads/brand/" + req.file.filename;
      let doc = await BrandSettings.findOne();
      if (!doc) doc = await BrandSettings.create({});
      doc.logoUrl = relativePath;
      doc.updatedBy = req.headers["x-admin-email"] || "admin";
      await doc.save();
      res.json({ logoUrl: relativePath });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to upload logo", details: err.message });
    }
  }
);

module.exports = router;
