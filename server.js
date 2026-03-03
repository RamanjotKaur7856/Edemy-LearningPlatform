// Load environment variables FIRST before any other imports
const path = require("path");
// Load .env file if it exists (for local development)
// In production (Render), environment variables are set directly
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Debug: Log environment variable status (without exposing secrets)
console.log("Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? `SET (length: ${process.env.JWT_SECRET.length})` : "NOT SET");
console.log("- MONGODB_URI:", process.env.MONGODB_URI ? "SET" : "NOT SET");
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL ? "SET" : "NOT SET");
console.log("- PORT:", process.env.PORT || "not set");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// CORS configuration - handle both single origin and array of origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? (process.env.FRONTEND_URL.includes(',') 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : process.env.FRONTEND_URL)
  : '*';

// Helper function to normalize URLs (remove trailing slashes)
const normalizeOrigin = (url) => {
  if (!url) return url;
  return url.replace(/\/$/, ''); // Remove trailing slash
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
      if (!origin) return callback(null, true);
      
      // If allowedOrigins is '*', allow all origins
      if (allowedOrigins === '*') return callback(null, true);
      
      // Normalize the incoming origin
      const normalizedOrigin = normalizeOrigin(origin);
      
      // If allowedOrigins is a string, check if it matches
      if (typeof allowedOrigins === 'string') {
        const normalizedAllowed = normalizeOrigin(allowedOrigins);
        if (normalizedOrigin === normalizedAllowed) {
          return callback(null, true);
        }
      }
      
      // If allowedOrigins is an array, check if origin is in the array
      if (Array.isArray(allowedOrigins)) {
        const normalizedAllowed = allowedOrigins.map(normalizeOrigin);
        if (normalizedAllowed.indexOf(normalizedOrigin) !== -1) {
          return callback(null, true);
        }
      }
      
      // Origin not allowed
      console.warn(`CORS: Origin ${origin} not allowed. Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is required in environment variables. Please check your .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/api/courses", require("./routes/courses"));
app.use("/api/users", require("./routes/users"));
app.use("/api/quizzes", require("./routes/quizzes"));

const User = require("./models/User");
const Course = require("./models/Course");
const Quiz = require("./models/Quiz");
const { authenticateAdmin } = require("./middleware/adminAuth");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET?.trim();

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set");
  process.exit(1);
}

// Admin setup route (public, only works if no admin exists)
app.get("/admin/setup", async (req, res) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: "admin" });
    const adminEmails = adminExists 
      ? await User.find({ role: "admin" }).select("email firstName lastName").lean()
      : [];
    
    res.render("admin-setup", {
      title: "Admin Setup - Edemy",
      adminExists: !!adminExists,
      adminEmails: adminEmails,
      error: req.query.error,
      success: req.query.success,
    }); 
  } catch (error) {
    console.error("Admin setup page error:", error);
    res.status(500).send("Server Error");
  }
});

// Admin setup POST route
app.post("/admin/setup", async (req, res) => {
  try {
    // Check if any admin already exists
    const adminExists = await User.findOne({ role: "admin" });
    
    // If admin exists, require authentication to create additional admins
    if (adminExists) {
      // Check if user is already logged in as admin
      const token = req.cookies.adminToken || req.cookies.token;
      if (!token) {
        return res.redirect("/admin/setup?error=Admin account already exists. Please login first to create additional admin accounts.");
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const currentUser = await User.findById(decoded.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.redirect("/admin/setup?error=Only existing admins can create additional admin accounts. Please login first.");
        }
      } catch (authError) {
        return res.redirect("/admin/setup?error=Invalid session. Please login first to create additional admin accounts.");
      }
    }

    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.redirect("/admin/setup?error=All fields are required.");
    }

    if (password.length < 6) {
      return res.redirect("/admin/setup?error=Password must be at least 6 characters long.");
    }

    if (password !== confirmPassword) {
      return res.redirect("/admin/setup?error=Passwords do not match.");
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect("/admin/setup?error=User with this email already exists.");
    }

    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      email,
      password,
      role: "admin",
      isActive: true,
    });

    await adminUser.save();

    const successMessage = adminExists 
      ? "Additional admin account created successfully!" 
      : "Admin account created successfully! You can now login.";
    
    res.redirect(`/admin/login?success=${encodeURIComponent(successMessage)}`);
  } catch (error) {
    console.error("Admin setup error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.redirect(`/admin/setup?error=${encodeURIComponent(errors.join(", "))}`);
    }
    res.redirect("/admin/setup?error=Server error. Please try again.");
  }
});

// Admin login route (public)
app.get("/admin/login", (req, res) => {
  const error = req.query.error;
  const success = req.query.success;
  res.render("admin-login", {
    title: "Admin Login - Edemy",
    error: error || undefined,
    success: success || undefined,
  });
});

// Admin login POST route
app.post("/admin/login", async (req, res) => {
  try {
    console.log("Admin login attempt started");
    const { email, password } = req.body;
    console.log("Email received:", email ? "yes" : "no");

    // Validate input
    if (!email || !password) {
      console.log("Validation failed: missing email or password");
      return res.render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Email and password are required",
        success: undefined,
      });
    }

    console.log("Looking up user in database...");
    const user = await User.findOne({ email });
    console.log("User found:", user ? "yes" : "no");
    
    if (!user) {
      console.log("User not found for email:", email);
      return res.render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Invalid email or password",
        success: undefined,
      });
    }

    // Check if user is admin
    console.log("User role:", user.role);
    if (user.role !== "admin") {
      console.log("User is not admin");
      return res.render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Access denied. Admin privileges required.",
        success: undefined,
      });
    }

    console.log("Checking if user is active...");
    if (!user.isActive) {
      console.log("User account is inactive");
      return res.render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Your account has been deactivated",
        success: undefined,
      });
    }

    console.log("Validating password...");
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Invalid email or password",
        success: undefined,
      });
    }

    console.log("Password validated successfully");

    // Validate JWT_SECRET before generating token
    console.log("Validating JWT_SECRET...");
    console.log("JWT_SECRET exists:", !!JWT_SECRET);
    console.log("JWT_SECRET length:", JWT_SECRET ? JWT_SECRET.length : 0);
    
    if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production" || JWT_SECRET.length < 10) {
      console.error("ERROR: JWT_SECRET is not properly configured!");
      console.error("JWT_SECRET value:", JWT_SECRET ? `"${JWT_SECRET.substring(0, 10)}..." (length: ${JWT_SECRET.length})` : "undefined");
      console.error("NODE_ENV:", process.env.NODE_ENV);
      console.error("process.env.JWT_SECRET exists:", !!process.env.JWT_SECRET);
      return res.status(500).render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Server configuration error. Please contact administrator.",
        success: undefined,
      });
    }

    // Generate JWT token with proper payload
    console.log("Generating JWT token...");
    let token;
    try {
      token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      console.log("JWT token generated successfully");
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError);
      console.error("JWT error stack:", jwtError.stack);
      return res.status(500).render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Authentication error. Please try again.",
        success: undefined,
      });
    }

    // Set token in cookie with secure settings
    console.log("Setting cookie...");
    const isProduction = process.env.NODE_ENV === 'production';
    console.log("Is production:", isProduction);
    
    try {
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: isProduction, // Only use secure cookies in production (HTTPS)
        sameSite: isProduction ? "none" : "lax", // "none" requires secure: true
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      console.log("Cookie set successfully");
    } catch (cookieError) {
      console.error("Error setting cookie:", cookieError);
      throw cookieError;
    }

    // Redirect to admin dashboard
    console.log("Redirecting to /admin...");
    res.redirect("/admin");
    console.log("Redirect sent");
  } catch (error) {
    console.error("=== ADMIN LOGIN ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error at:", new Date().toISOString());
    
    // Return proper error response
    try {
      console.log("Attempting to render error page...");
      return res.status(500).render("admin-login", {
        title: "Admin Login - Edemy",
        error: "Server error. Please try again.",
        success: undefined,
      });
    } catch (renderError) {
      // If rendering fails, send plain text error
      console.error("Failed to render error page:", renderError);
      console.error("Render error stack:", renderError.stack);
      return res.status(500).send("Internal Server Error");
    }
  }
});

// Admin logout route
app.post("/admin/logout", (req, res) => {
  // Clear both admin and regular tokens
  res.clearCookie("adminToken", { path: "/" });
  res.clearCookie("token", { path: "/" });
  res.redirect("/admin/login?success=Logged out successfully");
});

// Protected admin routes
app.get("/admin", authenticateAdmin, async (req, res) => {
  try {
    // Count users excluding admins for display
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
    const totalCourses = await Course.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true, role: { $ne: "admin" } });
    const adminCount = await User.countDocuments({ role: "admin" });

    res.render("admin", {
      title: "Admin Dashboard",
      body: "",
      stats: {
        totalUsers,
        totalCourses,
        activeUsers,
        adminCount,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/admin/users", authenticateAdmin, async (req, res) => {
  try {
    // Get all users except admins (filter out admin role)
    const users = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 });
    
    // Get admin count separately (for stats, but don't show details)
    const adminCount = await User.countDocuments({ role: "admin" });

    res.render("users", {
      title: "User Management - Edemy Admin",
      users: users,
      adminCount: adminCount,
      error: req.query.error,
      success: req.query.success,
    });
  } catch (error) {
    console.error("Users page error:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/admin/courses", authenticateAdmin, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    res.render("courses", {
      title: "Course Management - Edemy Admin",
      courses: courses,
    });
  } catch (error) {
    console.error("Courses page error:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/admin/quizzes", authenticateAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    const courses = await Course.find().select("_id title").sort({ title: 1 });

    res.render("quizzes", {
      title: "Quiz Management - Edemy Admin",
      quizzes: quizzes,
      courses: courses,
    });
  } catch (error) {
    console.error("Quizzes page error:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/admin/courses/:courseId/quizzes", authenticateAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const quizzes = await Quiz.find({ courseId: req.params.courseId }).sort({
      createdAt: -1,
    });

    res.render("course-quizzes", {
      title: `${course.title} - Quiz Management - Edemy Admin`,
      course: course,
      quizzes: quizzes,
    });
  } catch (error) {
    console.error("Course quizzes page error:", error);
    res.status(500).send("Server Error");
  }
});

// Update user role route
app.post("/admin/users/:userId/role", authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["student", "instructor"].includes(role)) {
      return res.redirect("/admin/users?error=Invalid role. Cannot change to admin role.");
    }

    // Prevent changing admin roles through this route
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/admin/users?error=User not found.");
    }

    if (user.role === "admin") {
      return res.redirect("/admin/users?error=Cannot change admin role through this interface.");
    }

    // Update user role
    user.role = role;
    await user.save();

    res.redirect("/admin/users?success=User role updated successfully.");
  } catch (error) {
    console.error("Update user role error:", error);
    res.redirect("/admin/users?error=Failed to update user role.");
  }
});

// Initialize Socket.IO
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  console.error("Error: FRONTEND_URL is required in environment variables. Please check your .env file.");
  process.exit(1);
}

// Socket.IO CORS configuration - handle multiple origins
const socketCorsOrigin = FRONTEND_URL.includes(',')
  ? FRONTEND_URL.split(',').map(url => url.trim())
  : FRONTEND_URL;

const io = new Server(server, {
  cors: {
    origin: socketCorsOrigin, // React app URL(s) from environment variable
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Quiz session management - track individual student sessions
const studentSessions = new Map(); // Map<socketId, { quizId, timerInterval, timeLeft, startTime }>
const quizRooms = new Map(); // Map<quizId, Set<socketId>> - track participants per quiz

// Helper function to get quiz room name
const getQuizRoom = (quizId) => `quiz:${quizId}`;

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle student joining a quiz
  socket.on("join_quiz", async (quizId) => {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        socket.emit("error", { message: "Quiz not found" });
        return;
      }

      // Join the quiz room
      socket.join(getQuizRoom(quizId));
      console.log(`Socket ${socket.id} joined quiz room: ${getQuizRoom(quizId)}`);

      // Track participant in quiz room
      if (!quizRooms.has(quizId)) {
        quizRooms.set(quizId, new Set());
      }
      quizRooms.get(quizId).add(socket.id);

      // Initialize student session (not started yet)
      const timeLimitSeconds = quiz.timeLimit * 60;
      studentSessions.set(socket.id, {
        quizId: quizId,
        timeLeft: timeLimitSeconds,
        startTime: null,
        timerInterval: null,
        isRunning: false,
      });

      // Send initial timer state to the newly joined user
      socket.emit("timer_update", {
        timeLeft: timeLimitSeconds,
        isRunning: false,
      });

      // Notify other participants
      const participantCount = quizRooms.get(quizId).size;
      socket.to(getQuizRoom(quizId)).emit("participant_joined", {
        participantCount: participantCount,
      });
    } catch (error) {
      console.error("Error joining quiz:", error);
      socket.emit("error", { message: "Failed to join quiz" });
    }
  });

  // Handle quiz start
  socket.on("start_quiz", async (quizId) => {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        socket.emit("error", { message: "Quiz not found" });
        return;
      }

      const session = studentSessions.get(socket.id);
      if (!session || session.quizId !== quizId) {
        socket.emit("error", { message: "Quiz session not found. Please join the quiz first." });
        return;
      }

      // Only start if not already running for this student
      if (!session.isRunning) {
        session.isRunning = true;
        session.startTime = Date.now();
        const timeLimitSeconds = quiz.timeLimit * 60;
        session.timeLeft = timeLimitSeconds;

        // Start timer interval for this specific student
        session.timerInterval = setInterval(() => {
          const currentSession = studentSessions.get(socket.id);
          if (!currentSession || !currentSession.isRunning) {
            if (currentSession && currentSession.timerInterval) {
              clearInterval(currentSession.timerInterval);
              currentSession.timerInterval = null;
            }
            return;
          }

          // Check if time is already up before decrementing
          if (currentSession.timeLeft <= 0) {
            clearInterval(currentSession.timerInterval);
            currentSession.isRunning = false;
            currentSession.timerInterval = null;

            // Send final timer update
            socket.emit("timer_update", {
              timeLeft: 0,
              isRunning: false,
            });

            // Emit auto-submit event to this student
            socket.emit("auto_submit", {
              message: "Time's up! Quiz will be submitted automatically.",
              quizId: quizId,
            });

            console.log(`Auto-submitting quiz ${quizId} for socket ${socket.id}`);
            return;
          }

          currentSession.timeLeft -= 1;

          // Send timer update to this specific student
          socket.emit("timer_update", {
            timeLeft: currentSession.timeLeft,
            isRunning: true,
          });

          // Auto-submit when time runs out (double check after decrement)
          if (currentSession.timeLeft <= 0) {
            clearInterval(currentSession.timerInterval);
            currentSession.isRunning = false;
            currentSession.timerInterval = null;

            // Send final timer update
            socket.emit("timer_update", {
              timeLeft: 0,
              isRunning: false,
            });

            // Emit auto-submit event to this student
            socket.emit("auto_submit", {
              message: "Time's up! Quiz will be submitted automatically.",
              quizId: quizId,
            });

            console.log(`Auto-submitting quiz ${quizId} for socket ${socket.id}`);
          }
        }, 1000);

        console.log(`Quiz ${quizId} timer started for socket ${socket.id}`);
      }

      // Send confirmation
      socket.emit("quiz_started", {
        timeLeft: session.timeLeft,
        startTime: session.startTime,
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      socket.emit("error", { message: "Failed to start quiz" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Clean up student session
    const session = studentSessions.get(socket.id);
    if (session) {
      // Clear timer if running
      if (session.timerInterval) {
        clearInterval(session.timerInterval);
      }

      // Remove from quiz room
      if (quizRooms.has(session.quizId)) {
        quizRooms.get(session.quizId).delete(socket.id);
        const participantCount = quizRooms.get(session.quizId).size;

        // Notify remaining participants
        if (participantCount > 0) {
          io.to(getQuizRoom(session.quizId)).emit("participant_left", {
            participantCount: participantCount,
          });
        } else {
          // Clean up empty quiz room
          quizRooms.delete(session.quizId);
        }
      }

      // Remove student session
      studentSessions.delete(socket.id);
      console.log(`Cleaned up session for socket ${socket.id}`);
    }
  });

  // Handle leaving quiz (explicit leave)
  socket.on("leave_quiz", (quizId) => {
    socket.leave(getQuizRoom(quizId));

    // Clean up student session
    const session = studentSessions.get(socket.id);
    if (session) {
      if (session.timerInterval) {
        clearInterval(session.timerInterval);
      }
      studentSessions.delete(socket.id);
    }

    // Remove from quiz room
    if (quizRooms.has(quizId)) {
      quizRooms.get(quizId).delete(socket.id);
      if (quizRooms.get(quizId).size === 0) {
        quizRooms.delete(quizId);
      }
    }

    console.log(`Socket ${socket.id} left quiz room: ${getQuizRoom(quizId)}`);
  });
});

const PORT = process.env.PORT;
if (!PORT) {
  console.error("Error: PORT is required in environment variables. Please check your .env file.");
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
});
