const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import all controller functions
const {
  createPost,
  getFeed,
  likePost,
  savePost,
  commentOnPost,
  followUser
} = require("../controllers/postController");

// Configure multer for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "uploads";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// POST routes
router.post("/", protect, upload.single("image"), createPost);
router.get("/feed", protect, getFeed);

// Interaction routes
router.post("/:id/like", protect, likePost);
router.post("/:id/save", protect, savePost);
router.post("/:id/comment", protect, commentOnPost);

// Follow route
router.post("/follow/:id", protect, followUser);

module.exports = router;