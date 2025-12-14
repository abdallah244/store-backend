const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/auth");
const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
});

// WhatsApp notification function using Ultramsg API
async function sendWhatsAppNotification(phoneNumber, message) {
  try {
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!instanceId || !token) {
      console.log("⚠️  WhatsApp API not configured. Skipping notification.");
      console.log(
        "   To enable: Set WHATSAPP_INSTANCE_ID and WHATSAPP_TOKEN in .env"
      );
      return false;
    }

    // Format phone number (ensure it starts with country code without +)
    let formattedPhone = phoneNumber.replace(/\D/g, ""); // Remove non-digits
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "2" + formattedPhone; // Egypt country code
    }
    if (!formattedPhone.startsWith("2")) {
      formattedPhone = "2" + formattedPhone;
    }

    const apiUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        to: formattedPhone,
        body: message,
      }),
    });

    const data = await response.json();

    if (data.sent === "true" || data.sent === true) {
      console.log(`✓ WhatsApp sent to ${phoneNumber}`);
      return true;
    } else {
      console.error("WhatsApp API response:", data);
      return false;
    }
  } catch (error) {
    console.error("WhatsApp notification error:", error.message);
    return false;
  }
}

// Send email notification to admin
async function sendAdminEmailNotification(order) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "abdallahhfares@gmail.com";

    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: adminEmail,
      subject: `🛒 New Order from ${order.userName} - Order #${order._id
        .toString()
        .slice(-8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🛒 New Order Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${order._id
              .toString()
              .slice(-8)}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Customer Information</h2>
            <p><strong>Name:</strong> ${order.userName}</p>
            <p><strong>Email:</strong> ${order.userEmail}</p>
            <p><strong>Phone:</strong> ${order.userPhone}</p>
            <p><strong>Address:</strong> ${order.userAddress}</p>
            
            <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 30px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Product</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Price</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.productName}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.unitPrice} EGP</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.total} EGP</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> ${
                order.subtotal
              } EGP</p>
              <p style="margin: 5px 0;"><strong>Delivery Fee:</strong> ${
                order.deliveryFee
              } EGP</p>
              <p style="margin: 5px 0; font-size: 20px; color: #059669;"><strong>Total Amount:</strong> ${
                order.totalAmount
              } EGP</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${
                order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : "Online Payment"
              }</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #dbeafe; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 16px;">Please review the order in the admin panel</p>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:4200"
              }/admin/orders" 
                 style="display: inline-block; margin-top: 15px; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Order in Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
            <p>This email was sent automatically from the store management system</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Admin email notification sent to ${adminEmail}`);
    return true;
  } catch (error) {
    console.error("Email notification error:", error.message);
    return false;
  }
}

// Create new order (User)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate userId format
    if (!userId || userId.length !== 24) {
      console.error("Invalid userId format:", userId);
      return res.status(401).json({ message: "Invalid user session" });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user profile is complete
    if (!user.accountCompleted) {
      return res.status(400).json({
        message: "Please complete your profile before placing an order",
        requiresProfileCompletion: true,
      });
    }

    const { items, subtotal, deliveryFee, totalAmount, paymentMethod } =
      req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = new Order({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userAddress: user.address,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      status: "pending",
    });

    await order.save();

    // Send email notification to admin (don't block response if email fails)
    sendAdminEmailNotification(order).catch((err) => {
      console.error("Email notification failed:", err.message);
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ userId }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Cancel order (User)
router.post("/:orderId/cancel", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be cancelled" });
    }

    order.status = "cancelled";
    order.updatedAt = Date.now();
    await order.save();

    return res.json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all orders (Admin only)
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate userId is a valid MongoDB ID
    if (!userId || userId.length !== 24) {
      console.error("Invalid userId format:", userId);
      return res.status(401).json({ message: "Invalid user session" });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      console.warn("Non-admin access attempt:", userId);
      return res.status(403).json({ message: "Access denied - admin only" });
    }

    const orders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ orderDate: -1 });

    console.log(`Admin ${user.name} fetched ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update order status (Admin only)
router.patch("/admin/:orderId/status", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { orderId } = req.params;
    const { status, adminNotes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check stock availability when approving order
    if (status === "approved" && order.status !== "approved") {
      const stockCheckResults = [];
      let hasInsufficientStock = false;

      for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          stockCheckResults.push({
            productName: item.productName,
            required: item.quantity,
            available: 0,
            sufficient: false,
          });
          hasInsufficientStock = true;
        } else if (product.stock < item.quantity) {
          stockCheckResults.push({
            productName: item.productName,
            required: item.quantity,
            available: product.stock,
            sufficient: false,
          });
          hasInsufficientStock = true;
        }
      }

      if (hasInsufficientStock) {
        const errorDetails = stockCheckResults
          .filter((r) => !r.sufficient)
          .map(
            (r) => `${r.productName}: Need ${r.required}, Have ${r.available}`
          )
          .join(", ");

        return res.status(400).json({
          message: `Stock not available. ${errorDetails}`,
          stockDetails: stockCheckResults,
        });
      }

      // Deduct stock from products
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }
    }

    order.status = status;
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }
    order.updatedAt = Date.now();

    await order.save();

    // Send WhatsApp notification based on status
    if (status === "approved") {
      const message = `Hello ${order.userName}!\n\n✅ Your order #${order._id
        .toString()
        .slice(-8)} has been APPROVED!\n\nTotal Amount: ${
        order.totalAmount
      } EGP\n\nOur team will contact you soon to confirm delivery details.\n\nThank you for your order!`;
      await sendWhatsAppNotification(order.userPhone, message);
    } else if (status === "rejected") {
      const message = `Hello ${
        order.userName
      },\n\n❌ We're sorry, but your order #${order._id
        .toString()
        .slice(
          -8
        )} could not be accepted.\n\nPlease contact our administration team to determine the reason.\n\nPhone: ${
        process.env.WHATSAPP_FROM_NUMBER || "01157961972"
      }\n\nWe apologize for any inconvenience.`;
      await sendWhatsAppNotification(order.userPhone, message);
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete order (Admin only)
router.delete("/admin/:orderId", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { orderId } = req.params;
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
