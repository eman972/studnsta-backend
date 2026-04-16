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
    paperType: {
      type: String,
      enum: ["Past Paper", "Key Book", "Notes"],
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
      trim: true,
    }]
  },
  { timestamps: true }
);

// Index for performance
paperSchema.index({ subject: 1, topic: 1 });
paperSchema.index({ paperType: 1, year: 1 });
paperSchema.index({ title: "text", description: "text", topic: "text", tags: "text" });

module.exports = mongoose.model("Paper", paperSchema);
