const mongoose = require("mongoose"); // ← was missing, causing crashes
const QuizResult = require("../models/QuizResult");
const Question = require("../models/Question");

// CREATE QUIZ RESULT
exports.createQuizResult = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      topic,
      totalQuestions,
      correctAnswers,
      score,
      timeTaken,
      answers,
      status,
      difficulty,
      quizType,
      tags,
    } = req.body;

    if (
      !studentId ||
      !subject ||
      !topic ||
      !totalQuestions ||
      !timeTaken ||
      !answers
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Answers array is required" });
    }

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      if (
        !answer.questionId ||
        !answer.selectedAnswer ||
        typeof answer.isCorrect !== "boolean"
      ) {
        return res.status(400).json({
          message: `Invalid answer at index ${i}. Each answer must have questionId, selectedAnswer, and isCorrect`,
        });
      }
    }

    let calculatedScore = score;
    if (calculatedScore === undefined) {
      calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
    }

    const quizResult = await QuizResult.create({
      studentId,
      subject,
      topic,
      totalQuestions,
      correctAnswers,
      score: calculatedScore,
      timeTaken,
      answers,
      status: status || "completed",
      difficulty: difficulty || "medium",
      quizType: quizType || "practice",
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim())
        : [],
    });

    const populatedResult = await QuizResult.findById(quizResult._id).populate(
      "studentId",
      "name email",
    );

    res.status(201).json({
      message: "Quiz result created successfully",
      quizResult: populatedResult.toAPIResponse(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL QUIZ RESULTS (with filtering)
exports.getAllQuizResults = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      topic,
      status,
      difficulty,
      quizType,
      page = 1,
      limit = 20,
    } = req.query;

    let filter = {};
    if (studentId) filter.studentId = studentId;
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;
    if (quizType) filter.quizType = quizType;

    const quizResults = await QuizResult.find(filter)
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizResult.countDocuments(filter);

    res.json({
      quizResults: quizResults.map((result) => result.toAPIResponse()),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUIZ RESULT BY ID
exports.getQuizResultById = async (req, res) => {
  try {
    const quizResult = await QuizResult.findById(req.params.id).populate(
      "studentId",
      "name email",
    );

    if (!quizResult) {
      return res.status(404).json({ message: "Quiz result not found" });
    }

    res.json(quizResult.toAPIResponse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STUDENT'S QUIZ RESULTS
exports.getStudentQuizResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      subject,
      topic,
      status,
      difficulty,
      page = 1,
      limit = 20,
    } = req.query;

    if (req.user.role === "student" && studentId !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only view your own quiz results" });
    }

    let filter = { studentId };
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;

    const quizResults = await QuizResult.find(filter)
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizResult.countDocuments(filter);

    res.json({
      quizResults: quizResults.map((result) => result.toAPIResponse()),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CURRENT USER'S QUIZ RESULTS
exports.getMyQuizResults = async (req, res) => {
  try {
    const {
      subject,
      topic,
      status,
      difficulty,
      quizType,
      page = 1,
      limit = 20,
    } = req.query;

    let filter = { studentId: req.user._id };
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;
    if (quizType) filter.quizType = quizType;

    const quizResults = await QuizResult.find(filter)
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizResult.countDocuments(filter);

    res.json({
      quizResults: quizResults.map((result) => result.toAPIResponse()),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE QUIZ RESULT
exports.updateQuizResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { score, feedback } = req.body;

    const result = await QuizResult.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Quiz result not found" });
    }

    if (score !== undefined) result.score = score;
    if (feedback !== undefined) result.feedback = feedback;

    await result.save();

    res.json({ message: "Quiz result updated successfully", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE QUIZ RESULT
exports.deleteQuizResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await QuizResult.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Quiz result not found" });
    }

    await QuizResult.findByIdAndDelete(resultId);

    res.json({ message: "Quiz result deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TOP SCORES
exports.getTopScores = async (req, res) => {
  try {
    const { subject, topic, limit = 10 } = req.query;

    const topScores = await QuizResult.getTopScores(
      subject,
      topic,
      parseInt(limit),
    );

    res.json({ topScores: topScores.map((result) => result.toAPIResponse()) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STUDENT SUBJECT STATISTICS
exports.getStudentSubjectStats = async (req, res) => {
  try {
    const { studentId, subject } = req.params;

    if (req.user.role === "student" && studentId !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only view your own statistics" });
    }

    const stats = await QuizResult.getSubjectStats(studentId, subject);

    res.json({ studentId, subject, topicStats: stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER PERFORMANCE OVERVIEW
exports.getUserPerformanceOverview = async (req, res) => {
  try {
    const studentId =
      req.user.role === "student"
        ? req.user._id
        : req.params.studentId || req.user._id;

    if (
      req.user.role === "student" &&
      studentId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own performance overview" });
    }

    const overallStats = await QuizResult.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          avgScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: "$timeTaken" },
          avgTimePerQuiz: { $avg: "$timeTaken" },
          completedQuizzes: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledQuizzes: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    const subjectStats = await QuizResult.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: "$subject",
          totalQuizzes: { $sum: 1 },
          avgScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          lastAttempt: { $max: "$completedAt" },
        },
      },
      { $sort: { avgScore: -1 } },
    ]);

    const recentResults = await QuizResult.find({ studentId })
      .sort({ completedAt: -1 })
      .limit(10)
      .select("score completedAt subject topic");

    res.json({
      overview: overallStats[0] || {
        totalQuizzes: 0,
        avgScore: 0,
        bestScore: 0,
        totalTime: 0,
        avgTimePerQuiz: 0,
        completedQuizzes: 0,
        cancelledQuizzes: 0,
      },
      subjectStats,
      recentTrend: recentResults.map((result) => result.toAPIResponse()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
