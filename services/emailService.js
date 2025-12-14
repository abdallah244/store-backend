// services/emailService.js
const nodemailer = require("nodemailer");

// Create transporter with better config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("✗ Email service error:", error.message);
  } else {
    console.log("✓ Email service ready");
  }
});

// Send master code email
const sendMasterCodeEmail = async (email, code, adminName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("✗ Email credentials not configured in .env");
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 Master Code - Admin Access Verification",
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Hellow ${adminName}</h2>
            <p style="color: #666;">A new master code has been requested to log in to the control panel.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
              <p style="color: #999; margin: 0 0 10px 0;">Master Code:</p>
              <h1 style="color: #2196F3; margin: 0; letter-spacing: 2px; font-size: 32px;">${code}</h1>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">It expires after 10 minutes.
</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">⚠️Do not share this code with anyone.</p>
            <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.
</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Master code sent to ${email}`);
    return true;
  } catch (error) {
    console.error("✗ Error sending master code email:", error.message);
    console.error("Error details:", error);
    return false;
  }
};

// Send feedback notification to admin
const sendFeedbackNotificationEmail = async (
  adminEmail,
  userName,
  title,
  category
) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("✗ Email credentials not configured in .env");
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `📝 New Feedback Request from ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">New Feedback Received</h2>
            <p style="color: #666;">A user has submitted feedback that requires your attention.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fbbf24;">
              <p style="color: #999; margin: 0 0 10px 0;"><strong>User Name:</strong></p>
              <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;">${userName}</p>
              
              <p style="color: #999; margin: 0 0 10px 0;"><strong>Feedback Title:</strong></p>
              <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;">${title}</p>
              
              <p style="color: #999; margin: 0 0 10px 0;"><strong>Category:</strong></p>
              <p style="color: #333; margin: 0; font-size: 16px;">${category.toUpperCase()}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Please log in to the admin panel to review and approve or reject this feedback.</p>
            
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:4200"
            }/admin" style="display: inline-block; background: #fbbf24; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">View in Admin Panel</a>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Feedback notification sent to admin`);
    return true;
  } catch (error) {
    console.error("✗ Error sending feedback notification:", error.message);
    return false;
  }
};

// Send contact request to admin
const sendContactRequestEmail = async (adminEmail, user, reason) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("✗ Email credentials not configured in .env");
      return false;
    }

    const profileImageSection = user.profileImage
      ? `<div style="margin: 10px 0;"><strong>Profile Image:</strong><br/><img src="${
          (process.env.BACKEND_URL || "http://localhost:3000") +
          user.profileImage
        }" alt="profile" style="width:80px;height:80px;border-radius:50%;object-fit:cover;"/></div>`
      : "";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `📞 New Contact Request from ${user.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">New Contact Request</h2>
            <p style="color: #666;">A user requested to contact the management.</p>
            ${profileImageSection}
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="color: #999; margin: 0 0 8px 0;"><strong>Name:</strong></p>
              <p style="color: #333; margin: 0 0 12px 0; font-size: 15px;">${
                user.name
              }</p>
              <p style="color: #999; margin: 0 0 8px 0;"><strong>Email:</strong></p>
              <p style="color: #333; margin: 0 0 12px 0; font-size: 15px;">${
                user.email
              }</p>
              <p style="color: #999; margin: 0 0 8px 0;"><strong>Phone:</strong></p>
              <p style="color: #333; margin: 0 0 12px 0; font-size: 15px;">${
                user.phone
              }</p>
              <p style="color: #999; margin: 0 0 8px 0;"><strong>Reason:</strong></p>
              <p style="color: #333; margin: 0; font-size: 15px; white-space: pre-line;">${reason}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Please follow up with this user and update the request status in the admin panel.</p>
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:4200"
            }/admin" style="display: inline-block; background: #10b981; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">Open Admin Panel</a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Contact request notification sent to admin`);
    return true;
  } catch (error) {
    console.error("✗ Error sending contact request email:", error.message);
    return false;
  }
};

module.exports = {
  sendMasterCodeEmail,
  sendFeedbackNotificationEmail,
  sendContactRequestEmail,
};
