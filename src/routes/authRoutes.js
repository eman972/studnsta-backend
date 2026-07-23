const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

router.post("/register", authLimiter, auth.registerUser);
router.post("/login", authLimiter, auth.loginUser);
router.post("/refresh", authLimiter, auth.refreshToken);

router.get("/me", protect, auth.getMe);
router.post("/logout", protect, auth.logout);
router.get("/sessions", protect, auth.listSessions);
router.delete("/sessions/:index", protect, auth.revokeSession);
router.delete("/sessions", protect, auth.revokeAllSessions);

module.exports = router;
