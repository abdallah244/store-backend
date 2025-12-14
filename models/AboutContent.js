// models/AboutContent.js
const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  id: String,
  name: String,
  position: String,
  image: String,
  bio: String,
});

const statisticSchema = new mongoose.Schema({
  label: String,
  value: String,
  icon: String,
});

const aboutContentSchema = new mongoose.Schema({
  heroImage: {
    type: String,
    default: "/assets/about/hero.jpg",
  },
  brandStory: {
    type: String,
    default:
      "Our journey began with a deep love for craftsmanship and local artisans.",
  },
  brandImage: {
    type: String,
    default: "/assets/about/brand-story.jpg",
  },
  ceoStory: {
    type: String,
    default:
      "I started young, learning patience and quality from family artisans.",
  },
  ceoImage: {
    type: String,
    default: "/assets/team/ceo.jpg",
  },
  stats: [statisticSchema],
  teamMembers: [teamMemberSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AboutContent", aboutContentSchema);
