const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    image: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    saves: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [{
      type: String,
      trim: true,
    }]
  },
  { timestamps: true }
);

// Index for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ subject: 1, topic: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ content: "text", topic: "text", tags: "text" });

module.exports = mongoose.model("Post", postSchema);