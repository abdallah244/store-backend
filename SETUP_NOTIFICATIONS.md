# 📧 WhatsApp & Email Notifications Setup Guide

This guide will help you configure WhatsApp and Gmail notifications for your order management system.

---

## 🟢 WhatsApp Setup (Using Ultramsg)

### Step 1: Create Ultramsg Account

1. Go to [https://ultramsg.com](https://ultramsg.com)
2. Click **"Sign Up"** to create a free account
3. Verify your email address

### Step 2: Connect Your WhatsApp Number

1. Login to your Ultramsg dashboard
2. Click **"Create Instance"** or **"Instances"** from the menu
3. Select **"Connect WhatsApp"**
4. Scan the QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices**
   - Tap **"Link a Device"**
   - Scan the QR code displayed on Ultramsg
5. Your WhatsApp account should now be connected!

### Step 3: Get Your API Credentials

After connecting WhatsApp, you'll see:

- **Instance ID**: Something like `instance12345`
- **Token**: A long string like `abc123xyz456...`

Copy these credentials - you'll need them for the `.env` file.

### Step 4: Test Your Connection

1. In the Ultramsg dashboard, go to **"API"** tab
2. Try the **"Test Send Message"** feature
3. Send a test message to your own number

---

## 📧 Gmail Setup (App Password)

### Step 1: Enable 2-Factor Authentication

1. Go to [https://myaccount.google.com](https://myaccount.google.com)
2. Click **"Security"** from the left menu
3. Under **"How you sign in to Google"**, click **"2-Step Verification"**
4. Follow the setup wizard to enable 2FA (required for App Passwords)

### Step 2: Generate App Password

1. Go back to **Security** page
2. Under **"How you sign in to Google"**, click **"2-Step Verification"** again
3. Scroll down and click **"App passwords"**
4. You may need to sign in again
5. Select:
   - **App**: Select "Mail"
   - **Device**: Select "Other (Custom name)" and type "Store Backend"
6. Click **"Generate"**
7. Google will show a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password immediately** - you won't see it again!

### Step 3: Test Email Sending

You can test with this simple Node.js script:

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password-here",
  },
});

transporter
  .sendMail({
    from: "your-email@gmail.com",
    to: "abdallahhfares@gmail.com",
    subject: "Test Email",
    text: "Gmail setup is working!",
  })
  .then(() => {
    console.log("✓ Email sent successfully!");
  })
  .catch((error) => {
    console.error("✗ Error:", error);
  });
```

---

## 🔐 Configure Backend .env File

Create a file called `.env` in the `backend` folder with these variables:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/store

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
ADMIN_EMAIL=abdallahhfares@gmail.com

# WhatsApp Configuration (Ultramsg)
WHATSAPP_INSTANCE_ID=instance12345
WHATSAPP_TOKEN=your-ultramsg-token-here
WHATSAPP_FROM_NUMBER=201157961972
```

### Configuration Details:

- **EMAIL_USER**: Your Gmail address (e.g., `yourstore@gmail.com`)
- **EMAIL_PASSWORD**: The 16-character App Password you generated (remove spaces)
- **ADMIN_EMAIL**: Email address to receive new order notifications (`abdallahhfares@gmail.com`)
- **WHATSAPP_INSTANCE_ID**: Your Ultramsg instance ID
- **WHATSAPP_TOKEN**: Your Ultramsg API token
- **WHATSAPP_FROM_NUMBER**: The WhatsApp number connected to Ultramsg (format: `201157961972` - no + or spaces)

---

## ✅ Test the Complete System

### 1. Start Backend Server

```bash
cd backend
node server.js
```

You should see:

```
✓ Server running on port 3000
✓ MongoDB connected
```

### 2. Place a Test Order

1. Login as a regular user in the frontend
2. Add items to cart
3. Place an order (make sure your profile has a valid phone number)
4. You should see the success modal

### 3. Check Admin Email

- Check `abdallahhfares@gmail.com` inbox
- You should receive an email with the order details
- Subject: "🛒 New Order from [Customer Name] - Order #[ID]"

