const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimiters");
const ai = require("../controllers/aiController");

router.post("/chat", protect, aiLimiter, ai.chat);
router.post("/explain-wrong", protect, aiLimiter, ai.explainWrong);

router.get("/models", protect, ai.getModels);

module.exports = router;
