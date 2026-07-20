const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    start: { type: Date, required: true },
    end: { type: Date },
    type: {
      type: String,
      enum: ["deadline", "live-quiz", "class", "study", "other"],
      default: "other",
    },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Event || mongoose.model("Event", eventSchema);
