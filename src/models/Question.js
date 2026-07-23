const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    topic: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },

    options: {
      type: [String],
      default: [],
    },
    correctAnswer: { type: String, required: true, trim: true },
    numericTolerance: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      default: "medium",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    explanation: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],

    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

questionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ createdBy: 1, createdAt: -1 });

questionSchema.pre("save", function (next) {
    if (!this.options || this.options.length < 2) {
      return next(new Error("MCQ requires at least 2 options"));
    }
    if (!this.options.includes(this.correctAnswer)) {
      return next(new Error("Correct answer must be one of the options"));
    }
  next();
});

questionSchema.statics.findBySubjectAndTopic = function (subject, topic) {
  return this.find({ subject, topic });
};

questionSchema.statics.findRandomQuestions = function (count, filters = {}) {
  return this.aggregate([
    { $match: { ...filters } },
    { $sample: { size: count } },
  ]);
};

questionSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.models.Question || mongoose.model("Question", questionSchema);
