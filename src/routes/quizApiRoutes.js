const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getTopicsBySubject,
  getQuestions,
  saveQuizResult,
  getQuizHistory,
  getQuizStatistics,
  getLeaderboard,
} = require("../controllers/quizApiController");
const protect = require("../middleware/authMiddleware");

/**
 * ==========================================
 * PRACTICE QUIZ ROUTES (/api/quiz)
 * ==========================================
 * These routes power the self-paced "Practice Quiz" feature and the student's
 * Progress Dashboard. Note the difference: /api/quizzes (plural) is for Teacher Live Quizzes.
 */

// 1. GET /api/quiz/subjects -> Look at all questions in the DB and return a unique list of subjects
router.get("/subjects", getSubjects);

// 2. GET /api/quiz/topics/:subject -> Get all specific topics under a chosen subject
router.get("/topics/:subject", getTopicsBySubject);

// 3. GET /api/quiz/questions -> Fetch X random questions for the student to practice
router.get("/questions", getQuestions);

// 4. POST /api/quiz/result -> Student finished practicing. Save their score/time to QuizResult collection.
router.post("/result", protect, saveQuizResult);

// 5. GET /api/quiz/history -> Fetch all past practice results for the logged-in student
router.get("/history/:userId", protect, getQuizHistory);

// 6. GET /api/quiz/statistics/:userId -> Get aggregated data (avg score, streaks) for the Progress Dashboard Charts
router.get("/statistics/:userId", protect, getQuizStatistics);

// 7. GET /api/quiz/leaderboard -> Get global top 10 students
router.get("/leaderboard", protect, getLeaderboard);

module.exports = router;
