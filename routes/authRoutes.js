const express = require("express");
const router = express.Router();
const { registerUser, loginUser, guestLogin } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/guest-login", guestLogin);

module.exports = router;