const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const Question = require("../models/Question");

// CREATE LIVE QUIZ 
exports.createLiveQuiz = async (req, res) => {
  try {
    const { title, description, subject, topic, timer, questionIds } = req.body;

    // Validate required fields
    if (!title || !subject || !topic || !timer || !questionIds || questionIds.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate timer (in minutes)
    if (timer < 1 || timer > 180) {
      return res.status(400).json({ message: "Timer must be between 1 and 180 minutes" });
    }

    // Fetch questions by IDs
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: "Some questions not found" });
    }

    // Ensure all questions are from the same subject and topic
    const allSameSubject = questions.every(q => q.subject === subject);
    const allSameTopic = questions.every(q => q.topic === topic);
    
    if (!allSameSubject || !allSameTopic) {
      return res.status(400).json({ message: "All questions must be from the same subject and topic" });
    }

    // Create quiz with live status
    const quiz = await Quiz.create({
      title,
      description,
      subject,
      topic,
      difficulty: "mixed", // Live quizzes can have mixed difficulty
      duration: timer,
      questions: questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        questionId: q._id // Reference to original question
      })),
      createdBy: req.user._id,
      isPublished: true,
      isLive: true, // New field for live quizzes
      liveSettings: {
        allowRetake: false,
        showResults: true,
        randomizeQuestions: false,
        randomizeOptions: true
      },
      tags: ["live", "teacher-created"]
    });

    // Generate unique quiz link
    const quizLink = `/quiz/live/${quiz._id}`;

    res.status(201).json({
      message: "Live quiz created successfully",
      quiz: {
        id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        timer: quiz.duration,
        questionCount: quiz.questions.length,
        quizLink,
        createdAt: quiz.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET LIVE QUIZ BY ID (for students)
exports.getLiveQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate("createdBy", "name email")
      .select("-questions.correctAnswer -questions.explanation"); // Hide answers from students

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.isLive) {
      return res.status(400).json({ message: "This is not a live quiz" });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: "Quiz is not active" });
    }

    // Prepare quiz data for students (without correct answers)
    const quizForStudents = {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      topic: quiz.topic,
      duration: quiz.duration,
      questionCount: quiz.questions.length,
      createdBy: quiz.createdBy,
      liveSettings: quiz.liveSettings,
      questions: quiz.questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        options: q.options
        // Note: correctAnswer and explanation are excluded
      }))
    };

    res.json({
      success: true,
      quiz: quizForStudents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUBMIT LIVE QUIZ RESULTS
exports.submitLiveQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Answers are required" });
    }

    // Get student ID from authenticated user
    const studentId = req.user._id;

    // Get the quiz to validate and get correct answers
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.isLive) {
      return res.status(400).json({ message: "This is not a live quiz" });
    }

    // Check if student already attempted this quiz
    const existingAttempt = await QuizResult.findOne({
      studentId,
      subject: quiz.subject,
      topic: quiz.topic,
      status: "completed"
    });

    if (existingAttempt && !quiz.liveSettings.allowRetake) {
      return res.status(403).json({ message: "You have already attempted this quiz" });
    }

    // Calculate results
    let correctAnswers = 0;
    const processedAnswers = [];

    for (let i = 0; i < Math.min(answers.length, quiz.questions.length); i++) {
      const userAnswer = answers[i];
      const question = quiz.questions[i];
      const isCorrect = userAnswer.selectedAnswer === question.correctAnswer;
      
      if (isCorrect) correctAnswers++;

      processedAnswers.push({
        questionId: question.questionId,
        selectedAnswer: userAnswer.selectedAnswer,
        isCorrect,
        timeSpent: userAnswer.timeSpent || 0
      });
    }

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // Save quiz result
    const quizResult = await QuizResult.create({
      studentId,
      subject: quiz.subject,
      topic: quiz.topic,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      score,
      timeTaken: timeTaken || quiz.duration * 60, // Default to quiz duration if not provided
      answers: processedAnswers,
      status: "completed",
      quizType: "live",
      tags: ["live", quiz._id.toString()] // Tag with quiz ID for tracking
    });

    // Populate student details
    const populatedResult = await QuizResult.findById(quizResult._id)
      .populate("studentId", "name email");

    res.status(201).json({
      success: true,
      message: "Quiz results submitted successfully",
      results: {
        id: populatedResult._id,
        score: populatedResult.score,
        correctAnswers: populatedResult.correctAnswers,
        totalQuestions: populatedResult.totalQuestions,
        timeTaken: populatedResult.timeTaken,
        grade: populatedResult.getPerformanceLevel(),
        completedAt: populatedResult.completedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET LIVE QUIZ RESULTS (for teachers)
exports.getLiveQuizResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Get the quiz first
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only quiz creators can view results" });
    }

    // Get all results for this live quiz
    const results = await QuizResult.find({
      tags: id.toString(),
      status: "completed"
    })
    .populate("studentId", "name email")
    .sort({ score: -1, timeTaken: 1 }) // Sort by score desc, time asc
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await QuizResult.countDocuments({
      tags: id.toString(),
      status: "completed"
    });

    // Calculate statistics
    const stats = await QuizResult.aggregate([
      { $match: { tags: id.toString(), status: "completed" } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          worstScore: { $min: "$score" },
          averageTime: { $avg: "$timeTaken" },
          averageCorrect: { $avg: "$correctAnswers" }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalParticipants: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      averageTime: 0,
      averageCorrect: 0
    };

    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        questionCount: quiz.questions.length,
        duration: quiz.duration
      },
      results: results.map(result => ({
        id: result._id,
        student: result.studentId,
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeTaken: result.timeTaken,
        grade: result.getPerformanceLevel(),
        completedAt: result.completedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        limit: parseInt(limit)
      },
      statistics: {
        totalParticipants: statistics.totalParticipants,
        averageScore: Math.round(statistics.averageScore),
        bestScore: statistics.bestScore,
        worstScore: statistics.worstScore,
        averageTime: Math.round(statistics.averageTime),
        averageCorrect: Math.round(statistics.averageCorrect)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TEACHER'S LIVE QUIZZES
exports.getTeacherLiveQuizzes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Build filter
    const filter = { 
      createdBy: req.user._id,
      isLive: true 
    };

    if (status === "active") {
      filter.isPublished = true;
    } else if (status === "draft") {
      filter.isPublished = false;
    }

    const quizzes = await Quiz.find(filter)
      .select("title subject topic duration questions isPublished createdAt tags")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quiz.countDocuments(filter);

    // Get participant counts for each quiz
    const quizIds = quizzes.map(q => q._id);
    const participantCounts = await QuizResult.aggregate([
      { $match: { tags: { $in: quizIds }, status: "completed" } },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of quiz ID to participant count
    const participantMap = {};
    participantCounts.forEach(item => {
      if (Array.isArray(item._id)) {
        item._id.forEach(quizId => {
          participantMap[quizId] = (participantMap[quizId] || 0) + item.count;
        });
      }
    });

    res.json({
      success: true,
      quizzes: quizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        duration: quiz.duration,
        questionCount: quiz.questions.length,
        isPublished: quiz.isPublished,
        participants: participantMap[quiz._id.toString()] || 0,
        quizLink: `/quiz/live/${quiz._id}`,
        createdAt: quiz.createdAt,
        tags: quiz.tags
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LIVE QUIZ SETTINGS
exports.updateLiveQuizSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublished, liveSettings } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only quiz creators can update settings" });
    }

    if (!quiz.isLive) {
      return res.status(400).json({ message: "This is not a live quiz" });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (liveSettings) updateData.liveSettings = liveSettings;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("title subject topic duration isPublished liveSettings");

    res.json({
      success: true,
      message: "Quiz settings updated successfully",
      quiz: updatedQuiz
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
