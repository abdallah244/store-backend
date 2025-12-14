const mongoose = require("mongoose");

const deliveryFeeSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    currency: {
      type: String,
      default: "EGP",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryFee", deliveryFeeSchema);
