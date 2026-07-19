const express = require("express");
const router = express.Router();

// Middleware that ensures a user is logged in before accessing certain routes
const protect = require("../middleware/authMiddleware");

// Multer is a middleware for handling multipart/form-data, primarily used for uploading files
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import controllers directly
const noteController = require("../controllers/noteController");

/**
 * ==========================================
 * MULTER CONFIGURATION (PDF Uploads)
 * ==========================================
 * This tells Multer where to save uploaded PDFs and what to name them.
 */
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // Save PDFs in the 'uploads/notes' folder
      const dir = "uploads/notes";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      // Create a unique filename so files don't overwrite each other
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + ".pdf");
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max limit
  fileFilter: (req, file, cb) => {
    // Only accept PDF files for security
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

/**
 * ==========================================
 * NOTE / PAPER ROUTES (/api/notes)
 * ==========================================
 * 'protect' means the user must send a valid JWT token to use this route.
 */

// POST /api/notes -> Upload a new note. Needs Auth + Multer handles the 'pdf' file
router.post("/", protect, pdfUpload.single("pdf"), noteController.uploadNote);

// GET /api/notes -> Fetch all notes (with optional search/filter query params)
router.get("/", noteController.getNotes);

// GET /api/notes/filters -> Gets dynamic list of available subjects/topics for dropdowns
router.get("/filters", noteController.getFilterOptions);

// GET /api/notes/:id -> Fetch a specific single note
router.get("/:id", noteController.getNote);

// DELETE /api/notes/:id -> Delete a note (Needs Auth)
router.delete("/:id", protect, noteController.deleteNote);

module.exports = router;
