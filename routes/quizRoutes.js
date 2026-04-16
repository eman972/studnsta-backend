const express = require("express");
const router = express.Router();
const {
  createQuiz: createNewQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getMyQuizzes,
  toggleQuizPublish,
} = require("../controllers/quizController");
const { createQuiz: createQuizFromIds, generateQuizLink } = require("../controllers/quizCreationController");
const protect = require("../middleware/authMiddleware");

// Public quiz routes (for students to view available quizzes)
router.get("/", getAllQuizzes);
router.get("/my-quizzes", protect, getMyQuizzes); // Teachers only
router.get("/:id", getQuizById);

// Teacher-only routes
router.post("/", protect, createNewQuiz); // Create quiz
router.put("/:id", protect, updateQuiz); // Update quiz
router.delete("/:id", protect, deleteQuiz); // Delete quiz
router.patch("/:id/publish", protect, toggleQuizPublish); // Publish/Unpublish quiz
router.post("/:id/generate-link", protect, generateQuizLink); // Generate unique quiz link

module.exports = router;
