const mongoose = require("mongoose");
const Feedback = require("./models/Feedback");
const User = require("./models/User");

// MongoDB connection
const MONGODB_URI = "mongodb://localhost:27017/store";

async function checkFeedbacks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find a specific user's feedbacks (replace with actual userId from screenshot)
    const allFeedbacks = await Feedback.find().populate("userId", "name email");

    console.log(`\nTotal feedbacks in database: ${allFeedbacks.length}\n`);

    allFeedbacks.forEach((fb, index) => {
      console.log(`\n--- Feedback ${index + 1} ---`);
      console.log(`ID: ${fb._id}`);
      console.log(
        `User: ${fb.userId ? fb.userId.name : "Unknown"} (${fb.userId?._id})`
      );
      console.log(`Title: ${fb.title}`);
      console.log(`Status: ${fb.status}`);
      console.log(`deletedByUser: ${fb.deletedByUser}`);
      console.log(`deletedByAdmin: ${fb.deletedByAdmin}`);
      console.log(`Created: ${fb.createdAt}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkFeedbacks();
