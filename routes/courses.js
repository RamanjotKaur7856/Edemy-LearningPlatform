const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check enrollment status (must be before /:id route)
router.get("/:id/enrollment/:userId", async (req, res) => {
  try {
    const { id: courseId, userId } = req.params;
    const User = require("../models/User");
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ isEnrolled: false });
    }

    const isEnrolled = user.enrolledCourses.some(
      (course) => course.toString() === courseId
    );

    res.json({ isEnrolled });
  } catch (error) {
    console.error("Check enrollment error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enrollment endpoint
router.post("/:id/enroll", async (req, res) => {
  try {
    const { userId, firstName, lastName, email, phone } = req.body;
    const courseId = req.params.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const User = require("../models/User");
    let user;

    // If userId is provided, use that user (logged-in user)
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please log in again." });
      }
      // For logged-in users, ignore form email and use their account email
      // Optionally update phone if provided
      if (phone && phone.trim()) {
        // You can add a phone field to User model if needed
        // For now, we'll just use the logged-in user as-is
      }
    } else {
      // Guest enrollment - create new user
      if (!email) {
        return res.status(400).json({ message: "Email is required for enrollment" });
      }
      
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      // Check if user with email already exists
      user = await User.findOne({ email });
      if (!user) {
        // Create new user with temporary password
        const bcrypt = require("bcryptjs");
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        user = new User({
          firstName,
          lastName,
          email,
          password: tempPassword, // Will be hashed by pre-save hook
          role: "student",
        });
        await user.save();
      } else {
        // User exists but not logged in - they should log in first
        return res.status(400).json({ 
          message: "An account with this email already exists. Please log in to enroll." 
        });
      }
    }

    // Check if already enrolled
    if (user.enrolledCourses.some(course => course.toString() === courseId)) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }

    // Add course to user's enrolled courses
    user.enrolledCourses.push(courseId);
    await user.save();

    // Update course student count
    course.studentCount = (course.studentCount || 0) + 1;
    await course.save();

    res.status(200).json({
      message: "Enrollment successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        enrolledCourses: user.enrolledCourses,
      },
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
