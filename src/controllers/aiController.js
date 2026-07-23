const Groq = require("groq-sdk");
const User = require("../models/user");
const AiChat = require("../models/AiChat");
const Note = require("../models/Note");

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BASE_PROMPT = `You are Studnsta AI, a smart and supportive learning assistant.
Provide clear, accurate explanations. Be concise and educational.
Never provide harmful content, cheating for live exams, or disallowed material.`;

const SUBJECT_PROMPTS = {
  math: "Focus on step-by-step math reasoning and show formulas clearly.",
  writing: "Focus on structure, clarity, thesis, and constructive writing feedback.",
  default: "",
};

const UNSAFE = /\b(bomb|make a weapon|kill yourself)\b/i;

const tryGroqCompletion = async (messages, systemPrompt, modelIndex = 0) => {
  if (modelIndex >= GROQ_MODELS.length) {
    throw new Error("All Groq models are currently unavailable.");
  }
  const model = GROQ_MODELS[modelIndex];
  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return {
      reply: completion.choices[0]?.message?.content || "No response.",
      modelUsed: model,
    };
  } catch (error) {
    const isModelError =
      error?.status === 400 &&
      (error?.message?.includes("decommissioned") ||
        error?.message?.includes("not supported") ||
        error?.message?.includes("does not exist"));
    if (isModelError) return tryGroqCompletion(messages, systemPrompt, modelIndex + 1);
    throw error;
  }
};

