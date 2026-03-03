const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET?.trim();

// Validate JWT_SECRET
if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not set in adminAuth middleware!");
  throw new Error("JWT_SECRET is required but not set in environment variables");
}

// Middleware to authenticate admin users for EJS routes
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from cookie (prefer adminToken, fallback to token)
    const token = req.cookies.adminToken || req.cookies.token;

    if (!token) {
      // Redirect to admin login if no token
      return res.redirect("/admin/login?error=Please login to access admin panel");
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) ;
    } catch (jwtError) {
      // Clear invalid token
      res.clearCookie("adminToken", { path: "/" });
      res.clearCookie("token", { path: "/" });
      
      if (jwtError.name === "JsonWebTokenError") {
        return res.redirect("/admin/login?error=invalid_token");
      }
      if (jwtError.name === "TokenExpiredError") {
        return res.redirect("/admin/login?error=token_expired");
      }
      return res.redirect("/admin/login?error=auth_error");
    }

    // Validate decoded token has required fields
    if (!decoded.userId || !decoded.role) {
      res.clearCookie("adminToken", { path: "/" });
      res.clearCookie("token", { path: "/" });
      return res.redirect("/admin/login?error=invalid_token");
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      // Clear invalid token and redirect
      res.clearCookie("adminToken", { path: "/" });
      res.clearCookie("token", { path: "/" });
      return res.redirect("/admin/login?error=User not found. Please login again.");
    }

    // Check if user is admin
    if (user.role !== "admin") {
      res.clearCookie("adminToken", { path: "/" });
      res.clearCookie("token", { path: "/" });
      return res.status(403).send(`
        <html>
          <head>
            <title>Access Denied</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          </head>
          <body class="bg-gray-100 flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
              <h1 class="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p class="text-gray-700 mb-6">You do not have permission to access the admin panel.</p>
              <a href="/" class="text-blue-600 hover:underline">Go to Home</a>
            </div>
          </body>
        </html>
      `);
    }

    // Check if user account is active
    if (!user.isActive) {
      res.clearCookie("adminToken", { path: "/" });
      res.clearCookie("token", { path: "/" });
      return res.status(403).send(`
        <html>
          <head>
            <title>Account Inactive</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          </head>
          <body class="bg-gray-100 flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
              <h1 class="text-2xl font-bold text-red-600 mb-4">Account Inactive</h1>
              <p class="text-gray-700 mb-6">Your account has been deactivated.</p>
              <a href="/" class="text-blue-600 hover:underline">Go to Home</a>
            </div>
          </body>
        </html>
      `);
    }

    // Verify token role matches user role (extra security check)
    if (decoded.role !== user.role) {
      res.clearCookie("adminToken", { path: "/" });
      res.clearCookie("token", { path: "/" });
      return res.redirect("/admin/login?error=Token role mismatch. Please login again.");
    }

    // Attach user to request object for use in routes
    req.adminUser = user;
    next();
  } catch (error) {
    // Clear invalid token
    res.clearCookie("adminToken", { path: "/" });
    res.clearCookie("token", { path: "/" });

    console.error("Admin auth middleware error:", error);
    return res.redirect("/admin/login?error=auth_error");
  }
};

module.exports = {
  authenticateAdmin,
};
