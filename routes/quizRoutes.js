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

/**
 * ==========================================
 * LIVE QUIZ CREATION ROUTES (/api/quizzes)
 * ==========================================
 * These routes are used by TEACHERS to create and manage custom Live Quizzes.
 */

// ==========================================
// PUBLIC / STUDENT ROUTES
// ==========================================
router.get("/", getAllQuizzes); // List all available published quizzes
router.get("/:id", getQuizById); // Get details of a specific quiz

// ==========================================
// TEACHER-ONLY ROUTES (Requires Auth)
// ==========================================
router.get("/my-quizzes", protect, getMyQuizzes); // See a list of quizzes I have created
router.post("/", protect, createNewQuiz); // Create a brand new quiz
router.put("/:id", protect, updateQuiz); // Update settings (duration, questions) of a quiz
router.delete("/:id", protect, deleteQuiz); // Delete a quiz entirely
router.patch("/:id/publish", protect, toggleQuizPublish); // Toggle whether students can see this quiz
router.post("/:id/generate-link", protect, generateQuizLink); // Creates the unique /live/:link URL for students to join

module.exports = router;