### 4. Test WhatsApp Notifications

1. Login as admin at `http://localhost:4200/admin/login`
2. Go to **Orders Management** page
3. Click **"View Details"** on the test order
4. Click **"Approve Order"** button
5. The customer should receive a WhatsApp message:

   ```
   Hello [Name]!

   ✅ Your order #[ID] has been APPROVED!

   Total Amount: [Amount] EGP

   Our team will contact you soon to confirm delivery details.

   Thank you for your order!
   ```

### 5. Test Rejection WhatsApp

1. Try clicking **"Reject Order"** on a different order
2. Enter a reason (optional)
3. The customer should receive:

   ```
   Hello [Name],

   ❌ We're sorry, but your order #[ID] could not be accepted.

   Please contact our administration team to determine the reason.

   Phone: [Admin Phone]

   We apologize for any inconvenience.
   ```

---

## 🐛 Troubleshooting

### WhatsApp Not Sending?

- **Check Instance Status**: In Ultramsg dashboard, verify your instance is "Connected"
- **Check Logs**: Look at backend console for WhatsApp API errors
- **Phone Format**: Make sure customer phone is in correct format (e.g., `01157961972` or `201157961972`)
- **Free Plan Limits**: Ultramsg free plan has message limits - check your quota

### Email Not Sending?

- **Check App Password**: Make sure you copied it correctly (no spaces)
- **2FA Required**: App Passwords only work with 2-Factor Authentication enabled
- **Less Secure Apps**: No longer needed with App Passwords
- **Check Spam**: Email might be in spam folder
- **Gmail Errors**: Check backend console for specific error messages

### Backend Errors?

Common issues:

- **Missing .env**: Make sure `.env` file exists in `backend` folder
- **Wrong Credentials**: Double-check all values in `.env`
- **Port Conflicts**: Make sure port 3000 is available
- **MongoDB Not Running**: Start MongoDB service

---

## 📱 Phone Number Formats

The system automatically handles Egyptian phone numbers:

| User Enters   | System Converts | WhatsApp API Uses |
| ------------- | --------------- | ----------------- |
| 01157961972   | 201157961972    | ✓ Works           |
| 201157961972  | 201157961972    | ✓ Works           |
| +201157961972 | 201157961972    | ✓ Works           |
| 1157961972    | 201157961972    | ✓ Works           |

**For non-Egyptian numbers**: Contact admin to update country code logic in `backend/routes/orders.js`

---

## 🎯 What Happens in Each Scenario?

### When Customer Places Order:

1. ✅ Order saved to database
2. ✅ Email sent to admin (`abdallahhfares@gmail.com`)
3. ✅ Success modal shown to customer
4. ❌ NO WhatsApp sent yet (waiting for admin action)

### When Admin Approves Order:

1. ✅ Order status changed to "approved"
2. ✅ WhatsApp notification sent to customer's phone
3. ✅ Admin sees success message
4. ✅ Order list refreshed

### When Admin Rejects Order:

1. ✅ Order status changed to "rejected"
2. ✅ WhatsApp notification sent to customer's phone
3. ✅ Rejection reason saved (if provided)
4. ✅ Admin sees success message

---

## 🔒 Security Notes

⚠️ **IMPORTANT**: Never commit your `.env` file to Git!

Add this to your `.gitignore`:

```
.env
node_modules/
```

Your API credentials are sensitive - keep them secret!

---

## 📞 Support

If you need help:

- **Ultramsg Support**: [https://ultramsg.com/support](https://ultramsg.com/support)
- **Gmail Help**: [https://support.google.com/mail](https://support.google.com/mail)
- **Backend Logs**: Check terminal where you ran `node server.js`

---

## ✨ System Is Ready!

Once you've configured everything:

- ✅ Admin orders page is in English
- ✅ All messages are in English
- ✅ WhatsApp notifications work for approve/reject
- ✅ Email notifications sent to admin on new orders
- ✅ Customer phone numbers automatically formatted
- ✅ Beautiful email template with order details

**Enjoy your fully automated order management system! 🚀**
