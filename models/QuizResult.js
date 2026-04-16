const mongoose = require("mongoose");

const answerResultSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedAnswer: {
    type: String,
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

const quizResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
    enum: ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"],
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1,
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0,
  },
  score: {
    type: Number, // Percentage score (0-100)
    required: true,
    min: 0,
    max: 100,
  },
  timeTaken: {
    type: Number, // Total time taken in seconds
    required: true,
    min: 0,
  },
  answers: [answerResultSchema],
  status: {
    type: String,
    enum: ["completed", "cancelled"],
    required: true,
    default: "completed",
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  // Additional fields for better tracking
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  quizType: {
    type: String,
    enum: ["practice", "assessment", "random", "live"],
    default: "practice",
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // Performance metrics
  averageTimePerQuestion: {
    type: Number, // Average time per question in seconds
    default: 0,
  },
  streak: {
    type: Number, // Longest streak of correct answers
    default: 0,
  },
  improvement: {
    type: Number, // Percentage improvement from previous attempt
    default: 0,
  }
}, {
  timestamps: true,
});

// Pre-save middleware to calculate derived fields
quizResultSchema.pre('save', function(next) {
  // Calculate score percentage if not provided
  if (this.correctAnswers !== undefined && this.totalQuestions > 0) {
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }
  
  // Calculate average time per question
  if (this.timeTaken > 0 && this.totalQuestions > 0) {
    this.averageTimePerQuestion = Math.round(this.timeTaken / this.totalQuestions);
  }
  
  // Calculate streak
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

// Indexes for performance
quizResultSchema.index({ studentId: 1, completedAt: -1 });
quizResultSchema.index({ studentId: 1, subject: 1, topic: 1 });
quizResultSchema.index({ subject: 1, topic: 1, score: -1 });
quizResultSchema.index({ status: 1, completedAt: -1 });

// Static methods
quizResultSchema.statics.getStudentResults = function(studentId, filters = {}) {
  const query = { studentId, ...filters };
  return this.find(query)
    .sort({ completedAt: -1 })
    .populate('studentId', 'name email');
};

quizResultSchema.statics.getTopScores = function(subject, topic, limit = 10) {
  const query = {};
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  
  return this.find(query)
    .sort({ score: -1, timeTaken: 1 }) // Higher score, lower time
    .limit(limit)
    .populate('studentId', 'name email');
};

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

// Instance methods
quizResultSchema.methods.calculateImprovement = async function(previousResult) {
  if (previousResult) {
    this.improvement = Math.round(this.score - previousResult.score);
  }
  return this.improvement;
};

quizResultSchema.methods.getPerformanceLevel = function() {
  if (this.score >= 90) return 'Excellent';
  if (this.score >= 80) return 'Good';
  if (this.score >= 70) return 'Average';
  if (this.score >= 60) return 'Below Average';
  return 'Poor';
};

quizResultSchema.methods.toAPIResponse = function() {
  return {
    id: this._id,
    studentId: this.studentId,
    subject: this.subject,
    topic: this.topic,
    totalQuestions: this.totalQuestions,
    correctAnswers: this.correctAnswers,
    score: this.score,
    percentage: this.score,
    timeTaken: this.timeTaken,
    completedAt: this.completedAt,
    difficulty: this.difficulty,
    quizType: this.quizType,
    tags: this.tags,
    streak: this.streak,
    improvement: this.improvement,
    performanceLevel: this.getPerformanceLevel(),
    answers: this.answers.map(answer => ({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.correctAnswer,
      explanation: answer.explanation,
      timeSpent: answer.timeSpent
    }))
  };
};

module.exports = mongoose.model("QuizResult", quizResultSchema);
