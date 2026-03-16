const Paper = require("../models/Paper");
const fs = require("fs");
const path = require("path");

// UPLOAD PAPER (PDF)
exports.uploadPaper = async (req, res) => {
  try {
    const { title, description, class: paperClass, board, subject, chapter, year, paperType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const paper = await Paper.create({
      title,
      description,
      pdfUrl: `/uploads/papers/${req.file.filename}`,
      class: paperClass,
      board,
      subject,
      chapter,
      year,
      paperType,
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
    const { class: filterClass, board, subject, chapter, paperType, year, search } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (filterClass) filter.class = filterClass;
    if (board) filter.board = board;
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;
    if (paperType) filter.paperType = paperType;
    if (year) filter.year = year;
    
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
    const classes = ["9th", "10th"];
    const boards = ["BISERWP", "FBISE"];
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"];
    const paperTypes = ["Past Paper", "Model Paper", "Key Book", "Notes"];
    
    // Get available years
    const years = await Paper.distinct('year');
    const chapters = await Paper.distinct('chapter');
    
    res.json({
      classes,
      boards,
      subjects,
      paperTypes,
      years: years.sort(),
      chapters: chapters.sort()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
