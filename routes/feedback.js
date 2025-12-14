const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { sendFeedbackNotificationEmail } = require("../services/emailService");

// Create feedback (user must have completed account)
router.post("/create", async (req, res) => {
  try {
    const { userId, title, description, rating, category } = req.body;

    // Validate required fields
    if (!userId || !title || !description || !rating || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate rating
    if (![1, 2, 3, 4, 5].includes(rating)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if user exists and has completed account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if account is complete
    const accountComplete =
      user.accountCompleted ||
      (user.address &&
        user.country &&
        user.governorate &&
        user.address.trim() !== "" &&
        user.country.trim() !== "" &&
        user.governorate.trim() !== "");

    if (!accountComplete) {
      return res.status(403).json({
        message: "Your account must be complete before submitting feedback",
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userProfileImage: user.profileImage || "",
      title,
      description,
      rating,
      category,
      status: "pending",
      isPublic: false,
    });

    await feedback.save();

    // Send notification to admin
    try {
      await sendFeedbackNotificationEmail(
        "abdallahhfares@gmail.com",
        user.name,
        title,
        category
      );
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }

    res.status(201).json({
      message: "Feedback submitted successfully. Awaiting admin approval.",
      feedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res
      .status(500)
      .json({ message: "Error creating feedback", error: error.message });
  }
});

// Get all approved feedbacks (public)
router.get("/public", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      status: "approved",
      isPublic: true,
      deletedByUser: { $ne: true },
      deletedByAdmin: { $ne: true },
    })
      .sort({ approvedAt: -1 })
      .limit(100)
      .populate("userId", "name email profileImage");

    // Ensure profile image is present if user has one
    const normalized = feedbacks.map((fb) => {
      const obj = fb.toObject();
      if (!obj.userProfileImage && obj.userId && obj.userId.profileImage) {
        obj.userProfileImage = obj.userId.profileImage;
      }
      return obj;
    });

    res.json(normalized);
  } catch (error) {
    console.error("Error fetching public feedbacks:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedbacks", error: error.message });
  }
});

// User: Delete own feedback (soft delete)
router.delete("/user/delete/:feedbackId", async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const feedback = await Feedback.findOne({ _id: feedbackId, userId });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.deletedByUser = true;
    feedback.deletedAt = new Date();
    feedback.isPublic = false;
    feedback.status =
      feedback.status === "approved" ? "rejected" : feedback.status;

    await feedback.save();

    res.json({ message: "Feedback deleted by user", feedback });
  } catch (error) {
    console.error("Error deleting feedback by user:", error);
    res
      .status(500)
      .json({ message: "Error deleting feedback", error: error.message });
  }
});

// Get user's own feedbacks (exclude deleted feedbacks)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const feedbacks = await Feedback.find({
      userId,
      deletedByAdmin: { $ne: true },
      deletedByUser: { $ne: true },
    }).sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching user feedbacks:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedbacks", error: error.message });
  }
});

// Admin: Get all feedbacks (pending, approved, rejected)
router.get("/admin/all", async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email accountCompleted");

    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching all feedbacks:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedbacks", error: error.message });
  }
});

// Admin: Get pending feedbacks
router.get("/admin/pending", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching pending feedbacks:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedbacks", error: error.message });
  }
});

// Admin: Approve feedback
router.put("/admin/approve/:feedbackId", async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { adminNotes } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        status: "approved",
        isPublic: true,
        approvedAt: new Date(),
        adminNotes: adminNotes || "",
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback approved", feedback });
  } catch (error) {
    console.error("Error approving feedback:", error);
    res
      .status(500)
      .json({ message: "Error approving feedback", error: error.message });
  }
});

// Admin: Reject feedback
router.put("/admin/reject/:feedbackId", async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { adminNotes } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        status: "rejected",
        isPublic: false,
        rejectedAt: new Date(),
        adminNotes: adminNotes || "",
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback rejected", feedback });
  } catch (error) {
    console.error("Error rejecting feedback:", error);
    res
      .status(500)
      .json({ message: "Error rejecting feedback", error: error.message });
  }
});

// Admin: Delete feedback
router.delete("/admin/delete/:feedbackId", async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { deletedByAdmin: true, deletedAt: new Date() },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully", feedback });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res
      .status(500)
      .json({ message: "Error deleting feedback", error: error.message });
  }
});

// Toggle like on feedback
router.post("/like/:feedbackId", async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Check if user already liked
    const userIndex = feedback.likedBy.indexOf(userId);

    if (userIndex > -1) {
      // User already liked, so unlike
      feedback.likedBy.splice(userIndex, 1);
      feedback.likes = Math.max(0, feedback.likes - 1);
    } else {
      // User hasn't liked, so add like
      feedback.likedBy.push(userId);
      feedback.likes += 1;
    }

    await feedback.save();

    res.json({
      message: userIndex > -1 ? "Like removed" : "Like added",
      likes: feedback.likes,
      isLiked: userIndex === -1,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res
      .status(500)
      .json({ message: "Error toggling like", error: error.message });
  }
});

module.exports = router;
