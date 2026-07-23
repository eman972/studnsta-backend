const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date },

    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        fileUrl: String,
        text: String,
        submittedAt: { type: Date, default: Date.now },
        grade: Number,

      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
