const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimiters");
const ai = require("../controllers/aiController");

router.post("/chat", protect, aiLimiter, ai.chat);
router.post("/chat-with-notes", protect, aiLimiter, ai.chatWithNotes);
router.post("/explain-wrong", protect, aiLimiter, ai.explainWrong);
router.post("/generate-flashcards", protect, aiLimiter, ai.generateFlashcards);
router.post("/generate-quiz", protect, aiLimiter, ai.generateQuiz);
router.get("/daily-coach", protect, aiLimiter, ai.dailyCoach);
router.post("/teacher-assist", protect, aiLimiter, ai.teacherAssist);
router.get("/chats", protect, ai.listChats);
router.get("/chats/:id", protect, ai.getChat);
router.get("/models", protect, ai.getModels);

module.exports = router;
