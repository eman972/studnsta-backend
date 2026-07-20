const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String, trim: true }],
    subject: { type: String, default: "" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    image: { type: String, default: "" },
    attachments: [{ name: String, url: String }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    hashtags: [{ type: String }],
    poll: {
      question: String,
      options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] }],
      endsAt: Date,
    },
    pinned: { type: Boolean, default: false },
    isAnnouncement: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ classId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ content: "text", tags: "text" });

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
