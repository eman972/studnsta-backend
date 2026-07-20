const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const requestContext = require("./middleware/requestContext");
const { apiLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");
const asyncHandler = require("./middleware/asyncHandler");
const { UPLOADS } = require("./config/paths");

function wrapRouter(router) {
  if (!router || !router.stack) return router;
  router.stack.forEach((layer) => {
    if (layer.route) {
      layer.route.stack.forEach((handlerLayer) => {
        if (
          typeof handlerLayer.handle === "function" &&
          handlerLayer.handle.length < 4
        ) {
          handlerLayer.handle = asyncHandler(handlerLayer.handle);
        }
      });
    }
  });
  return router;
}

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

  const mount = (pathPrefix, routerPath) => {
    app.use(pathPrefix, wrapRouter(require(routerPath)));
  };

  mount("/api/auth", "./routes/authRoutes");
  mount("/api/posts", "./routes/postRoutes");
  mount("/api/notes", "./routes/noteRoutes");
  mount("/api/profile", "./routes/profileRoutes");
  mount("/api/quizzes", "./routes/quizRoutes");
  mount("/api/quiz-attempts", "./routes/quizAttemptRoutes");
  mount("/api/questions", "./routes/questionRoutes");
  mount("/api/quiz-results", "./routes/quizResultRoutes");
  mount("/api/quiz", "./routes/quizApiRoutes");
  mount("/api/live-quiz", "./routes/liveQuizRoutes");
  mount("/api/ai", "./routes/aiRoutes");
  mount("/api", "./routes/platformRoutes");

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

  app.use(errorHandler);

  return { app, allowedOrigins };
}

module.exports = { createApp };
