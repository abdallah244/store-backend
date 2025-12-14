const express = require("express");
const router = express.Router();
const ContactRequest = require("../models/ContactRequest");
const User = require("../models/User");
const { sendContactRequestEmail } = require("../services/emailService");

// Create contact request
router.post("/request", async (req, res) => {
  try {
    const { userId, phone, reason } = req.body;

    if (!userId || !phone || !reason) {
      return res
        .status(400)
        .json({ message: "User, phone, and reason are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = new ContactRequest({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: phone,
      userProfileImage: user.profileImage || "",
      reason,
      status: "pending",
    });

    await request.save();

    // Notify admin via email
    await sendContactRequestEmail(
      "abdallahhfares@gmail.com",
      {
        name: user.name,
        email: user.email,
        phone,
        profileImage: user.profileImage,
      },
      reason
    );

    res.status(201).json({ message: "Request submitted", request });
  } catch (error) {
    console.error("Error creating contact request:", error);
    res
      .status(500)
      .json({
        message: "Error creating contact request",
        error: error.message,
      });
  }
});

// Get user contact requests
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await ContactRequest.find({ userId }).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching user contact requests:", error);
    res
      .status(500)
      .json({ message: "Error fetching requests", error: error.message });
  }
});

// Admin: all requests
router.get("/admin/all", async (req, res) => {
  try {
    const requests = await ContactRequest.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email profileImage phone");
    res.json(requests);
  } catch (error) {
    console.error("Error fetching contact requests:", error);
    res
      .status(500)
      .json({ message: "Error fetching requests", error: error.message });
  }
});

// Admin: approve
router.put("/admin/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const updated = await ContactRequest.findByIdAndUpdate(
      id,
      { status: "approved", adminNotes: adminNotes || "" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Request approved", request: updated });
  } catch (error) {
    console.error("Error approving contact request:", error);
    res
      .status(500)
      .json({ message: "Error approving request", error: error.message });
  }
});

// Admin: reject
router.put("/admin/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const updated = await ContactRequest.findByIdAndUpdate(
      id,
      { status: "rejected", adminNotes: adminNotes || "" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Request rejected", request: updated });
  } catch (error) {
    console.error("Error rejecting contact request:", error);
    res
      .status(500)
      .json({ message: "Error rejecting request", error: error.message });
  }
});

module.exports = router;
