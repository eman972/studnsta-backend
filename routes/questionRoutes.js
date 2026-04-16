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

// Public question routes (for viewing questions)
router.get("/", getAllQuestions);
router.get("/my-questions", protect, getMyQuestions); // User's own questions
router.get("/random", getRandomQuestions); // Random questions for quizzes
router.get("/subject/:subject/topic/:topic", getQuestionsBySubjectAndTopic);
router.get("/:id", getQuestionById);

// Question management routes
router.post("/", protect, createQuestion); // Create question
router.put("/:id", protect, updateQuestion); // Update question
router.delete("/:id", protect, deleteQuestion); // Delete question
router.post("/:id/increment-usage", incrementUsage); // Increment usage count

module.exports = router;
