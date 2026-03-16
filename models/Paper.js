const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      enum: ["9th", "10th"],
      required: true,
    },
    board: {
      type: String,
      enum: ["BISERWP", "FBISE"],
      required: true,
    },
    subject: {
      type: String,
      enum: ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"],
      required: true,
    },
    chapter: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    paperType: {
      type: String,
      enum: ["Past Paper", "Model Paper", "Key Book", "Notes"],
      required: true,
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
    }]
  },
  { timestamps: true }
);

// Index for performance
paperSchema.index({ class: 1, board: 1, subject: 1, chapter: 1 });
paperSchema.index({ paperType: 1, year: 1 });
paperSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Paper", paperSchema);
