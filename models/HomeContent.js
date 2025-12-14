const mongoose = require("mongoose");

const homeContentSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Artisan Craftsmanship Meets Modern Elegance",
    },
    heroSubtitle: {
      type: String,
      default:
        "Handcrafted apparel from local artisans. Every stitch tells a story.",
    },
    primaryButtonText: {
      type: String,
      default: "Explore Collection",
    },
    primaryButtonLink: {
      type: String,
      default: "/products",
    },
    secondaryButtonText: {
      type: String,
      default: "Book Consultation",
    },
    secondaryButtonLink: {
      type: String,
      default: "/tailoring",
    },
    heroBackgroundUrl: {
      type: String,
      default: "",
    },
    features: [
      {
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    advertisements: [
      {
        imageUrl: { type: String, required: true },
        link: { type: String, default: "" },
        alt: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeContent", homeContentSchema);
