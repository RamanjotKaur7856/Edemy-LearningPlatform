const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  timeLimit: {
    type: Number, // in minutes
    required: true,
    default: 30,
  },
  passMark: {
    type: Number, // percentage
    required: true,
    default: 70,
    min: 0,
    max: 100,
  },
  totalQuestions: {
    type: Number,
    required: true,
    default: 0,
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 0,
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true,
      },
      questionType: {
        type: String,
        enum: ["multiple-choice", "true-false", "short-answer"],
        default: "multiple-choice",
      },
      points: {
        type: Number,
        required: true,
        default: 1,
      },
      options: [
        {
          text: {
            type: String,
            required: true,
          },
          isCorrect: {
            type: Boolean,
            default: false,
          },
        },
      ],
      correctAnswer: {
        type: String, // For short-answer questions
      },
      explanation: {
        type: String, // Explanation shown after quiz completion
      },
    },
  ],
  learningOutcomes: [String], // What students will learn/test
  instructions: {
    type: String,
    default: "Read each question carefully and select the best answer.",
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  allowRetakes: {
    type: Boolean,
    default: true,
  },
  showAnswersAfterSubmission: {
    type: Boolean,
    default: true,
  },
  randomizeQuestions: {
    type: Boolean,
    default: false,
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

// Update totalQuestions and totalPoints before saving
quizSchema.pre("save", function (next) {
  if (this.questions && Array.isArray(this.questions)) {
    this.totalQuestions = this.questions.length;
    this.totalPoints = this.questions.reduce(
      (sum, question) => sum + (question.points || 0),
      0
    );
  }
  this.updatedAt = Date.now();
  next();
});

// Also update on findOneAndUpdate (for PUT requests)
quizSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.questions && Array.isArray(update.questions)) {
    update.totalQuestions = update.questions.length;
    update.totalPoints = update.questions.reduce(
      (sum, question) => sum + (question.points || 0),
      0
    );
  }
  update.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Quiz", quizSchema);

