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

// Apply authentication middleware to all routes
router.use(protect);

// Teacher-only routes for creating and managing live quizzes
router.post("/create", createLiveQuiz);
router.get("/teacher/my-quizzes", getTeacherLiveQuizzes);
router.put("/:id/settings", updateLiveQuizSettings);
router.get("/:id/results", getLiveQuizResults);

// Student routes for taking live quizzes
router.get("/:id", getLiveQuizById);
router.post("/:id/submit", submitLiveQuizResults);

module.exports = router;
