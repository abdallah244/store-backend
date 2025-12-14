// routes/admin.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const PageContent = require("../models/PageContent");
const HomeContent = require("../models/HomeContent");
const AboutContent = require("../models/AboutContent");
const Product = require("../models/Product");
const DeliveryFee = require("../models/DeliveryFee");

const router = express.Router();

// ============ FILE UPLOAD SETUP ============

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "image-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter,
});

// ============ IMAGE UPLOAD ROUTE ============

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Generate the public URL for the image
    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ============ PAGE CONTENT ROUTES ============

// Get page content
router.get("/page-content", async (req, res) => {
  try {
    let pageContent = await PageContent.findOne();

    // Create default if doesn't exist
    if (!pageContent) {
      pageContent = new PageContent();
      await pageContent.save();
    }

    res.json(pageContent);
  } catch (error) {
    console.error("Error fetching page content:", error);
    res.status(500).json({ error: "Failed to fetch page content" });
  }
});

// Update entire page content
router.put("/page-content", async (req, res) => {
  try {
    const updateData = req.body;

    let pageContent = await PageContent.findOne();

    if (!pageContent) {
      pageContent = new PageContent(updateData);
    } else {
      // Deep merge for nested objects
      Object.keys(updateData).forEach((key) => {
        if (
          typeof updateData[key] === "object" &&
          !Array.isArray(updateData[key])
        ) {
          pageContent[key] = { ...pageContent[key], ...updateData[key] };
        } else {
          pageContent[key] = updateData[key];
        }
      });
    }

    pageContent.updatedAt = new Date();
    await pageContent.save();

    res.json({ message: "Page content updated successfully", pageContent });
  } catch (error) {
    console.error("Error updating page content:", error);
    res.status(500).json({ error: "Failed to update page content" });
  }
});

// Update specific section (hero, features, reviews, etc.)
router.put("/page-content/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;

    let pageContent = await PageContent.findOne();

    if (!pageContent) {
      pageContent = new PageContent();
    }

    // Validate section exists
    if (!(section in pageContent.toObject())) {
      return res.status(400).json({ error: `Invalid section: ${section}` });
    }

    // Update specific section
    if (Array.isArray(pageContent[section])) {
      pageContent[section] = updateData;
    } else if (typeof pageContent[section] === "object") {
      pageContent[section] = { ...pageContent[section], ...updateData };
    } else {
      pageContent[section] = updateData;
    }

    pageContent.updatedAt = new Date();
    await pageContent.save();

    res.json({
      message: `${section} updated successfully`,
      [section]: pageContent[section],
    });
  } catch (error) {
    console.error("Error updating page section:", error);
    res.status(500).json({ error: "Failed to update page section" });
  }
});

