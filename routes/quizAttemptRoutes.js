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

/**
 * ==========================================
 * QUIZ ATTEMPT ROUTES (/api/quiz-attempts)
 * ==========================================
 * These routes track a student's active session while they are taking a Quiz.
 * It allows saving progress mid-quiz and submitting the final attempt.
 */

// ==========================================
// STUDENT ROUTES (Taking the quiz)
// ==========================================
router.post("/quiz/:quizId/start", protect, startQuizAttempt); // Initialize a new attempt (starts the timer)
router.post("/:attemptId/submit", protect, submitQuizAttempt); // Finish and grade the attempt
router.post("/:attemptId/save-progress", protect, saveProgress); // Auto-save answers so they don't lose progress if browser closes
router.get("/my-attempts", protect, getUserAttempts); // Look at past attempts
router.get("/:attemptId", protect, getAttemptById); // Look at a specific past attempt

// ==========================================
// TEACHER ROUTES (Reviewing attempts)
// ==========================================
router.get("/quiz/:quizId/attempts", protect, getQuizAttempts); // See everyone who took a specific quiz
router.get("/quiz/:quizId/statistics", protect, getQuizStatistics); // Get averages/stats for a quiz

module.exports = router;
