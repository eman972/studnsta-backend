const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Create uploads directories if they don't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const imagesDir = path.join(uploadsDir, "images");
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
const papersDir = path.join(uploadsDir, "papers");
if (!fs.existsSync(papersDir)) fs.mkdirSync(papersDir);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);

const paperRoutes = require("./routes/paperRoutes");
app.use("/api/papers", paperRoutes);

const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes);

const quizRoutes = require("./routes/quizRoutes");
app.use("/api/quizzes", quizRoutes);

const quizAttemptRoutes = require("./routes/quizAttemptRoutes");
app.use("/api/quiz-attempts", quizAttemptRoutes);

const questionRoutes = require("./routes/questionRoutes");
app.use("/api/questions", questionRoutes);

const quizResultRoutes = require("./routes/quizResultRoutes");
app.use("/api/quiz-results", quizResultRoutes);

const quizApiRoutes = require("./routes/quizApiRoutes");
app.use("/api/quiz", quizApiRoutes);

const liveQuizRoutes = require("./routes/liveQuizRoutes");
app.use("/api/live-quiz", liveQuizRoutes);

// AI Routes (Groq)
const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Studnsta Backend Running Successfully");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
