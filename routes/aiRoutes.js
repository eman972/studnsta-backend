const express = require("express");
const router = express.Router();
const { chat, getModels } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");

// POST /api/ai/chat  — send a message to the AI tutor
router.post("/chat", protect, chat);

// GET /api/ai/models  — list available Groq models
router.get("/models", getModels);

module.exports = router;
