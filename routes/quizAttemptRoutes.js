const express = require("express");
const router = express.Router();
const {
  startQuizAttempt,
  submitQuizAttempt,
  getAttemptById,
  getUserAttempts,
  getQuizAttempts,
  getQuizStatistics,
  saveProgress,
} = require("../controllers/quizAttemptController");
const protect = require("../middleware/authMiddleware");

// Student routes
router.post("/quiz/:quizId/start", protect, startQuizAttempt); // Start a quiz attempt
router.post("/:attemptId/submit", protect, submitQuizAttempt); // Submit completed quiz
router.post("/:attemptId/save-progress", protect, saveProgress); // Auto-save progress
router.get("/my-attempts", protect, getUserAttempts); // Get current user's attempts
router.get("/:attemptId", protect, getAttemptById); // Get specific attempt details

// Teacher routes
router.get("/quiz/:quizId/attempts", protect, getQuizAttempts); // Get all attempts for a quiz
router.get("/quiz/:quizId/statistics", protect, getQuizStatistics); // Get quiz statistics

module.exports = router;
