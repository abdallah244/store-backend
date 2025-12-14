const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const bcrypt = require("bcrypt");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const feedbackRoutes = require("./routes/feedback");
const contactRoutes = require("./routes/contact");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const brandSettingsRoutes = require("./routes/brandSettings");
const User = require("./models/User");
const MasterCode = require("./models/MasterCode");
const isAdmin = require("./middleware/isAdmin");

const app = express();

// Middleware for performance
app.use(compression()); // Gzip compression
app.use(
  cors({
    origin: (origin, cb) => cb(null, true), // allow all origins in dev
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded images with caching
app.use(
  "/uploads",
  (req, res, next) => {
    // Disable aggressive caching for uploaded assets so profile/logo updates reflect immediately
    // You can adjust to a small value if needed, e.g., max-age=10 with must-revalidate
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// MongoDB Connection with timeout
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/store", {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  })
  .then(async () => {
    console.log("✓ MongoDB connected");

    // Create or ensure default admin exists without duplicate errors
    try {
      const hashedPassword = await bcrypt.hash("andallah2008", 10);

      await User.findOneAndUpdate(
        { email: "dada@gmail.com" },
        {
          $setOnInsert: {
            name: "Admin",
            email: "dada@gmail.com",
            phone: "01000000000",
            password: hashedPassword,
          },
          $set: {
            role: "admin",
            banned: false,
          },
        },
        { upsert: true, new: true }
      );

      console.log("✓ Default admin ensured (email: dada@gmail.com)");
    } catch (error) {
      console.error("✗ Error ensuring default admin:", error.message);
    }
  })
  .catch((err) => console.error("✗ MongoDB connection error:", err.message));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", isAdmin, adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/brand", brandSettingsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Diagnostics endpoint
app.get("/api/diagnostics", async (req, res) => {
  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.json({
    mongo:
      ["disconnected", "connected", "connecting", "disconnecting"][state] ||
      state,
    dbName: mongoose.connection?.name,
    host: mongoose.connection?.host,
    port: mongoose.connection?.port,
    uptimeSec: process.uptime(),
    now: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3000;
// Serve Angular dist if available (for deployment)
try {
  const distPath = path.join(__dirname, "../frontend/dist/frontend");
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} catch (e) {
  // ignore if dist not present in dev
}

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});
