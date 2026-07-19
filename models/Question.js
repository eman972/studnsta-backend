const mongoose = require("mongoose");

/**
 * ==========================================
 * QUESTION MODEL (Database Schema)
 * ==========================================
 * This schema represents a single Multiple Choice Question (MCQ) in the database.
 * This is the core data used to generate both practice quizzes and live teacher quizzes.
 */
const questionSchema = new mongoose.Schema(
  {
    // Categorization fields - used to group questions
    subject: { type: String, required: true },
    topic: { type: String, required: true, trim: true },
    
    // The actual question content
    question: { type: String, required: true, trim: true },
    
    // Array of possible answers (must be exactly 4)
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function(options) {
          return options.length === 4;
        },
        message: "Exactly 4 options are required"
      }
    },
    
    // The text of the correct answer (must match one of the options)
    correctAnswer: { type: String, required: true, trim: true },
    
    // Difficulty rating for adaptive testing
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true, default: "medium" },
    
    // The teacher/user who added this question to the bank
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Helpful text shown after a student answers a question
    explanation: { type: String, trim: true, default: "" },
    
    tags: [{ type: String, trim: true }],
    isVerified: { type: Boolean, default: false }, // Could be used to have a review process
    usageCount: { type: Number, default: 0 } // Tracks how many times this question appeared in quizzes
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field: Mongoose adds an "id" field (string) automatically mapped to "_id" (ObjectId)
questionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// ==========================================
// INDEXES
// ==========================================
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ createdBy: 1, createdAt: -1 });
questionSchema.index({ question: "text", topic: "text", tags: "text" });

// ==========================================
// MIDDLEWARE (Hooks)
// ==========================================
// Pre-save hook: Runs automatically before saving a new question to the database.
// It checks if the correctAnswer actually exists inside the options array.
questionSchema.pre('save', function(next) {
  if (!this.options.includes(this.correctAnswer)) {
    next(new Error('Correct answer must be one of the options'));
  } else {
    next();
  }
});

// ==========================================
// STATIC & INSTANCE METHODS
// ==========================================

// Static methods are called on the Model itself (e.g., Question.findBySubjectAndTopic)
questionSchema.statics.findBySubjectAndTopic = function(subject, topic) {
  return this.find({ subject: subject, topic: topic });
};

// Uses MongoDB aggregation to pull a random sample of questions
questionSchema.statics.findRandomQuestions = function(count, filters = {}) {
  return this.aggregate([
    { $match: filters },
    { $sample: { size: count } }
  ]);
};

// Instance methods are called on a specific document (e.g., myQuestion.incrementUsage())
questionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model("Question", questionSchema);
