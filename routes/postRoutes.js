const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

// Import all controller functions that contain the actual logic
const {
  createPost,
  getFeed,
  likePost,
  commentOnPost,
  savePost,
  getSavedPosts
} = require("../controllers/postController");



/**
 * ==========================================
 * POST / COMMUNITY FEED ROUTES (/api/posts)
 * ==========================================
 * All routes here are 'protected', meaning you must be logged in to view 
 * the feed or interact with posts.
 */

// GET /api/posts/saved -> Gets all posts the logged-in user bookmarked
// Note: Must be placed *before* /:id routes so Express doesn't think "saved" is an ID
router.get("/saved", protect, getSavedPosts);

// POST /api/posts -> Create a new post
router.post("/", protect, createPost);

// GET /api/posts/feed -> Gets the global feed of all posts
router.get("/feed", protect, getFeed);

// ==========================================
// INTERACTION ROUTES
// ==========================================
// These handle clicking the Like, Save, or Comment buttons on a specific post ID
router.post("/:id/like", protect, likePost);
router.post("/:id/comment", protect, commentOnPost);
router.post("/:id/save", protect, savePost);

module.exports = router;