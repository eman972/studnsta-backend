const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    subject: { type: String, default: "" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinCode: { type: String, unique: true, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    announcements: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        body: String,
        pinned: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    files: [
      {
        name: String,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Class || mongoose.model("Class", classSchema);
