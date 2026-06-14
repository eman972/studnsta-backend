const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getTopicsBySubject,
  getQuestions,
  saveQuizResult,
  getQuizHistory,
  getQuizStatistics,
} = require("../controllers/quizApiController");
const protect = require("../middleware/authMiddleware");

// 1. GET /api/quiz/subjects - Get unique subjects
router.get("/subjects", getSubjects);

// 2. GET /api/quiz/topics/:subject - Get topics by subject
router.get("/topics/:subject", getTopicsBySubject);

// 3. GET /api/quiz/questions - Get random questions
router.get("/questions", getQuestions);

// 4. POST /api/quiz/result - Save quiz result
router.post("/result", protect, saveQuizResult);

// 5. GET /api/quiz/history - Get user's quiz history
router.get("/history", protect, getQuizHistory);

// 6. GET /api/quiz/statistics/:userId - Get user's quiz statistics
router.get("/statistics/:userId", protect, getQuizStatistics);

module.exports = router;
