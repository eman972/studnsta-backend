const mongoose = require("mongoose");

/**
 * ==========================================
 * QUIZ MODEL (Database Schema)
 * ==========================================
 * This schema is primarily used for "Live Quizzes" created by Teachers.
 * It stores the overall settings of the quiz (duration, timer, link) and 
 * an array of questions specifically selected for this quiz.
 */

// Sub-schema for embedding questions directly into the quiz
// Note: Some models reference the "Question" collection, but this schema embeds them directly
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index of the correct option (0, 1, 2, 3)
  explanation: { type: String, default: "" }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  subject: { type: String, required: true },
  topic: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard", "mixed"], default: "Medium" },
  
  // Timing settings
  duration: { type: Number, required: true, default: 30 }, // Duration in minutes
  timer: { type: Number, required: true, default: 30 }, // Timer in minutes
  
  // Array of ObjectIds linking to the global Question bank
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  }],
  
  // The teacher who made the quiz
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // States of the quiz
  isPublished: { type: Boolean, default: false },
  isLive: { type: Boolean, default: false },
  
  // The unique URL link generated for students to join the live quiz
  quizLink: { type: String, default: "", unique: true, sparse: true, index: true },
  
  // Specific settings for how the quiz behaves when students take it
  liveSettings: {
    allowRetake: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: true }
  },
  
  tags: [{ type: String, trim: true }],
}, {
  timestamps: true,
});

// ==========================================
// VIRTUAL PROPERTIES
// ==========================================
// These are not saved in the database, but are calculated on the fly when you get a quiz

// Calculates the total number of questions in the quiz
quizSchema.virtual('totalQuestions').get(function() {
  return this.questions.length;
});

// Calculates total marks (assuming 1 mark per question)
quizSchema.virtual('totalMarks').get(function() {
  return this.questions.length;
});

module.exports = mongoose.model("Quiz", quizSchema);
