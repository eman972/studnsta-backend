const Question = require("../models/Question");

// CREATE QUESTION
exports.createQuestion = async (req, res) => {
  try {
    const { subject, topic, question, options, correctAnswer, difficulty, explanation, tags } = req.body;

    // Validate options
    if (!options || options.length !== 4) {
      return res.status(400).json({ message: "Exactly 4 options are required" });
    }

    // Validate correct answer is in options
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ message: "Correct answer must be one of the options" });
    }

    const newQuestion = await Question.create({
      subject,
      topic,
      question,
      options,
      correctAnswer,
      difficulty,
      explanation: explanation || "",
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      createdBy: req.user._id,
    });

    const populatedQuestion = await Question.findById(newQuestion._id)
      .populate("createdBy", "name email");

    res.status(201).json({
      message: "Question created successfully",
      question: populatedQuestion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL QUESTIONS (with filtering)
exports.getAllQuestions = async (req, res) => {
  try {
    const { subject, topic, difficulty, search, tags, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const questions = await Question.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(filter);

    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUESTION BY ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Don't send correct answer to students (optional - remove if not needed)
    if (req.user.role === "student") {
      const questionForStudent = question.toObject();
      questionForStudent.correctAnswer = undefined;
      return res.json(questionForStudent);
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE QUESTION
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if user is the creator or admin
    if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only question creators can update their questions" });
    }

    const { subject, topic, question: questionText, options, correctAnswer, difficulty, explanation, tags, isVerified } = req.body;

    // Validate options if provided
    if (options && options.length !== 4) {
      return res.status(400).json({ message: "Exactly 4 options are required" });
    }

    // Validate correct answer if both options and correctAnswer are provided
    if (options && correctAnswer && !options.includes(correctAnswer)) {
      return res.status(400).json({ message: "Correct answer must be one of the options" });
    }

    const updateData = {
      subject,
      topic,
      question: questionText,
      options,
      correctAnswer,
      difficulty,
      explanation,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      isVerified,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE QUESTION
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if user is the creator or admin
    if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only question creators can delete their questions" });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUESTIONS BY SUBJECT AND TOPIC
exports.getQuestionsBySubjectAndTopic = async (req, res) => {
  try {
    const { subject, topic } = req.params;
    
    const questions = await Question.find({ subject, topic })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET RANDOM QUESTIONS (for quiz generation)
exports.getRandomQuestions = async (req, res) => {
  try {
    const { count = 10, subject, topic, difficulty, tags } = req.query;
    
    let filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }

    const questions = await Question.findRandomQuestions(parseInt(count), filter);
    
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUESTIONS CREATED BY CURRENT USER
exports.getMyQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const questions = await Question.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments({ createdBy: req.user._id });

    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// INCREMENT USAGE COUNT
exports.incrementUsage = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await question.incrementUsage();

    res.json({
      message: "Usage count incremented",
      usageCount: question.usageCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
