const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const User = require("../models/User");
const MasterCode = require("../models/MasterCode");
const { sendMasterCodeEmail } = require("../services/emailService");

// Configure multer for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Helper function to generate random master code
const generateMasterCode = () => {
  return Math.random().toString().slice(2, 8); // 6-digit code
};

// Helper function to generate temp token
const generateTempToken = () => {
  return require("crypto").randomBytes(32).toString("hex");
};

// Register
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Egyptian phone validation
    if (!/^(010|011|012|015)\d{8}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid Egyptian phone number" });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get profile image URL if uploaded
    const profileImageUrl = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    // Create user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      profileImage: profileImageUrl,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id,
      name: newUser.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if banned
    if (user.banned) {
      return res
        .status(403)
        .json({ error: "Sorry, your account has been banned." });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if account is completed
    const accountCompleted = !!(
      user.address &&
      user.address.country &&
      user.address.governorate &&
      user.address.country.trim() !== "" &&
      user.address.governorate.trim() !== ""
    );

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      name: user.name,
      email: user.email,
      accountCompleted: accountCompleted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Profile
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find user and exclude password
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User profile retrieved successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Profile
router.put("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, address, country, governorate } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Validate required fields
    if (!name || !address || !country || !governorate) {
      return res.status(400).json({
        error: "Name, address, country, and governorate are required",
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        address,
        country,
        governorate,
        accountCompleted: true,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User profile updated successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Profile Image
router.post(
  "/user/:userId/upload-image",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete old image if exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, "..", user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update user with new image URL
      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
      user.profileImage = profileImageUrl;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile image uploaded successfully",
        url: profileImageUrl,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get All Users (Admin only)
router.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users retrieved successfully",
      users: users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Admins (Admin only)
router.get("/admin/admins", async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Admins retrieved successfully",
      admins: admins,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ban User (Admin only)
router.put("/admin/users/:userId/ban", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { banned: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User banned successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unban User (Admin only)
router.put("/admin/users/:userId/unban", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { banned: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User unbanned successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Promote User to Admin (Admin only)
router.put("/admin/users/:userId/promote", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User promoted to admin successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demote Admin to User (Admin only)
router.put("/admin/users/:userId/demote", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "user" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Admin demoted to user successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User Account (Admin only)
router.delete("/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete profile image if exists
    if (user.profileImage) {
      const imagePath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN AUTHENTICATION ============

// Admin Register (Create new admin account)
router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    // Validate admin secret (should be set in environment)
    const ADMIN_SECRET =
      process.env.ADMIN_SECRET || "admin_secret_key_change_this";
    if (adminSecret !== ADMIN_SECRET) {
      return res.status(403).json({ error: "Invalid admin secret key" });
    }

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const newAdmin = new User({
      name,
      email: email.toLowerCase(),
      phone: "01000000000", // Placeholder for admin
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin created successfully",
      userId: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: "admin",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find admin user
    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Check if admin is banned
    if (admin.banned) {
      return res.status(403).json({ error: "This admin account is banned" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    res.status(200).json({
      message: "Admin login successful",
      adminId: admin._id,
      name: admin.name,
      email: admin.email,
      role: "admin",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN MASTER CODE VERIFICATION ============

// Step 1: Generate and send master code
router.post("/admin/request-master-code", async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: "Admin ID is required" });
    }

    // Find admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ error: "Invalid admin" });
    }

    // Generate new master code
    const masterCode = generateMasterCode();
    const tempToken = generateTempToken();

    // Save master code to database
    const codeRecord = new MasterCode({
      adminId: admin._id,
      code: masterCode,
      tempToken: tempToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await codeRecord.save();

    // Send email to admin
    const emailSent = await sendMasterCodeEmail(
      "abdallahhfares@gmail.com", // Fixed email as requested
      masterCode,
      admin.name
    );

    if (!emailSent) {
      return res
        .status(500)
        .json({ error: "Failed to send master code email" });
    }

    res.status(200).json({
      message: "Master code sent to email",
      tempToken: tempToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Verify master code
router.post("/admin/verify-master-code", async (req, res) => {
  try {
    const { tempToken, masterCode } = req.body;

    if (!tempToken || !masterCode) {
      return res
        .status(400)
        .json({ error: "Temp token and master code are required" });
    }

    // Find master code record
    const codeRecord = await MasterCode.findOne({
      tempToken: tempToken,
    }).populate("adminId");

    if (!codeRecord) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Check if expired
    if (new Date() > codeRecord.expiresAt) {
      await MasterCode.deleteOne({ _id: codeRecord._id });
      return res.status(401).json({ error: "Master code expired" });
    }

    // Verify code
    if (codeRecord.code !== masterCode) {
      return res.status(401).json({ error: "Invalid master code" });
    }

    // Mark as used
    codeRecord.usedAt = new Date();
    await codeRecord.save();

    // Generate final admin token
    const adminToken = require("crypto").randomBytes(32).toString("hex");

    res.status(200).json({
      message: "Admin verified successfully",
      adminToken: adminToken,
      adminId: codeRecord.adminId._id,
      name: codeRecord.adminId.name,
      email: codeRecord.adminId.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
