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
    
    const filter = { isDeleted: { $ne: true } };
    
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

// DELETE NOTE (soft delete — Feature 28)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    if (
      note.uploadedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to delete this note" });
    }
    
    note.isDeleted = true;
    note.deletedAt = new Date();
    await note.save();
    
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 54: rate note */
exports.rateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || note.isDeleted) return res.status(404).json({ message: "Not found" });
    const { score, review } = req.body;
    note.ratings = note.ratings.filter(
      (r) => r.user.toString() !== req.user.id.toString()
    );
    note.ratings.push({ user: req.user.id, score, review });
    note.avgRating =
      note.ratings.reduce((s, r) => s + r.score, 0) / note.ratings.length;
    await note.save();
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 53: version bump */
exports.versionNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Not found" });
    if (note.uploadedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    note.version += 1;
    note.changelog.push({
      version: note.version,
      note: req.body.note || `Version ${note.version}`,
      by: req.user.id,
    });
    if (req.body.description) note.description = req.body.description;
    if (req.body.citation) note.citation = req.body.citation;
    if (req.body.sourceUrl) note.sourceUrl = req.body.sourceUrl;
    await note.save();
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 58: annotate */
exports.annotateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Not found" });
    note.annotations.push({
      user: req.user.id,
      page: req.body.page,
      text: req.body.text,
      highlight: req.body.highlight,
    });
    await note.save();
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FILTER OPTIONS
exports.getFilterOptions = async (req, res) => {
  try {
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"];
    const noteTypes = ["Past Note", "Key Book", "Notes"];
    
    const years = await Note.distinct('year');
    
    res.json({
      subjects,
      noteTypes,
      years: years.sort(),
      chapters: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
