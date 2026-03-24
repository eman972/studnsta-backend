const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

// Profile routes
router.get("/", protect, profileController.getUserProfile);
router.post("/avatar", protect, upload.single("avatar"), profileController.uploadAvatar);
router.get("/users", protect, profileController.getAllUsers);
router.get("/:userId/posts", protect, profileController.getUserPostsBySubject);
router.put("/", protect, profileController.updateProfile);
router.delete("/posts/:postId", protect, profileController.deleteUserPost);

module.exports = router;
