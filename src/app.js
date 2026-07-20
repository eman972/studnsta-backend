const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const requestContext = require("./middleware/requestContext");
const { apiLimiter } = require("./middleware/rateLimiters");
const { UPLOADS } = require("./config/paths");

function createApp() {
  const app = express();

  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
  ["images", "notes", "files"].forEach((d) => {
    const p = path.join(UPLOADS, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes("*")
        ) {
          return cb(null, true);
        }
        return cb(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(requestContext);
  app.use(apiLimiter);
  app.use("/uploads", express.static(UPLOADS));

  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/posts", require("./routes/postRoutes"));
  app.use("/api/notes", require("./routes/noteRoutes"));
  app.use("/api/profile", require("./routes/profileRoutes"));
  app.use("/api/quizzes", require("./routes/quizRoutes"));
  app.use("/api/quiz-attempts", require("./routes/quizAttemptRoutes"));
  app.use("/api/questions", require("./routes/questionRoutes"));
  app.use("/api/quiz-results", require("./routes/quizResultRoutes"));
  app.use("/api/quiz", require("./routes/quizApiRoutes"));
  app.use("/api/live-quiz", require("./routes/liveQuizRoutes"));
  app.use("/api/ai", require("./routes/aiRoutes"));
  app.use("/api", require("./routes/platformRoutes"));

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "studnsta-api",
      time: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  app.get("/", (_req, res) => {
    res.send("Studnsta Backend Running Successfully");
  });

  app.get("/api/docs", (_req, res) => {
    res.json({
      name: "Studnsta Public API",
      version: "2.0.0",
      baseUrl: "/api",
      auth: "Bearer JWT (+ refresh via /api/auth/refresh)",
      resources: [
        "/auth",
        "/posts",
        "/notes",
        "/profile",
        "/quiz",
        "/live-quiz",
        "/ai",
        "/classes",
        "/notifications",
        "/messages",
        "/assignments",
        "/flashcards",
        "/search",
        "/admin",
      ],
    });
  });

  return { app, allowedOrigins };
}

module.exports = { createApp };
