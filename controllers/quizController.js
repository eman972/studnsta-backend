const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, subject, topic, difficulty, duration, questions, tags } = req.body;

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question || !question.options || question.options.length !== 4 || question.correctAnswer === undefined) {
        return res.status(400).json({ 
          message: `Invalid question at index ${i}. Each question must have a question text, exactly 4 options, and a correct answer index` 
        });
      }
      if (question.correctAnswer < 0 || question.correctAnswer > 3) {
        return res.status(400).json({ 
          message: `Invalid correct answer index at question ${i}. Must be 0, 1, 2, or 3` 
        });
      }
    }

    const quiz = await Quiz.create({
      title,
      description,
      subject,
      topic,
      difficulty,
      duration,
      questions,
      tags: tags || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL QUIZZES (Filtered by user role and preferences)
exports.getAllQuizzes = async (req, res) => {
  try {
    const { subject, topic, difficulty, page = 1, limit = 10 } = req.query;
    
    let filter = { isPublished: true };
    
    // Apply filters
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quiz.countDocuments(filter);

    res.json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUIZ BY ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Don't send correct answers to students
    if (req.user.role === "student") {
      const quizForStudent = quiz.toObject();
      quizForStudent.questions = quiz.questions.map(q => ({
        ...q.toObject(),
        correctAnswer: undefined, // Remove correct answer
        explanation: undefined,  // Remove explanation
      }));
      return res.json(quizForStudent);
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE QUIZ (Teachers only, only their own quizzes)
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only quiz creators can update their quizzes" });
    }

    const { title, description, subject, topic, difficulty, duration, questions, tags, isPublished } = req.body;

    // Validate questions if provided
    if (questions) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.question || !question.options || question.options.length !== 4 || question.correctAnswer === undefined) {
          return res.status(400).json({ 
            message: `Invalid question at index ${i}. Each question must have a question text, exactly 4 options, and a correct answer index` 
          });
        }
      }
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        subject,
        topic,
        difficulty,
        duration,
        questions,
        tags,
        isPublished,
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Quiz updated successfully",
      quiz: updatedQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE QUIZ (Teachers only, only their own quizzes)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only quiz creators can delete their quizzes" });
    }

    // Also delete all attempts for this quiz
    await QuizAttempt.deleteMany({ quiz: req.params.id });

    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUIZZES CREATED BY CURRENT USER (Teachers)
exports.getMyQuizzes = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their created quizzes" });
    }

    const { page = 1, limit = 10 } = req.query;

    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quiz.countDocuments({ createdBy: req.user._id });

    res.json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLISH/UNPUBLISH QUIZ (Teachers only)
exports.toggleQuizPublish = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString() || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only quiz creators can publish/unpublish their quizzes" });
    }

    quiz.isPublished = !quiz.isPublished;
    await quiz.save();

    res.json({
      message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'} successfully`,
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
