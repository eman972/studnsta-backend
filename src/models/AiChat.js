const mongoose = require("mongoose");

const aiChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Study chat" },
    subject: { type: String, default: "" },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.AiChat || mongoose.model("AiChat", aiChatSchema);
