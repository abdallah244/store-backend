/**
 * Test Email and WhatsApp Notifications
 * This file tests if the email and WhatsApp systems are configured correctly
 */

const nodemailer = require("nodemailer");
require("dotenv").config();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Email & WhatsApp Configuration Tester                  ║
╚════════════════════════════════════════════════════════════════╝
`);

// Test Email Configuration
async function testEmailConfiguration() {
  console.log("\n📧 Testing Email Configuration...\n");

  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  // Check if variables are set
  if (!emailUser) {
    console.error("❌ EMAIL_USER not set in .env file");
    return false;
  }
  if (!emailPassword) {
    console.error("❌ EMAIL_PASSWORD not set in .env file");
    return false;
  }
  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL not set in .env file");
    return false;
  }

  console.log("✓ Email variables found:");
  console.log(`  • EMAIL_USER: ${emailUser}`);
  console.log(`  • ADMIN_EMAIL: ${adminEmail}`);
  console.log(`  • EMAIL_PASSWORD: ${emailPassword.substring(0, 5)}...`);

  // Try to create transporter
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Verify connection
    console.log("\n📤 Verifying Gmail connection...");
    await transporter.verify();
    console.log("✅ Gmail connection verified! Email is ready to send.\n");
    return true;
  } catch (error) {
    console.error(`❌ Gmail connection failed: ${error.message}`);
    console.log("\nCommon issues:");
    console.log(
      "  1. EMAIL_PASSWORD might be wrong (use 16-char App Password, not regular password)"
    );
    console.log(
      "  2. Two-Factor Authentication not enabled on your Google account"
    );
    console.log(
      "  3. App Password not created - go to https://myaccount.google.com/apppasswords\n"
    );
    return false;
  }
}

// Test WhatsApp Configuration
function testWhatsAppConfiguration() {
  console.log("📱 Testing WhatsApp Configuration...\n");

  const instanceId = process.env.WHATSAPP_INSTANCE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumber = process.env.WHATSAPP_FROM_NUMBER;

  let allGood = true;

  if (!instanceId || instanceId === "instance12345") {
    console.error("❌ WHATSAPP_INSTANCE_ID not configured");
    allGood = false;
  } else {
    console.log(`✓ WHATSAPP_INSTANCE_ID: ${instanceId}`);
  }

  if (!token || token === "your_ultramsg_token_here") {
    console.error("❌ WHATSAPP_TOKEN not configured");
    allGood = false;
  } else {
    console.log(`✓ WHATSAPP_TOKEN: ${token.substring(0, 10)}...`);
  }

  if (!phoneNumber) {
    console.error("❌ WHATSAPP_FROM_NUMBER not set");
    allGood = false;
  } else {
    console.log(`✓ WHATSAPP_FROM_NUMBER: ${phoneNumber}`);
  }

  if (!allGood) {
    console.log("\nWhatsApp not configured yet. Steps to configure:");
    console.log("  1. Sign up at https://ultramsg.com");
    console.log("  2. Create Instance and connect WhatsApp");
    console.log("  3. Scan QR code with WhatsApp mobile app");
    console.log("  4. Copy Instance ID and Token to .env file\n");
  } else {
    console.log("\n✅ WhatsApp is configured and ready.\n");
  }

  return allGood;
}

// Main test function
async function runTests() {
  const emailOk = await testEmailConfiguration();
  const whatsappOk = testWhatsAppConfiguration();

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      Test Summary                              ║
╚════════════════════════════════════════════════════════════════╝

  Email Status:    ${emailOk ? "✅ Ready" : "❌ Not Ready"}
  WhatsApp Status: ${
    whatsappOk ? "✅ Ready" : "⚠️  Optional (System will work without it)"
  }

${
  emailOk
    ? `
✅ Your system is ready to send emails to admin on new orders!

How it works:
  1. User places an order
  2. Email is automatically sent to: ${process.env.ADMIN_EMAIL}
  3. Admin receives email with order details
  4. Admin can view, approve, or reject the order
  
${
  whatsappOk
    ? `  5. When admin approves/rejects, customer gets WhatsApp notification\n`
    : `  5. WhatsApp notifications ready when you configure credentials\n`
}

Next Steps:
  • Start MongoDB service
  • Run backend: cd backend && node server.js
  • Run frontend: cd frontend && ng serve
  • Test by placing an order
  • Check email at ${process.env.ADMIN_EMAIL}
`
    : `
❌ Please configure your Gmail app password first!

Steps:
  1. Enable 2-Factor Authentication on your Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Select "Mail" and "Other (Custom name)" type "Store Backend"
  4. Copy the 16-character password
  5. Update EMAIL_PASSWORD in .env file (remove spaces)
  6. Re-run this test
`
}
`);

  process.exit(emailOk ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error("Test error:", error);
  process.exit(1);
});
