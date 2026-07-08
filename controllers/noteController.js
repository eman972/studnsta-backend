const Note = require("../models/Note");
const fs = require("fs");
const path = require("path");

// UPLOAD NOTE (PDF)
exports.uploadNote = async (req, res) => {
  try {
    if (req.user.role.toLowerCase() === "student") {
      return res.status(403).json({ message: "Students are not authorized to upload notes." });
    }

    const { title, description, subject, topic, year, noteType, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const note = await Note.create({
      title,
      description,
      pdfUrl: `/uploads/notes/${req.file.filename}`,
      subject,
      topic,
      year,
      noteType,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      uploadedBy: req.user.id,
    });

    const populatedNote = await Note.findById(note._id).populate('uploadedBy', 'name role');
    
    res.status(201).json(populatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET NOTES WITH FILTERING
exports.getNotes = async (req, res) => {
  try {
    const { subject, topic, noteType, year, search, tags } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (noteType) filter.noteType = noteType;
    if (year) filter.year = year;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const notes = await Note.find(filter)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE NOTE
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('uploadedBy', 'name role');
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    // Increment download count
    note.downloads += 1;
    await note.save();
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE NOTE
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    // Check if user is the uploader
    if (note.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this note" });
    }
    
    // Delete PDF file
    const pdfPath = path.join(__dirname, '..', note.pdfUrl);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
    
    await Note.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FILTER OPTIONS
exports.getFilterOptions = async (req, res) => {
  try {
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"];
    const noteTypes = ["Past Note", "Key Book", "Notes"];
    
    // Get available years
    const years = await Note.distinct('year');
    const chapters = await Note.distinct('chapter');
    
    res.json({
      subjects,
      noteTypes,
      years: years.sort(),
      chapters: chapters.sort()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
