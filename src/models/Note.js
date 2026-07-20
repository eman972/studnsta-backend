const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true },
    topic: { type: String, default: "" },
    year: { type: String, default: "" },
    pdfUrl: { type: String, required: true },
    noteType: { type: String, default: "Notes" },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloads: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    // Features 53, 54, 59
    citation: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    version: { type: Number, default: 1 },
    changelog: [
      {
        version: Number,
        note: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
        review: String,
      },
    ],
    avgRating: { type: Number, default: 0 },
    annotations: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        page: Number,
        text: String,
        highlight: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "notes" }
);

noteSchema.index({ subject: 1, topic: 1 });
noteSchema.index({ noteType: 1, year: 1 });
noteSchema.index({ title: "text", description: "text", topic: "text", tags: "text" });

module.exports = mongoose.models.Note || mongoose.model("Note", noteSchema);
