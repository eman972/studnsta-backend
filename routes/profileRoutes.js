const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

// Profile routes
router.get("/", protect, profileController.getUserProfile);
router.get("/users", protect, profileController.getAllUsers);
router.get("/:userId/posts", protect, profileController.getUserPostsBySubject);
router.put("/", protect, profileController.updateProfile);
router.delete("/posts/:postId", protect, profileController.deleteUserPost);

module.exports = router;
