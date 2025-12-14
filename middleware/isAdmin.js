const User = require("../models/User");

// Admin role guard: requires x-user-id header to belong to an admin user
module.exports = async function isAdmin(req, res, next) {
  try {
    const userId = req.headers["x-user-id"] || req.headers["userid"];
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = { userId, role: user.role };
    next();
  } catch (err) {
    console.error("isAdmin middleware error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
