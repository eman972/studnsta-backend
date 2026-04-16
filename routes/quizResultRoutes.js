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

// Public routes (for students to view their results)
router.get("/", getAllQuizResults); // With filters (admin/teacher access)
router.get("/my-results", protect, getMyQuizResults); // Current user's results
router.get("/top-scores", getTopScores); // Leaderboard
router.get("/performance-overview", protect, getUserPerformanceOverview); // Current user's performance
router.get("/:id", protect, getQuizResultById); // Specific result details

// Student-specific routes
router.get("/student/:studentId", protect, getStudentQuizResults); // Student's results (with access control)
router.get("/student/:studentId/subject/:subject/stats", protect, getStudentSubjectStats); // Student's subject statistics

// Quiz result management routes
router.post("/", createQuizResult); // Create quiz result
router.put("/:id", updateQuizResult); // Update quiz result
router.delete("/:id", deleteQuizResult); // Delete quiz result

module.exports = router;