// Add item to array sections (features, reviews, promotions)
router.post("/page-content/:section/add", async (req, res) => {
  try {
    const { section } = req.params;
    const newItem = req.body;

    let pageContent = await PageContent.findOne();

    if (!pageContent) {
      pageContent = new PageContent();
    }

    if (!Array.isArray(pageContent[section])) {
      return res.status(400).json({ error: `${section} is not an array` });
    }

    pageContent[section].push(newItem);
    pageContent.updatedAt = new Date();
    await pageContent.save();

    res.json({
      message: `Item added to ${section}`,
      [section]: pageContent[section],
    });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Remove item from array sections
router.delete("/page-content/:section/:index", async (req, res) => {
  try {
    const { section, index } = req.params;

    let pageContent = await PageContent.findOne();

    if (!pageContent) {
      return res.status(404).json({ error: "Page content not found" });
    }

    if (!Array.isArray(pageContent[section])) {
      return res.status(400).json({ error: `${section} is not an array` });
    }

    if (index < 0 || index >= pageContent[section].length) {
      return res.status(400).json({ error: "Invalid index" });
    }

    pageContent[section].splice(index, 1);
    pageContent.updatedAt = new Date();
    await pageContent.save();

    res.json({
      message: `Item removed from ${section}`,
      [section]: pageContent[section],
    });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// ============ HOME CONTENT ROUTES ============

// Get home content
router.get("/home-content", async (req, res) => {
  try {
    let homeContent = await HomeContent.findOne();

    // Create default if doesn't exist
    if (!homeContent) {
      homeContent = new HomeContent({
        features: [
          {
            icon: "fas fa-hand-holding-heart",
            title: "Handcrafted Excellence",
            description:
              "Each piece is carefully crafted by skilled artisans with years of experience.",
          },
          {
            icon: "fas fa-leaf",
            title: "Sustainable Materials",
            description:
              "We use eco-friendly fabrics that are kind to the environment and your skin.",
          },
          {
            icon: "fas fa-shipping-fast",
            title: "Fast Delivery",
            description:
              "Get your orders delivered quickly and safely to your doorstep.",
          },
          {
            icon: "fas fa-headset",
            title: "24/7 Support",
            description:
              "Our dedicated team is always ready to help you with any questions.",
          },
        ],
      });
      await homeContent.save();
    }

    res.json(homeContent);
  } catch (error) {
    console.error("Error fetching home content:", error);
    res.status(500).json({ error: "Failed to fetch home content" });
  }
});

// Update home content
router.put("/home-content", async (req, res) => {
  try {
    const updateData = req.body;

    let homeContent = await HomeContent.findOne();

    if (!homeContent) {
      homeContent = new HomeContent(updateData);
    } else {
      Object.assign(homeContent, updateData);
    }

    await homeContent.save();
    res.json(homeContent);
  } catch (error) {
    console.error("Error updating home content:", error);
    res.status(500).json({ error: "Failed to update home content" });
  }
});

// Upload hero image
router.post(
  "/home-content/hero-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      let homeContent = await HomeContent.findOne();
      if (!homeContent) {
        homeContent = new HomeContent();
      }

      // Delete old hero image if exists
      if (
        homeContent.heroBackgroundUrl &&
        homeContent.heroBackgroundUrl.startsWith("/uploads/")
      ) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          homeContent.heroBackgroundUrl
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      homeContent.heroBackgroundUrl = imageUrl;
      await homeContent.save();

      res.json({
        success: true,
        url: imageUrl,
        homeContent: homeContent,
      });
    } catch (error) {
      console.error("Error uploading hero image:", error);
      res.status(500).json({ error: "Failed to upload hero image" });
    }
  }
);

// Upload advertisement image
router.post(
  "/home-content/ad-image",
  upload.single("adImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      res.json({
        success: true,
        url: imageUrl,
      });
    } catch (error) {
      console.error("Error uploading ad image:", error);
      res.status(500).json({ error: "Failed to upload ad image" });
    }
  }
);

// ============ USER MANAGEMENT ROUTES ============

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Ban user
router.put("/users/:userId/ban", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { banned: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

// Unban user
router.put("/users/:userId/unban", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { banned: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ error: "Failed to unban user" });
  }
});

// Promote to admin
router.put("/users/:userId/promote", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
});

// Demote from admin
router.put("/users/:userId/demote", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: "user" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error demoting user:", error);
    res.status(500).json({ error: "Failed to demote user" });
  }
});

// ============ ABOUT PAGE MANAGEMENT ============

// Get about content
router.get("/about-content", async (req, res) => {
  try {
    let aboutContent = await AboutContent.findOne();

    if (!aboutContent) {
      // Create default about content if it doesn't exist
      aboutContent = new AboutContent({
        heroImage: "/assets/about/hero.jpg",
        brandStory:
          "Our journey began with a deep love for craftsmanship and local artisans.",
        brandImage: "/assets/about/brand-story.jpg",
        ceoStory:
          "I started young, learning patience and quality from family artisans.",
        ceoImage: "/assets/team/ceo.jpg",
        stats: [
          { label: "Artisans", value: "25+", icon: "fas fa-users" },
          { label: "Products Crafted", value: "500+", icon: "fas fa-box" },
          { label: "Happy Clients", value: "1000+", icon: "fas fa-smile" },
          {
            label: "Years of Craft",
            value: "15",
            icon: "fas fa-hourglass-end",
          },
        ],
        teamMembers: [
          {
            id: "1",
            name: "Ahmed Mohamed",
            position: "Founder & CEO",
            image: "/assets/team/member1.jpg",
            bio: "Leader with decades of experience in artisan craftsmanship.",
          },
        ],
      });
      await aboutContent.save();
    }

    res.json(aboutContent);
  } catch (error) {
    console.error("Error getting about content:", error);
    res.status(500).json({ error: "Failed to get about content" });
  }
});

