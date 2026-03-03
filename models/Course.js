const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  instructor: {
    type: String,
    required: true,
    default: "Edemy",
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  studentCount: {
    type: Number,
    default: 0,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  lessons: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  syllabus: [
    {
      section: {
        type: String,
        required: true,
      },
      lectures: [
        {
          title: String,
          duration: String,
          videoId: String, 
          description: String,
        },
      ],
    },
  ],
  learningOutcomes: [String],
  requirements: [String],
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner",
  },
  language: {
    type: String,
    default: "English",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
