const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    image: String,
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
    }]
  },
  { timestamps: true }
);

// Index for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ class: 1, board: 1, subject: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);