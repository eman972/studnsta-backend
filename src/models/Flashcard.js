const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
    front: { type: String, required: true },
    back: { type: String, required: true },
    subject: String,
    topic: String,
    // SM-2 spaced repetition fields
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    nextReviewAt: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Flashcard || mongoose.model("Flashcard", flashcardSchema);
