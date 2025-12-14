const mongoose = require("mongoose");
const Feedback = require("./models/Feedback");

// MongoDB connection
const MONGODB_URI = "mongodb://localhost:27017/store";

async function cleanupDeletedFeedbacks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all feedbacks that are rejected and have no deletedByUser or deletedByAdmin flags
    const feedbacksToCleanup = await Feedback.find({
      status: "rejected",
      deletedByUser: { $ne: true },
      deletedByAdmin: { $ne: true },
    });

    console.log(`Found ${feedbacksToCleanup.length} feedbacks to cleanup`);

    if (feedbacksToCleanup.length > 0) {
      // Update all these feedbacks to mark them as deleted by admin
      const result = await Feedback.updateMany(
        {
          status: "rejected",
          deletedByUser: { $ne: true },
          deletedByAdmin: { $ne: true },
        },
        {
          $set: {
            deletedByAdmin: true,
            deletedAt: new Date(),
          },
        }
      );

      console.log(
        `✅ Updated ${result.modifiedCount} feedbacks, marked as deleted by admin`
      );
    }

    // Also check for any orphaned feedbacks (where admin might have deleted the user)
    const orphanedFeedbacks = await Feedback.find({
      deletedByAdmin: { $ne: true },
      deletedByUser: { $ne: true },
    }).populate("userId");

    let orphanedCount = 0;
    for (const feedback of orphanedFeedbacks) {
      if (!feedback.userId || feedback.userId.banned) {
        await Feedback.updateOne(
          { _id: feedback._id },
          {
            $set: {
              deletedByAdmin: true,
              deletedAt: new Date(),
            },
          }
        );
        orphanedCount++;
      }
    }

    if (orphanedCount > 0) {
      console.log(`✅ Cleaned up ${orphanedCount} orphaned feedbacks`);
    }

    console.log("✅ Cleanup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupDeletedFeedbacks();
