const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT Secret - In production, use environment variable
// Trim whitespace in case there are any spaces
const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : "your-secret-key-change-in-production";

// Debug logging (only log first few characters for security)
if (JWT_SECRET && JWT_SECRET !== "your-secret-key-change-in-production") {
  console.log(`JWT_SECRET loaded successfully (length: ${JWT_SECRET.length}, starts with: ${JWT_SECRET.substring(0, 4)}...)`);
} else {
  console.warn("WARNING: JWT_SECRET is using default value or not set!");
  console.warn("Current NODE_ENV:", process.env.NODE_ENV);
  console.warn("JWT_SECRET from env:", process.env.JWT_SECRET ? "SET (but may be empty)" : "NOT SET");
}

// Validate JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production" || JWT_SECRET.length < 10)) {
  console.error("ERROR: JWT_SECRET must be set in production environment variables!");
  console.error("Please set JWT_SECRET in your Render environment variables.");
  console.error("Current JWT_SECRET value:", JWT_SECRET ? `"${JWT_SECRET.substring(0, 10)}..." (length: ${JWT_SECRET.length})` : "undefined");
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};

// Optional middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET,
};
