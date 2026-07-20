const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { UPLOADS } = require("../config/paths");

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
      cb(null, UPLOADS);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

router.get("/", protect, profileController.getUserProfile);
router.post("/avatar", protect, upload.single("avatar"), profileController.uploadAvatar);
router.get("/users", protect, profileController.getAllUsers);
router.put("/", protect, profileController.updateProfile);
router.delete("/posts/:postId", protect, profileController.deleteUserPost);
router.post("/follow/:userId", protect, profileController.followUser);
router.delete("/follow/:userId", protect, profileController.unfollowUser);
router.post("/block/:userId", protect, profileController.blockUser);
router.post("/deactivate", protect, profileController.deactivateAccount);
router.get("/export", protect, profileController.exportMyData);
router.delete("/me", protect, profileController.softDeleteAccount);
router.get("/:userId/posts", protect, profileController.getUserPostsBySubject);

module.exports = router;
