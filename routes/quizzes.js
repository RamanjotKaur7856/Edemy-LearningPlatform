const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Course = require("../models/Course");

// Get all quizzes
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("courseId", "title")
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single quiz by ID
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "courseId",
      "title subtitle"
    );
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    console.log(`GET /api/quizzes/${req.params.id} - Returning quiz with ${quiz.questions?.length || 0} questions (totalQuestions: ${quiz.totalQuestions})`);
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quizzes by course ID
router.get("/course/:courseId", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId }).sort({
      createdAt: -1,
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new quiz
router.post("/", async (req, res) => {
  try {
    // Verify course exists
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Filter out invalid questions before saving
    if (req.body.questions && Array.isArray(req.body.questions)) {
      req.body.questions = req.body.questions.filter(q => {
        return q.questionText && q.questionText.trim() && 
               (q.questionType === 'short-answer' || (q.options && q.options.length >= 2));
      });
    }

    // Calculate totalQuestions and totalPoints (pre-save hook will also do this, but set it explicitly)
    if (req.body.questions && Array.isArray(req.body.questions)) {
      req.body.totalQuestions = req.body.questions.length;
      req.body.totalPoints = req.body.questions.reduce(
        (sum, question) => sum + (question.points || 0),
        0
      );
    }

    console.log(`Creating quiz with ${req.body.questions?.length || 0} questions`);

    const quiz = new Quiz({
      ...req.body,
      courseName: course.title,
    });
    await quiz.save();
    
    console.log(`Quiz created successfully with ${quiz.questions.length} questions, totalQuestions: ${quiz.totalQuestions}`);
    res.status(201).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update a quiz
router.put("/:id", async (req, res) => {
  try {
    // If courseId is being updated, verify the new course exists
    if (req.body.courseId) {
      const course = await Course.findById(req.body.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      req.body.courseName = course.title;
    }

    // Filter out invalid questions before updating
    if (req.body.questions && Array.isArray(req.body.questions)) {
      req.body.questions = req.body.questions.filter(q => {
        return q.questionText && q.questionText.trim() && 
               (q.questionType === 'short-answer' || (q.options && q.options.length >= 2));
      });
    }

    // Calculate totalQuestions and totalPoints manually (since findByIdAndUpdate doesn't trigger pre-save hooks)
    if (req.body.questions && Array.isArray(req.body.questions)) {
      req.body.totalQuestions = req.body.questions.length;
      req.body.totalPoints = req.body.questions.reduce(
        (sum, question) => sum + (question.points || 0),
        0
      );
    }

    console.log(`Updating quiz with ${req.body.questions?.length || 0} questions`);

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    console.log(`Quiz updated successfully with ${quiz.questions.length} questions, totalQuestions: ${quiz.totalQuestions}`);
    res.json(quiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a quiz
router.delete("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

