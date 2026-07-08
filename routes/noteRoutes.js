const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import controllers directly
const noteController = require("../controllers/noteController");

// Configure multer for PDF uploads
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "uploads/notes";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + ".pdf");
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Note routes
router.post("/", protect, pdfUpload.single("pdf"), noteController.uploadNote);
router.get("/", noteController.getNotes);
router.get("/filters", noteController.getFilterOptions);
router.get("/:id", noteController.getNote);
router.delete("/:id", protect, noteController.deleteNote);

module.exports = router;
