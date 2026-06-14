// CREATE QUIZ FOR ANY USER
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, subject, topic, difficulty, duration, timer, questionIds } = req.body;

    // Validate required fields
    if (!title || !subject || !topic || !questionIds || questionIds.length === 0) {
      return res.status(400).json({ 
        message: "Title, subject, topic, and at least one question are required" 
      });
    }

    // Fetch questions by IDs
    const questions = await Question.find({ _id: { $in: questionIds } });
    
    // Generate unique quiz link
    const quizLink = Math.random().toString(36).substring(2, 8);

    const quiz = new Quiz({
      title,
      description,
      subject,
      topic,
      difficulty,
      duration,
      timer,
      questions: questionIds, // Store question IDs instead of embedded questions
      createdBy: req.user._id,
      quizLink, // For easy access
      isPublished: false // Draft mode by default
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
      quizLink
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GENERATE UNIQUE QUIZ LINK
exports.generateQuizLink = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    // Generate new link if needed
    if (!quiz.quizLink) {
      const newLink = Math.random().toString(36).substring(2, 8);
      quiz.quizLink = newLink;
      await quiz.save();
    }

    res.json({
      success: true,
      quizLink: quiz.quizLink
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
