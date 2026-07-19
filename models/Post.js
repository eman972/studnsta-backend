const mongoose = require("mongoose");

/**
 * ==========================================
 * POST MODEL (Database Schema)
 * ==========================================
 * This file defines the structure for community feed posts (similar to Instagram/Facebook).
 * It holds the text content, any uploaded images, and tracks user interactions like likes, saves, and comments.
 */
const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true }, // The main text of the post
    
    // Who created the post? Links back to a User document.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Array of User IDs who liked this post
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    
    // Array of User IDs who saved/bookmarked this post
    saves: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    
    // Array of comment objects
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Link to the user who made the comment
      },
      text: String, // The comment text
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Categorization
    tags: [{
      type: String,
      trim: true,
    }]
  },
  { timestamps: true } // Auto-generates createdAt and updatedAt
);

// ==========================================
// INDEXES FOR QUERY OPTIMIZATION
// ==========================================
// These indexes speed up common database queries, such as loading the feed.
postSchema.index({ author: 1, createdAt: -1 }); // Fast loading of a specific user's posts
postSchema.index({ subject: 1, topic: 1 });
postSchema.index({ createdAt: -1 }); // Fast loading of the global chronological feed
postSchema.index({ content: "text", topic: "text", tags: "text" }); // Enables text searching

module.exports = mongoose.model("Post", postSchema);