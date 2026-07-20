const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date },
    rubric: [
      {
        criterion: String,
        maxPoints: Number,
      },
    ],
    allowPeerReview: { type: Boolean, default: false },
    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        fileUrl: String,
        text: String,
        submittedAt: { type: Date, default: Date.now },
        grade: Number,
        feedback: String,
        peerReviews: [
          {
            reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            score: Number,
            comment: String,
          },
        ],
        similarityScore: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
