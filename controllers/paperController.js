const Paper = require("../models/Paper");
const fs = require("fs");
const path = require("path");

// UPLOAD PAPER (PDF)
exports.uploadPaper = async (req, res) => {
  try {
    const { title, description, subject, topic, year, paperType, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const paper = await Paper.create({
      title,
      description,
      pdfUrl: `/uploads/papers/${req.file.filename}`,
      subject,
      topic,
      year,
      paperType,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      uploadedBy: req.user.id,
    });

    const populatedPaper = await Paper.findById(paper._id).populate('uploadedBy', 'name role');
    
    res.status(201).json(populatedPaper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PAPERS WITH FILTERING
exports.getPapers = async (req, res) => {
  try {
    const { subject, topic, paperType, year, search, tags } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (paperType) filter.paperType = paperType;
    if (year) filter.year = year;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const papers = await Paper.find(filter)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE PAPER
exports.getPaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id)
      .populate('uploadedBy', 'name role');
    
    if (!paper) {
      return res.status(404).json({ message: "Paper not found" });
    }
    
    // Increment download count
    paper.downloads += 1;
    await paper.save();
    
    res.json(paper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PAPER
exports.deletePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    
    if (!paper) {
      return res.status(404).json({ message: "Paper not found" });
    }
    
    // Check if user is the uploader
    if (paper.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this paper" });
    }
    
    // Delete PDF file
    const pdfPath = path.join(__dirname, '..', paper.pdfUrl);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
    
    await Paper.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Paper deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FILTER OPTIONS
exports.getFilterOptions = async (req, res) => {
  try {
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"];
    const paperTypes = ["Past Paper", "Key Book", "Notes"];
    
    // Get available years
    const years = await Paper.distinct('year');
    const chapters = await Paper.distinct('chapter');
    
    res.json({
      subjects,
      paperTypes,
      years: years.sort(),
      chapters: chapters.sort()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
