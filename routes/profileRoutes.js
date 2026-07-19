const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * ==========================================
 * PROFILE ROUTES (/api/profile)
 * ==========================================
 * Handles fetching and updating user profiles, as well as managing a user's own posts.
 */

// Multer config for Profile Picture (Avatar) uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "uploads";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// GET /api/profile -> Fetch the logged-in user's profile details
router.get("/", protect, profileController.getUserProfile);

// POST /api/profile/avatar -> Upload/change profile picture
router.post("/avatar", protect, upload.single("avatar"), profileController.uploadAvatar);

// GET /api/profile/users -> Fetch a list of all users (could be used for search/directory)
router.get("/users", protect, profileController.getAllUsers);

// GET /api/profile/:userId/posts -> Get posts made by a specific user
router.get("/:userId/posts", protect, profileController.getUserPostsBySubject);

// PUT /api/profile -> Update user bio, tagline, etc.
router.put("/", protect, profileController.updateProfile);

// DELETE /api/profile/posts/:postId -> Allows a user to delete their own post
router.delete("/posts/:postId", protect, profileController.deleteUserPost);

module.exports = router;
