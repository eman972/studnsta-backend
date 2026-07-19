const express = require("express");
const router = express.Router();
const {
  createQuizResult,
  getAllQuizResults,
  getQuizResultById,
  getStudentQuizResults,
  getMyQuizResults,
  updateQuizResult,
  deleteQuizResult,
  getTopScores,
  getStudentSubjectStats,
  getUserPerformanceOverview,
} = require("../controllers/quizResultController");
const protect = require("../middleware/authMiddleware");

/**
 * ==========================================
 * QUIZ RESULT ROUTES (/api/quiz-results)
 * ==========================================
 * These routes handle fetching and managing finalized quiz scores.
 * These power the charts and metrics on the Progress Dashboard.
 */

// ==========================================
// PUBLIC & DASHBOARD ROUTES
// ==========================================
router.get("/", getAllQuizResults); // Admin/teacher can view all
router.get("/my-results", protect, getMyQuizResults); // Fetch logged-in user's history
router.get("/top-scores", getTopScores); // Power a leaderboard component
router.get("/performance-overview", protect, getUserPerformanceOverview); // Gets high-level summary (total quizzes taken, avg score)
router.get("/:id", protect, getQuizResultById); // Get deep details (which questions they got wrong) on a specific result

// ==========================================
// STUDENT-SPECIFIC ANALYTICS ROUTES
// ==========================================
router.get("/student/:studentId", protect, getStudentQuizResults); // Used by teachers to see a specific student's history
router.get("/student/:studentId/subject/:subject/stats", protect, getStudentSubjectStats); // Data for the subject-specific chart

// ==========================================
// MANAGEMENT ROUTES (Internal/System use)
// ==========================================
router.post("/", createQuizResult); 
router.put("/:id", updateQuizResult); 
router.delete("/:id", deleteQuizResult); 

module.exports = router;
