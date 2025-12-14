// models/PageContent.js
const mongoose = require("mongoose");

const pageContentSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    title: {
      type: String,
      default: "Artisan Craftsmanship Meets Modern Elegance",
    },
    subtitle: {
      type: String,
      default:
        "Handcrafted apparel from local artisans. Every stitch tells a story.",
    },
    backgroundImage: {
      type: String,
      default: "",
    },
    backgroundColor: {
      type: String,
      default: "#0f0f0f",
    },
    textColor: {
      type: String,
      default: "#ffffff",
    },
    primaryButton: {
      text: { type: String, default: "Explore Collection" },
      link: { type: String, default: "/products" },
    },
    secondaryButton: {
      text: { type: String, default: "Book Consultation" },
      link: { type: String, default: "/tailoring" },
    },
  },

  // Features Section
  features: [
    {
      icon: String,
      title: String,
      description: String,
    },
  ],

  // Reviews Section
  reviews: [
    {
      name: String,
      role: String,
      rating: Number,
      comment: String,
      date: String,
      image: String,
    },
  ],

  // Default values
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Discounts/Promotions Section
  promotions: [
    {
      text: String,
      icon: String,
    },
  ],

  // About Section
  about: {
    title: {
      type: String,
      default: "Why Choose Us",
    },
    description: {
      type: String,
      default:
        "We bring together traditional craftsmanship with modern design.",
    },
    image: String,
  },

  // CTA Section
  cta: {
    title: String,
    subtitle: String,
    buttonText: String,
    buttonLink: String,
  },

  // Footer
  footer: {
    companyName: String,
    description: String,
    socialLinks: [
      {
        platform: String,
        url: String,
      },
    ],
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PageContent", pageContentSchema);
