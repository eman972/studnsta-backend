const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedAnswer: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  timeSpent: {
    type: Number, // Time spent on this question in seconds
    default: 0,
  }
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answers: [answerSchema],
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0,
  },
  percentage: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ["In Progress", "Completed", "Submitted"],
    default: "In Progress",
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  timeTaken: {
    type: Number, // Total time taken in minutes
    default: 0,
  },
  grade: {
    type: String,
    enum: ["A+", "A", "B", "C", "D", "F", "Not Graded"],
    default: "Not Graded",
  },
  feedback: {
    type: String,
    default: "",
  },
  reviewed: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

// Calculate percentage and grade before saving
quizAttemptSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.percentage = (this.correctAnswers / this.totalQuestions) * 100;
    
    // Assign grade based on percentage
    if (this.percentage >= 90) this.grade = "A+";
    else if (this.percentage >= 80) this.grade = "A";
    else if (this.percentage >= 70) this.grade = "B";
    else if (this.percentage >= 60) this.grade = "C";
    else if (this.percentage >= 50) this.grade = "D";
    else this.grade = "F";
  }
  
  // Calculate time taken if endTime is set
  if (this.endTime && this.startTime) {
    this.timeTaken = (this.endTime - this.startTime) / (1000 * 60); // Convert to minutes
  }
  
  next();
});

// Index for querying attempts by student and quiz
quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
