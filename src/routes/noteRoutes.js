const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const noteController = require("../controllers/noteController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { UPLOADS } = require("../config/paths");

const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(UPLOADS, "notes");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + ".pdf");
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

router.post("/", protect, pdfUpload.single("pdf"), noteController.uploadNote);
router.get("/", noteController.getNotes);
router.get("/filters", noteController.getFilterOptions);

router.get("/:id", noteController.getNote);
router.delete("/:id", protect, noteController.deleteNote);

module.exports = router;
