const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"],
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
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
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      default: "medium",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for question ID
questionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Indexes for performance
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ createdBy: 1, createdAt: -1 });
questionSchema.index({ question: "text", topic: "text", tags: "text" });

// Pre-save middleware to validate correctAnswer is in options
questionSchema.pre('save', function(next) {
  if (!this.options.includes(this.correctAnswer)) {
    next(new Error('Correct answer must be one of the options'));
  } else {
    next();
  }
});

// Static method to find questions by subject and topic
questionSchema.statics.findBySubjectAndTopic = function(subject, topic) {
  return this.find({ subject: subject, topic: topic });
};

// Static method to find random questions
questionSchema.statics.findRandomQuestions = function(count, filters = {}) {
  return this.aggregate([
    { $match: filters },
    { $sample: { size: count } }
  ]);
};

// Instance method to increment usage count
questionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model("Question", questionSchema);
