// services/seedData.js
const PageContent = require("../models/PageContent");

const defaultPageContent = {
  hero: {
    title: "Artisan Craftsmanship Meets Modern Elegance",
    subtitle:
      "Handcrafted apparel from local artisans. Every stitch tells a story.",
    backgroundImage: "",
    backgroundColor: "#0f0f0f",
    textColor: "#ffffff",
    primaryButton: {
      text: "Explore Collection",
      link: "/products",
    },
    secondaryButton: {
      text: "Book Consultation",
      link: "/tailoring",
    },
  },

  features: [
    {
      icon: "fas fa-hand-heart",
      title: "Handcrafted Excellence",
      description:
        "Each piece is carefully crafted by skilled artisans with years of experience.",
    },
    {
      icon: "fas fa-leaf",
      title: "Sustainable Materials",
      description:
        "We use eco-friendly fabrics that are kind to the environment and your skin.",
    },
    {
      icon: "fas fa-shipping-fast",
      title: "Fast Delivery",
      description:
        "Get your orders delivered quickly and safely to your doorstep.",
    },
    {
      icon: "fas fa-headset",
      title: "24/7 Support",
      description:
        "Our dedicated team is always ready to help you with any questions.",
    },
  ],

  reviews: [
    {
      name: "أحمد علي",
      role: "Customer",
      rating: 5,
      comment: "الجودة ممتازة جداً والخدمة رائعة. سأشتري مرة أخرى!",
      date: "2025-12-01",
      image: "https://via.placeholder.com/100",
    },
    {
      name: "فاطمة محمد",
      role: "Customer",
      rating: 5,
      comment: "منتجات رائعة وسعر عادل. أنصح الجميع بالشراء منهم.",
      date: "2025-11-28",
      image: "https://via.placeholder.com/100",
    },
    {
      name: "محمود حسن",
      role: "Customer",
      rating: 4,
      comment: "الملابس جميلة لكن التسليم استغرق وقت أطول قليلاً.",
      date: "2025-11-25",
      image: "https://via.placeholder.com/100",
    },
  ],

  promotions: [
    {
      text: "🎉 Summer Sale - Up to 50% OFF!",
      icon: "fas fa-tag",
    },
    {
      text: "⭐ New Collection Available Now!",
      icon: "fas fa-star",
    },
    {
      text: "🎁 Free Shipping on Orders Over 500 EGP",
      icon: "fas fa-gift",
    },
  ],

  about: {
    title: "Why Choose Us",
    description:
      "We bring together traditional craftsmanship with modern design to create unique, high-quality apparel that tells a story.",
    image: "",
  },

  cta: {
    title: "Ready to Elevate Your Wardrobe?",
    subtitle: "Join thousands of customers who love our designs.",
    buttonText: "Start Shopping",
    buttonLink: "/products",
  },

  footer: {
    companyName: "LOCAL CRAFT",
    description: "Handcrafted apparel from local artisans.",
    socialLinks: [
      {
        platform: "facebook",
        url: "https://facebook.com/localcraft",
      },
      {
        platform: "instagram",
        url: "https://instagram.com/localcraft",
      },
      {
        platform: "twitter",
        url: "https://twitter.com/localcraft",
      },
    ],
  },
};

async function seedPageContent() {
  try {
    const existingContent = await PageContent.findOne();

    if (!existingContent) {
      const newContent = new PageContent(defaultPageContent);
      await newContent.save();
      console.log("✓ Default page content created");
      return newContent;
    } else {
      console.log("✓ Page content already exists");
      return existingContent;
    }
  } catch (error) {
    console.error("✗ Error seeding page content:", error.message);
  }
}

module.exports = { seedPageContent, defaultPageContent };
