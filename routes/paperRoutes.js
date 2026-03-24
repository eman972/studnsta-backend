const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import controllers directly
const paperController = require("../controllers/paperController");

// Configure multer for PDF uploads
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "uploads/papers";
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Paper routes
router.post("/", protect, pdfUpload.single("pdf"), paperController.uploadPaper);
router.get("/", paperController.getPapers);
router.get("/filters", paperController.getFilterOptions);
router.get("/:id", paperController.getPaper);
router.delete("/:id", protect, paperController.deletePaper);

module.exports = router;
