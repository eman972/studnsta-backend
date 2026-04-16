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

    // Check if user already has an in-progress attempt for this quiz
    const existingAttempt = await QuizAttempt.findOne({
      quiz: quizId,
      student: req.user._id,
      status: "In Progress"
    });

    if (existingAttempt) {
      return res.status(400).json({ 
        message: "You already have an in-progress attempt for this quiz",
        attempt: existingAttempt
      });
    }

    // Create new attempt
    const attempt = await QuizAttempt.create({
      quiz: quizId,
      student: req.user._id,
      answers: quiz.questions.map((_, index) => ({
        questionIndex: index,
        selectedAnswer: -1, // -1 means not answered yet
        isCorrect: false,
        timeSpent: 0
      })),
      totalQuestions: quiz.questions.length,
      score: 0,
      correctAnswers: 0,
      percentage: 0,
      status: "In Progress",
      startTime: new Date(),
    });

    // Return quiz without correct answers for students
    let quizForAttempt = quiz.toObject();
    if (req.user.role === "student") {
      quizForAttempt.questions = quiz.questions.map(q => ({
        ...q.toObject(),
        correctAnswer: undefined,
        explanation: undefined,
      }));
    }

    res.status(201).json({
      message: "Quiz attempt started successfully",
      attempt,
      quiz: quizForAttempt,
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

    const attempt = await QuizAttempt.findById(attemptId).populate("quiz");
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // Check if user owns this attempt
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only submit your own attempts" });
    }

    // Check if attempt is already submitted
    if (attempt.status === "Submitted") {
      return res.status(400).json({ message: "This attempt has already been submitted" });
    }

    // Validate answers
    if (!answers || answers.length !== attempt.quiz.questions.length) {
      return res.status(400).json({ message: "Invalid answers format" });
    }

    // Calculate score
    let correctCount = 0;
    const processedAnswers = answers.map((answer, index) => {
      const isCorrect = answer.selectedAnswer === attempt.quiz.questions[index].correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });

    // Update attempt
    attempt.answers = processedAnswers;
    attempt.correctAnswers = correctCount;
    attempt.score = correctCount;
    attempt.percentage = (correctCount / attempt.totalQuestions) * 100;
    attempt.status = "Submitted";
    attempt.endTime = new Date();

    await attempt.save();

    // Get detailed results with explanations
    const results = attempt.quiz.questions.map((question, index) => {
      const userAnswer = processedAnswers[index];
      return {
        question: question.question,
        userAnswer: question.options[userAnswer.selectedAnswer],
        correctAnswer: question.options[question.correctAnswer],
        isCorrect: userAnswer.isCorrect,
        explanation: question.explanation,
        timeSpent: userAnswer.timeSpent
      };
    });

    res.json({
      message: "Quiz submitted successfully",
      attempt: {
        ...attempt.toObject(),
        results
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
      .populate("quiz", "title subject difficulty duration")
      .populate("student", "name email");

    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // Check if user has access to this attempt
    if (req.user.role === "student") {
      if (attempt.student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only view your own attempts" });
      }
    }

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER'S QUIZ ATTEMPTS
exports.getUserAttempts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let filter = { student: req.user._id };
    if (status) filter.status = status;

    const attempts = await QuizAttempt.find(filter)
      .populate("quiz", "title subject difficulty")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizAttempt.countDocuments(filter);

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

// GET ATTEMPTS FOR A QUIZ (Teachers only)
exports.getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user owns this quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString() || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only quiz creators can view attempts" });
    }

    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuizAttempt.countDocuments({ quiz: quizId });

    // Calculate statistics
    const stats = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: "Submitted" } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          avgPercentage: { $avg: "$percentage" },
          totalAttempts: { $sum: 1 },
          highestScore: { $max: "$score" },
          lowestScore: { $min: "$score" }
        }
      }
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
        lowestScore: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET QUIZ STATISTICS (Teachers only)
exports.getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Check if user owns this quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString() || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only quiz creators can view statistics" });
    }

    // Question-wise analysis
    const questionAnalysis = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: "Submitted" } },
      { $unwind: "$answers" },
      {
        $group: {
          _id: "$answers.questionIndex",
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: { $cond: ["$answers.isCorrect", 1, 0] }
          },
          avgTimeSpent: { $avg: "$answers.timeSpent" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      questionAnalysis,
      gradeDistribution,
    });
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
      return res.status(403).json({ message: "You can only save your own progress" });
    }

    if (attempt.status !== "In Progress") {
      return res.status(400).json({ message: "Cannot save progress for submitted attempt" });
    }

    // Update answers
    if (answers) {
      attempt.answers = answers.map((answer, index) => ({
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: false, // Will be calculated on submission
        timeSpent: answer.timeSpent || 0
      }));
    }

    await attempt.save();

    res.json({
      message: "Progress saved successfully",
      attempt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
