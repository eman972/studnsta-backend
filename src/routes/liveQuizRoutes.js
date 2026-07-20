const express = require("express");
const router = express.Router();
const {
  createLiveQuiz,
  getLiveQuizById,
  submitLiveQuizResults,
  getLiveQuizResults,
  getTeacherLiveQuizzes,
  updateLiveQuizSettings,
} = require("../controllers/liveQuizController");
const protect = require("../middleware/authMiddleware");

/**
 * ==========================================
 * LIVE QUIZ ROUTES (/api/live-quizzes)
 * ==========================================
 * These routes manage the real-time or timed "Live Quizzes" that teachers
 * assign to students via a unique link.
 */

// Apply authentication middleware to all routes in this file (must be logged in)
router.use(protect);

// ==========================================
// TEACHER-ONLY ROUTES
// ==========================================
// These handle creating and managing the live quizzes
router.post("/create", createLiveQuiz); // Setup a new live quiz
router.get("/teacher/my-quizzes", getTeacherLiveQuizzes); // List teacher's created quizzes
router.put("/:id/settings", updateLiveQuizSettings); // Update timer, etc.
router.get("/:id/results", getLiveQuizResults); // See all student scores for a specific quiz

// ==========================================
// STUDENT ROUTES
// ==========================================
// These handle a student actually taking the quiz
router.get("/:id", getLiveQuizById); // Get the quiz questions to start taking it
router.post("/:id/submit", submitLiveQuizResults); // Submit final answers to get graded

module.exports = router;
