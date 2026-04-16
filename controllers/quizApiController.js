const mongoose = require("mongoose");
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");

// GET UNIQUE SUBJECTS
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Question.distinct("subject");
    
    res.json({
      success: true,
      subjects: subjects.sort() // Sort alphabetically
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message
    });
  }
};

// GET UNIQUE TOPICS BY SUBJECT
exports.getTopicsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject parameter is required"
      });
    }
    
    const topics = await Question.distinct("topic", { subject });
    
    res.json({
      success: true,
      subject,
      topics: topics.sort() // Sort alphabetically
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching topics",
      error: error.message
    });
  }
};

// GET RANDOM QUESTIONS
exports.getQuestions = async (req, res) => {
  try {
    const { subject, topic, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    
    // Validate limit
    const questionLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 questions
    
    // Fetch random questions using aggregation
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: questionLimit } },
      {
        $project: {
          question: 1,
          options: 1,
          subject: 1,
          topic: 1,
          difficulty: 1,
          tags: 1,
          // Note: NOT sending correctAnswer to frontend
        }
      }
    ]);
    
    res.json({
      success: true,
      questions,
      count: questions.length,
      filters: { subject, topic, limit: questionLimit }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching questions",
      error: error.message
    });
  }
};

// SAVE QUIZ RESULT
exports.saveQuizResult = async (req, res) => {
  try {
    const userId = req.user._id; // Get logged-in user ID from auth middleware
    
    const {
      subject,
      topic,
      totalQuestions,
      correctAnswers,
      timeTaken,
      answers,
      status = "completed"
    } = req.body;
    
    // Validate required fields
    if (!subject || !topic || !totalQuestions || !timeTaken || !answers) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subject, topic, totalQuestions, timeTaken, answers"
      });
    }
    
    // Validate answers array
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answers array is required and cannot be empty"
      });
    }
    
    // Validate each answer structure
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      if (!answer.questionId || answer.selectedAnswer === undefined || typeof answer.isCorrect !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: `Invalid answer at index ${i}. Each answer must have questionId, selectedAnswer, and isCorrect`
        });
      }
    }
    
    // Calculate score percentage
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Create quiz result
    const quizResult = await QuizResult.create({
      studentId: userId,
      subject,
      topic,
      totalQuestions,
      correctAnswers,
      score,
      timeTaken,
      answers,
      status,
      completedAt: new Date()
    });
    
    // Populate user details for response
    const populatedResult = await QuizResult.findById(quizResult._id)
      .populate("studentId", "name email");
    
    res.status(201).json({
      success: true,
      message: "Quiz result saved successfully",
      quizResult: populatedResult.toAPIResponse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving quiz result",
      error: error.message
    });
  }
};

// GET QUIZ HISTORY
exports.getQuizHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, subject, topic } = req.query;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID parameter is required"
      });
    }
    
    // Check if user has access (students can only view their own history)
    if (req.user.role === "student" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own quiz history"
      });
    }
    
    // Build filter
    const filter = { studentId: userId };
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    
    // Convert pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;
    
    // Fetch quiz history
    const [quizHistory, total] = await Promise.all([
      QuizResult.find(filter)
        .populate("studentId", "name email")
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      QuizResult.countDocuments(filter)
    ]);
    
    // Calculate statistics
    const stats = await QuizResult.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: "$timeTaken" },
          completedQuizzes: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      }
    ]);
    
    const statistics = stats[0] || {
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      totalTime: 0,
      completedQuizzes: 0
    };
    
    res.json({
      success: true,
      quizHistory: quizHistory.map(result => result.toAPIResponse()),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        limit: limitNum
      },
      statistics: {
        totalQuizzes: statistics.totalQuizzes,
        averageScore: Math.round(statistics.averageScore),
        bestScore: statistics.bestScore,
        totalTime: statistics.totalTime,
        completedQuizzes: statistics.completedQuizzes,
        completionRate: statistics.totalQuizzes > 0 
          ? Math.round((statistics.completedQuizzes / statistics.totalQuizzes) * 100)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz history",
      error: error.message
    });
  }
};

// ADDITIONAL HELPER API: GET QUIZ STATISTICS
exports.getQuizStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check access
    if (req.user.role === "student" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own quiz statistics"
      });
    }
    
    // Subject-wise statistics
    const subjectStats = await QuizResult.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$subject",
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: "$timeTaken" },
          lastAttempt: { $max: "$completedAt" }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);
    
    // Topic-wise statistics for each subject
    const topicStats = await QuizResult.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            subject: "$subject",
            topic: "$topic"
          },
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" }
        }
      },
      { $sort: { "_id.subject": 1, averageScore: -1 } }
    ]);
    
    // Recent performance trend (last 10 quizzes)
    const recentResults = await QuizResult.find({ studentId: userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .select('score completedAt subject topic');
    
    res.json({
      success: true,
      subjectStats,
      topicStats,
      recentTrend: recentResults.map(result => result.toAPIResponse())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz statistics",
      error: error.message
    });
  }
};
