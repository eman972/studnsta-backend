const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

/**
 * ==========================================
 * AUTHENTICATION ROUTES (/api/auth)
 * ==========================================
 * These routes handle user onboarding and login.
 * They map a specific URL to a controller function that actually does the work.
 */

// POST /api/auth/register -> Creates a new user account
router.post("/register", registerUser);

// POST /api/auth/login -> Verifies credentials and returns a JWT token
router.post("/login", loginUser);

// GET /api/auth/me -> Returns current user profile
router.get("/me", protect, getMe);

module.exports = router;