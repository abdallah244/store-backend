const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function createTestUser() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/store",
      {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log("✓ Connected to MongoDB");

    // Create test user with completed profile
    const hashedPassword = await bcrypt.hash("test123456", 10);

    const testUser = new User({
      name: "Test User",
      email: "test@example.com",
      phone: "01012345678",
      password: hashedPassword,
      profileImage: null,
      address: "123 Main Street, Cairo",
      country: "Egypt",
      governorate: "Cairo",
      accountCompleted: true, // Profile is complete!
      role: "user",
      banned: false,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("✓ Test user already exists");
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  ID: ${existingUser._id}`);
      console.log(`  Profile Completed: ${existingUser.accountCompleted}`);
      await mongoose.disconnect();
      return;
    }

    await testUser.save();

    console.log("✓ Test user created successfully");
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Password: test123456`);
    console.log(`  User ID: ${testUser._id}`);
    console.log(`  Profile Completed: ${testUser.accountCompleted}`);
    console.log("\n✓ You can now login with this account and place orders!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
}

createTestUser();
