const mongoose = require("mongoose");

/**
 * ==========================================
 * QUIZ RESULT MODEL (Database Schema)
 * ==========================================
 * This schema stores the finalized results of self-paced practice quizzes.
 * It contains advanced analytics to power the student's Progress Dashboard
 * (streaks, average time, improvement tracking).
 */

// Sub-schema for individual answers submitted
const answerResultSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, default: 0 } // Time spent on this question in seconds
});

const quizResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Categorization of what the student practiced
  subject: { type: String, required: true },
  topic: { type: String, required: true, trim: true },
  
  // Base metrics
  totalQuestions: { type: Number, required: true, min: 1 },
  correctAnswers: { type: Number, required: true, min: 0 },
  score: { type: Number, required: true, min: 0, max: 100 }, // Percentage score (0-100)
  timeTaken: { type: Number, required: true, min: 0 }, // Total time taken in seconds
  
  answers: [answerResultSchema],
  
  status: { type: String, enum: ["completed", "cancelled"], required: true, default: "completed" },
  completedAt: { type: Date, default: Date.now },
  
  // Metadata about the quiz context
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  quizType: { type: String, enum: ["practice", "assessment", "random", "live"], default: "practice" },
  tags: [{ type: String, trim: true }],
  
  // ==========================================
  // PROGRESS ANALYTICS FIELDS
  // ==========================================
  averageTimePerQuestion: { type: Number, default: 0 }, // Avg seconds per question
  streak: { type: Number, default: 0 }, // Longest streak of correct answers in a row
  improvement: { type: Number, default: 0 } // Percentage improvement from their previous attempt at this topic
}, {
  timestamps: true,
});

// ==========================================
// MIDDLEWARE (Hooks)
// ==========================================
// Pre-save hook to auto-calculate analytics (score, time per question, streaks) before saving
quizResultSchema.pre('save', function(next) {
  // 1. Calculate score percentage
  if (this.correctAnswers !== undefined && this.totalQuestions > 0) {
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }
  
  // 2. Calculate average time per question
  if (this.timeTaken > 0 && this.totalQuestions > 0) {
    this.averageTimePerQuestion = Math.round(this.timeTaken / this.totalQuestions);
  }
  
  // 3. Calculate max streak of correct answers
  if (this.answers.length > 0) {
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (const answer of this.answers) {
      if (answer.isCorrect) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    this.streak = maxStreak;
  }
  
  next();
});

// Indexes for Dashboard performance
quizResultSchema.index({ studentId: 1, completedAt: -1 });
quizResultSchema.index({ studentId: 1, subject: 1, topic: 1 });
quizResultSchema.index({ subject: 1, topic: 1, score: -1 });
quizResultSchema.index({ status: 1, completedAt: -1 });

// ==========================================
// STATIC METHODS (Database queries)
// ==========================================
quizResultSchema.statics.getStudentResults = function(studentId, filters = {}) {
  const query = { studentId, ...filters };
  return this.find(query).sort({ completedAt: -1 }).populate('studentId', 'name email');
};

quizResultSchema.statics.getTopScores = function(subject, topic, limit = 10) {
  const query = {};
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  
  return this.find(query).sort({ score: -1, timeTaken: 1 }).limit(limit).populate('studentId', 'name email');
};

// Extremely useful aggregation to pull averages for the Progress Dashboard charts
quizResultSchema.statics.getSubjectStats = function(studentId, subject) {
  return this.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId), subject } },
    {
      $group: {
        _id: '$topic',
        avgScore: { $avg: '$score' },
        totalAttempts: { $sum: 1 },
        bestScore: { $max: '$score' },
        avgTime: { $avg: '$timeTaken' },
        lastAttempt: { $max: '$completedAt' }
      }
    },
    { $sort: { avgScore: -1 } }
  ]);
};

// ==========================================
// INSTANCE METHODS (Actions on a specific result)
// ==========================================
quizResultSchema.methods.calculateImprovement = async function(previousResult) {
  if (previousResult) {
    this.improvement = Math.round(this.score - previousResult.score);
  }
  return this.improvement;
};

// Converts numerical score to a word rating
quizResultSchema.methods.getPerformanceLevel = function() {
  if (this.score >= 90) return 'Excellent';
  if (this.score >= 80) return 'Good';
  if (this.score >= 70) return 'Average';
  if (this.score >= 60) return 'Below Average';
  return 'Poor';
};

// Cleans up the data before sending it to the frontend via API
quizResultSchema.methods.toAPIResponse = function() {
  return {
    id: this._id,
    studentId: this.studentId,
    subject: this.subject,
    topic: this.topic,
    totalQuestions: this.totalQuestions,
    correctAnswers: this.correctAnswers,
    score: this.score,
    percentage: this.score, // alias for frontend convenience
    timeTaken: this.timeTaken,
    completedAt: this.completedAt,
    difficulty: this.difficulty,
    quizType: this.quizType,
    tags: this.tags,
    streak: this.streak,
    improvement: this.improvement,
    performanceLevel: this.getPerformanceLevel(),
    answers: this.answers ? this.answers.map(answer => ({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.correctAnswer,
      explanation: answer.explanation,
      timeSpent: answer.timeSpent
    })) : []
  };
};

module.exports = mongoose.model("QuizResult", quizResultSchema);
