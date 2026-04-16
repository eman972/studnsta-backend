const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: Number,
    required: true, // Index of the correct option (0, 1, 2, 3)
  },
  explanation: {
    type: String,
    default: "",
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  subject: {
    type: String,
    required: true,
    enum: ["Math", "Physics", "Chemistry", "Biology", "Computer", "English", "Urdu", "Pak Studies", "Islamiat"],
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
    default: 30,
  },
  timer: {
    type: Number, // Timer in minutes
    required: true,
    default: 30,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
  quizLink: {
    type: String,
    default: "",
    unique: true,
    sparse: true,
    index: true
  },
  liveSettings: {
    allowRetake: {
      type: Boolean,
      default: false,
    },
    showResults: {
      type: Boolean,
      default: true,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    randomizeOptions: {
      type: Boolean,
      default: true,
    }
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Virtual for total questions
quizSchema.virtual('totalQuestions').get(function() {
  return this.questions.length;
});

// Virtual for total marks (assuming 1 mark per question)
quizSchema.virtual('totalMarks').get(function() {
  return this.questions.length;
});

module.exports = mongoose.model("Quiz", quizSchema);