async function checkQuota(user) {
  const limit =
    user.role === "teacher" ? 200 : 50;
  const now = new Date();
  if (!user.aiQuotaResetAt || user.aiQuotaResetAt < now) {
    user.aiQuotaUsed = 0;
    user.aiQuotaResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  if ((user.aiQuotaUsed || 0) >= limit) {
    return { ok: false, limit };
  }
  user.aiQuotaUsed = (user.aiQuotaUsed || 0) + 1;
  await user.save();
  return { ok: true, limit, used: user.aiQuotaUsed };
}

function safetyFilter(text) {
  if (UNSAFE.test(text)) {
    return "I can't help with that request. Let's focus on safe academic topics.";
  }
  return text;
}

exports.chat = async (req, res) => {
  try {
    const { messages, subject, chatId, persist } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    const user = await User.findById(req.user.id);
    const quota = await checkQuota(user);
    if (!quota.ok) {
      return res.status(429).json({
        message: "AI daily quota exceeded",
        limit: quota.limit,
      });
    }

    const sanitised = messages
      .filter((m) => m && ["user", "assistant"].includes(m.role) && m.content)
      .map(({ role, content }) => ({
        role,
        content: String(content).slice(0, 4000),
      }));

    const subjectKey = (subject || "").toLowerCase();
    const systemPrompt = `${BASE_PROMPT}\n${SUBJECT_PROMPTS[subjectKey] || SUBJECT_PROMPTS.default}`;

    const { reply, modelUsed } = await tryGroqCompletion(sanitised, systemPrompt);
    const safeReply = safetyFilter(reply);

    let chat = null;
    if (persist !== false) {
      if (chatId) {
        chat = await AiChat.findOne({ _id: chatId, user: req.user.id });
      }
      if (!chat) {
        chat = await AiChat.create({
          user: req.user.id,
          subject: subject || "",
          messages: [],
        });
      }
      const lastUser = sanitised[sanitised.length - 1];
      chat.messages.push(lastUser);
      chat.messages.push({ role: "assistant", content: safeReply });
      await chat.save();
    }

    res.json({
      reply: safeReply,
      model: modelUsed,
      chatId: chat?._id,
      quota: { used: quota.used, limit: quota.limit },
    });
  } catch (error) {
    console.error("Groq error:", error.message);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
};

/** Feature 78: RAG over notes (simple keyword extract) */
exports.chatWithNotes = async (req, res) => {
  try {
    const { question, noteIds } = req.body;
    const user = await User.findById(req.user.id);
    const quota = await checkQuota(user);
    if (!quota.ok) return res.status(429).json({ message: "AI quota exceeded" });

    const notes = await Note.find({
      _id: { $in: noteIds || [] },
      isDeleted: { $ne: true },
    }).limit(5);

    const context = notes
      .map((n) => `Title: ${n.title}\nSubject: ${n.subject}\nDesc: ${n.description}`)
      .join("\n---\n");

    const messages = [
      {
        role: "user",
        content: `Use this note context to answer:\n${context}\n\nQuestion: ${question}`,
      },
    ];
    const { reply, modelUsed } = await tryGroqCompletion(messages, BASE_PROMPT);
    res.json({ reply: safetyFilter(reply), model: modelUsed, notesUsed: notes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 79: explain wrong answer */
exports.explainWrong = async (req, res) => {
  try {
    const { question, correctAnswer, userAnswer, explanation } = req.body;
    const user = await User.findById(req.user.id);
    const quota = await checkQuota(user);
    if (!quota.ok) return res.status(429).json({ message: "AI quota exceeded" });

    const messages = [
      {
        role: "user",
        content: `Question: ${question}\nStudent answered: ${userAnswer}\nCorrect: ${correctAnswer}\nExisting explanation: ${explanation || "none"}\nExplain why the student is wrong and how to think correctly.`,
      },
    ];
    const { reply, modelUsed } = await tryGroqCompletion(messages, BASE_PROMPT);
    res.json({ reply: safetyFilter(reply), model: modelUsed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateFlashcards = async (req, res) => {
  try {
    const { text, count = 5 } = req.body;
    const user = await User.findById(req.user.id);
    const quota = await checkQuota(user);
    if (!quota.ok) return res.status(429).json({ message: "AI quota exceeded" });
    const messages = [
      {
        role: "user",
        content: `Create ${count} flashcards as JSON array [{front,back}] from:\n${String(text).slice(0, 6000)}`,
      },
    ];
    const { reply, modelUsed } = await tryGroqCompletion(messages, BASE_PROMPT);
    let cards = [];
    try {
      const match = reply.match(/\[[\s\S]*\]/);
      cards = match ? JSON.parse(match[0]) : [];
    } catch {
      cards = [];
    }
    res.json({ cards, raw: reply, model: modelUsed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { text, count = 5 } = req.body;
    const user = await User.findById(req.user.id);
    const quota = await checkQuota(user);
    if (!quota.ok) return res.status(429).json({ message: "AI quota exceeded" });
    const messages = [
      {
        role: "user",
        content: `Create ${count} MCQ questions as JSON array [{question,options[4],correctAnswer,explanation}] from:\n${String(text).slice(0, 6000)}. Mark status pending for teacher approval.`,
      },
    ];
    const { reply, modelUsed } = await tryGroqCompletion(messages, BASE_PROMPT);
    let questions = [];
    try {
      const match = reply.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    } catch {
      questions = [];
    }
    res.json({ questions, model: modelUsed, requiresApproval: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dailyCoach = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const quota = await checkQuota(user);
    if (!quota.ok) return res.status(429).json({ message: "AI quota exceeded" });
    const messages = [
      {
        role: "user",
        content: `Create a short daily study coach message. Streak: ${user.dailyStreak}. Goals: ${(user.learningGoals || []).join(", ") || "general improvement"}. Style: ${user.learningStyle}.`,
      },
    ];
    const { reply, modelUsed } = await tryGroqCompletion(messages, BASE_PROMPT);
    res.json({ reply: safetyFilter(reply), model: modelUsed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.teacherAssist = async (req, res) => {
  try {
    const { task, context } = req.body;
    const user = await User.findById(req.user.id);
    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }
    const quota = await checkQuota(user);
    if (!quota.ok) return res.status(429).json({ message: "AI quota exceeded" });
    const messages = [
      {
        role: "user",
        content: `Teacher assistant task: ${task}\nContext: ${context || ""}`,
      },
    ];
    const { reply, modelUsed } = await tryGroqCompletion(messages, BASE_PROMPT);
    res.json({ reply: safetyFilter(reply), model: modelUsed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listChats = async (req, res) => {
  const chats = await AiChat.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .select("title subject updatedAt messages")
    .limit(20);
  res.json({
    chats: chats.map((c) => ({
      id: c._id,
      title: c.title,
      subject: c.subject,
      updatedAt: c.updatedAt,
      preview: c.messages[c.messages.length - 1]?.content?.slice(0, 80),
    })),
  });
};

exports.getChat = async (req, res) => {
  const chat = await AiChat.findOne({ _id: req.params.id, user: req.user.id });
  if (!chat) return res.status(404).json({ message: "Not found" });
  res.json({ chat });
};

exports.getModels = (_req, res) => {
  res.json({ models: GROQ_MODELS, primary: GROQ_MODELS[0] });
};
