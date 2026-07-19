const express = require("express");
const router = express.Router();
const { chat, getModels } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");

/**
 * ==========================================
 * AI TUTOR ROUTES (/api/ai)
 * ==========================================
 * Connects the frontend chat interface to our AI controller, 
 * which in turn talks to the Groq LLM API.
 */

// POST /api/ai/chat -> Sends user prompt and conversation history to the AI, gets response back
router.post("/chat", protect, chat);

// GET /api/ai/models -> Lists which AI models (like LLaMA) are available to use via Groq
router.get("/models", getModels);

module.exports = router;
