const express = require("express");
const router = express.Router();
const {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySubjectAndTopic,
  getRandomQuestions,
  getMyQuestions,
  incrementUsage,
} = require("../controllers/questionController");
const protect = require("../middleware/authMiddleware");

/**
 * ==========================================
 * QUESTION BANK ROUTES (/api/questions)
 * ==========================================
 * These routes manage the global pool of multiple-choice questions.
 * Teachers use these to add new questions to the database.
 */

// ==========================================
// PUBLIC / GENERAL ROUTES
// ==========================================
router.get("/", getAllQuestions); // Fetch all available questions
router.get("/random", getRandomQuestions); // Gets a random sample of questions for practice quizzes
router.get("/subject/:subject/topic/:topic", getQuestionsBySubjectAndTopic); // Filter questions
router.get("/:id", getQuestionById);

// ==========================================
// PROTECTED / TEACHER ROUTES (Requires Login)
// ==========================================
router.get("/my-questions", protect, getMyQuestions); // Gets only the questions the logged-in teacher created
router.post("/", protect, createQuestion); // Add a new question to the database
router.put("/:id", protect, updateQuestion); // Edit an existing question
router.delete("/:id", protect, deleteQuestion); // Remove a question

// Increment usage count (usually called when a question is included in a live quiz)
router.post("/:id/increment-usage", incrementUsage); 

module.exports = router;
