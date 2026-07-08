const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    noteType: {
      type: String,
      default: "Notes",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }]
  },
  { timestamps: true, collection: 'notes' }
);

// Index for performance
noteSchema.index({ subject: 1, topic: 1 });
noteSchema.index({ noteType: 1, year: 1 });
noteSchema.index({ title: "text", description: "text", topic: "text", tags: "text" });

module.exports = mongoose.model("Note", noteSchema);
