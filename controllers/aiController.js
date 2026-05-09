const Groq = require("groq-sdk");

// Supported models in priority order (fallback chain)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile", // Primary: best quality
  "llama-3.1-8b-instant", // Fallback 1: fast & free
  "gemma2-9b-it", // Fallback 2: Google Gemma
];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Studnsta AI, a helpful academic tutor for Pakistani students (Matric, Intermediate, and university level).
You help with subjects like Math, Physics, Chemistry, Biology, Computer Science, English, Urdu, Pak Studies, and Islamiat.
Keep answers clear, concise, and educational. When solving problems, show step-by-step working.
Use simple language appropriate for Pakistani curriculum (FBISE, Punjab Board, Sindh Board, etc.).
If asked something unrelated to academics, politely redirect to studies.`;

/**
 * Try Groq chat completion with model fallback support.
 */
const tryGroqCompletion = async (messages, modelIndex = 0) => {
  if (modelIndex >= GROQ_MODELS.length) {
    throw new Error(
      "All Groq models are currently unavailable. Please try again later.",
    );
  }

  const model = GROQ_MODELS[modelIndex];

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    });

    return {
      reply:
        completion.choices[0]?.message?.content ||
        "Sorry, I could not generate a response.",
      modelUsed: model,
    };
  } catch (error) {
    const isModelError =
      error?.status === 400 &&
      (error?.message?.includes("decommissioned") ||
        error?.message?.includes("not supported") ||
        error?.message?.includes("does not exist"));

    if (isModelError) {
      console.warn(`[AI] Model "${model}" unavailable, trying fallback...`);
      return tryGroqCompletion(messages, modelIndex + 1);
    }

    throw error;
  }
};

// POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    // Sanitise: only allow role/content pairs
    const sanitised = messages
      .filter((m) => m && ["user", "assistant"].includes(m.role) && m.content)
      .map(({ role, content }) => ({
        role,
        content: String(content).slice(0, 4000),
      }));

    if (sanitised.length === 0) {
      return res.status(400).json({ message: "No valid messages provided" });
    }

    const { reply, modelUsed } = await tryGroqCompletion(sanitised);

    res.json({ reply, model: modelUsed });
  } catch (error) {
    console.error("Groq error:", error.message);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
};

// GET /api/ai/models  (utility – lists available models)
exports.getModels = (_req, res) => {
  res.json({ models: GROQ_MODELS, primary: GROQ_MODELS[0] });
};
