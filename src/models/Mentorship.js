const mongoose = require("mongoose");

const mentorshipSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: String,
    status: {
      type: String,
      enum: ["pending", "active", "ended"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Mentorship || mongoose.model("Mentorship", mentorshipSchema);
