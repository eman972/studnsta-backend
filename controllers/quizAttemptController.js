const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

// START QUIZ ATTEMPT
exports.startQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: "Quiz is not published yet" });
    }

    const existingAttempt = await QuizAttempt.findOne({
      quiz: quizId,
      student: req.user._id,
      status: "In Progress",
    });

    if (existingAttempt) {
      return res.status(400).json({
        message: "You already have an in-progress attempt for this quiz",
        attempt: existingAttempt,
      });
    }

    const attempt = await QuizAttempt.create({
      quiz: quizId,
      student: req.user._id,
      totalQuestions: quiz.questions.length,
      correctAnswers: 0,
      score: 0,
      percentage: 0,
      status: "In Progress",
    });

    // Return quiz questions without correct answers for students
    const questionsForStudent = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
    }));

    res.status(201).json({
      message: "Quiz attempt started",
      attempt,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        duration: quiz.duration,
        questions: questionsForStudent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUBMIT QUIZ ATTEMPT
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    if (attempt.student.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only submit your own attempt" });
    }

    if (attempt.status !== "In Progress") {
      return res
        .status(400)
        .json({ message: "This attempt has already been submitted" });
    }

    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Evaluate answers
    let correctAnswers = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect =
        question && answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: !!isCorrect,
        timeSpent: answer.timeSpent || 0,
      };
    });

    attempt.answers = processedAnswers;
    attempt.correctAnswers = correctAnswers;
    attempt.score = correctAnswers;
    attempt.percentage =
      quiz.questions.length > 0
        ? Math.round((correctAnswers / quiz.questions.length) * 100)
        : 0;
    attempt.status = "Submitted";
    attempt.endTime = new Date();

    await attempt.save();

    res.json({
      message: "Quiz submitted successfully",
      attempt: {
        id: attempt._id,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        grade: attempt.grade,
        timeTaken: attempt.timeTaken,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ATTEMPT BY ID
exports.getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId)
      .populate("quiz", "title subject topic questions")
      .populate("student", "name email");

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (
      attempt.student._id.toString() !== req.user._id.toString() &&
      req.user.role !== "teacher"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this attempt" });
    }

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER'S ATTEMPTS
exports.getUserAttempts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate("quiz", "title subject topic")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizAttempt.countDocuments({ student: req.user._id });

    res.json({
      attempts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL ATTEMPTS FOR A QUIZ (Teachers only)
exports.getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (
      quiz.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "teacher"
    ) {
      return res
        .status(403)
        .json({ message: "Only quiz creators can view attempts" });
    }

    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizAttempt.countDocuments({ quiz: quizId });

    const stats = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: "Submitted" } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          avgPercentage: { $avg: "$percentage" },
          totalAttempts: { $sum: 1 },
          highestScore: { $max: "$score" },
          lowestScore: { $min: "$score" },
        },
      },
    ]);

    res.json({
      attempts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: stats[0] || {
        avgScore: 0,
        avgPercentage: 0,
        totalAttempts: 0,
        highestScore: 0,
        lowestScore: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUIZ STATISTICS (Teachers only)
exports.getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (
      quiz.createdBy.toString() !== req.user._id.toString() ||
      req.user.role !== "teacher"
    ) {
      return res
        .status(403)
        .json({ message: "Only quiz creators can view statistics" });
    }

    // Question-wise analysis
    const questionAnalysis = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: "Submitted" } },
      { $unwind: "$answers" },
      {
        $group: {
          _id: "$answers.questionIndex",
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
          avgTimeSpent: { $avg: "$answers.timeSpent" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Grade distribution — fixed: compute it here instead of referencing undefined variable
    const gradeAgg = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: "Submitted" } },
      { $group: { _id: "$grade", count: { $sum: 1 } } },
    ]);

    const gradeDistribution = {};
    gradeAgg.forEach((g) => {
      gradeDistribution[g._id || "Not Graded"] = g.count;
    });

    res.json({ questionAnalysis, gradeDistribution });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SAVE PROGRESS (Auto-save during quiz)
exports.saveProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, currentQuestionIndex } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    if (attempt.student.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only save your own progress" });
    }

    if (attempt.status !== "In Progress") {
      return res
        .status(400)
        .json({ message: "Cannot save progress for submitted attempt" });
    }

    if (answers) {
      attempt.answers = answers.map((answer, index) => ({
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: false,
        timeSpent: answer.timeSpent || 0,
      }));
    }

    await attempt.save();

    res.json({ message: "Progress saved successfully", attempt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