// Update about content
router.put("/about-content", async (req, res) => {
  try {
    const {
      heroImage,
      brandStory,
      brandImage,
      ceoStory,
      ceoImage,
      stats,
      teamMembers,
    } = req.body;

    let aboutContent = await AboutContent.findOne();

    if (!aboutContent) {
      aboutContent = new AboutContent({
        heroImage,
        brandStory,
        brandImage,
        ceoStory,
        ceoImage,
        stats,
        teamMembers,
      });
    } else {
      aboutContent.heroImage = heroImage;
      aboutContent.brandStory = brandStory;
      aboutContent.brandImage = brandImage;
      aboutContent.ceoStory = ceoStory;
      aboutContent.ceoImage = ceoImage;
      aboutContent.stats = stats;
      aboutContent.teamMembers = teamMembers;
      aboutContent.updatedAt = Date.now();
    }

    await aboutContent.save();
    res.json(aboutContent);
  } catch (error) {
    console.error("Error updating about content:", error);
    res.status(500).json({ error: "Failed to update about content" });
  }
});

// Upload about image
router.post(
  "/about-content/image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

      res.json({
        success: true,
        url: imageUrl,
      });
    } catch (error) {
      console.error("Error uploading about image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// ============ PRODUCT MANAGEMENT ============

// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product
router.post("/products", async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      images,
      stock,
      discount,
      isOnSale,
      category,
      gender,
      colors,
      sizes,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      image,
      images: images || [],
      stock,
      discount: discount || 0,
      isOnSale: isOnSale || false,
      category: category || "Apparel",
      gender: gender || "unisex",
      colors: colors || [],
      sizes: sizes || [],
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(500)
      .json({ error: "Failed to create product", details: error.message });
  }
});

// Update product
router.put("/products/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      images,
      stock,
      discount,
      isOnSale,
      category,
      gender,
      colors,
      sizes,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        image,
        images: images || [],
        stock,
        discount: discount || 0,
        isOnSale: isOnSale || false,
        category: category || "Apparel",
        gender: gender || "unisex",
        colors: colors || [],
        sizes: sizes || [],
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ error: "Failed to update product", details: error.message });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Upload product image
router.post("/products/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error uploading product image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ============ FAVORITES ENDPOINTS ============

// Get user's favorites
router.get("/favorites/:userId", async (req, res) => {
  try {
    const Favorites = require("../models/Favorites");
    const favorites = await Favorites.find({ userId: req.params.userId })
      .populate("productId")
      .sort({ addedAt: -1 });

    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Add to favorites
router.post("/favorites", async (req, res) => {
  try {
    const Favorites = require("../models/Favorites");
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    // Check if already favorited
    const existing = await Favorites.findOne({ userId, productId });
    if (existing) {
      return res.status(400).json({ error: "Already in favorites" });
    }

    const favorite = new Favorites({ userId, productId });
    await favorite.save();
    await favorite.populate("productId");

    res.status(201).json(favorite);
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// Remove from favorites
router.delete("/favorites/:userId/:productId", async (req, res) => {
  try {
    const Favorites = require("../models/Favorites");
    const { userId, productId } = req.params;

    await Favorites.findOneAndDelete({ userId, productId });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// Toggle favorite
router.post("/favorites/toggle", async (req, res) => {
  try {
    const Favorites = require("../models/Favorites");
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    const existing = await Favorites.findOne({ userId, productId });

    if (existing) {
      await Favorites.findByIdAndDelete(existing._id);
      res.json({ message: "Removed from favorites", isFavorite: false });
    } else {
      const favorite = new Favorites({ userId, productId });
      await favorite.save();
      await favorite.populate("productId");
      res
        .status(201)
        .json({ message: "Added to favorites", isFavorite: true, favorite });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
});

// ============ DELIVERY FEE MANAGEMENT ============

// Get delivery fee
router.get("/delivery-fee", async (req, res) => {
  try {
    let deliveryFee = await DeliveryFee.findOne();

    if (!deliveryFee) {
      // Create default delivery fee if not exists
      deliveryFee = new DeliveryFee({ amount: 50, currency: "EGP" });
      await deliveryFee.save();
    }

    res.json({ amount: deliveryFee.amount });
  } catch (error) {
    console.error("Error fetching delivery fee:", error);
    res.status(500).json({ error: "Failed to fetch delivery fee" });
  }
});

// Update delivery fee (admin only)
router.put("/delivery-fee", async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ error: "Invalid delivery fee amount" });
    }

    let deliveryFee = await DeliveryFee.findOne();

    if (!deliveryFee) {
      deliveryFee = new DeliveryFee({ amount, currency: "EGP" });
    } else {
      deliveryFee.amount = amount;
    }

    await deliveryFee.save();
    res.json({ amount: deliveryFee.amount });
  } catch (error) {
    console.error("Error updating delivery fee:", error);
    res.status(500).json({ error: "Failed to update delivery fee" });
  }
});

module.exports = router;
