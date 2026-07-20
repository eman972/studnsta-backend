const mongoose = require("mongoose");

const studyGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxSize: { type: Number, default: 8 },
    subject: String,
    whiteboard: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StudyGroup || mongoose.model("StudyGroup", studyGroupSchema);
