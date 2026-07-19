const mongoose = require("mongoose");

/**
 * ==========================================
 * QUIZ ATTEMPT MODEL (Database Schema)
 * ==========================================
 * This schema tracks a student's live, ongoing attempt at taking a "Quiz".
 * It records their individual answers, time taken, and ultimately their grade.
 */

// Sub-schema: Represents a single answer to a single question during the attempt
const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedAnswer: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, default: 0 } // Time spent on this question in seconds
});

const quizAttemptSchema = new mongoose.Schema({
  // Links to the Quiz being taken
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  
  // Links to the Student taking it
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Array of answers the student has submitted so far
  answers: [answerSchema],
  
  // Scoring metrics
  score: { type: Number, required: true, default: 0 },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true, default: 0 },
  percentage: { type: Number, required: true, default: 0 },
  
  // Tracks if they are still taking it, or if they finished
  status: { type: String, enum: ["In Progress", "Completed", "Submitted"], default: "In Progress" },
  
  // Timing
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  timeTaken: { type: Number, default: 0 }, // Total time taken in minutes
  
  // Grading and feedback
  grade: {
    type: String,
    enum: ["A+", "A", "B", "C", "D", "F", "Not Graded"],
    default: "Not Graded",
  },
  feedback: { type: String, default: "" }, // Teacher can leave feedback
  reviewed: { type: Boolean, default: false }
}, {
  timestamps: true,
});

// ==========================================
// MIDDLEWARE (Hooks)
// ==========================================
// Pre-save hook: Automatically calculates percentage, grade, and time taken 
// right before saving the attempt to the database.
quizAttemptSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.percentage = (this.correctAnswers / this.totalQuestions) * 100;
    
    // Assign letter grade based on percentage score
    if (this.percentage >= 90) this.grade = "A+";
    else if (this.percentage >= 80) this.grade = "A";
    else if (this.percentage >= 70) this.grade = "B";
    else if (this.percentage >= 60) this.grade = "C";
    else if (this.percentage >= 50) this.grade = "D";
    else this.grade = "F";
  }
  
  // Calculate total time taken if the quiz is finished
  if (this.endTime && this.startTime) {
    this.timeTaken = (this.endTime - this.startTime) / (1000 * 60); // Convert milliseconds to minutes
  }
  
  next();
});

// Indexes for faster lookups (e.g., finding all attempts by one student)
quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
