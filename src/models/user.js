const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    tagline: { type: String, default: "" },
    activeNote: { type: String, default: "" },
    dailyStreak: { type: Number, default: 0 },
    lastQuizDate: { type: Date, default: null },

    // Phase 0–1 identity
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    refreshTokens: [
      {
        token: String,
        device: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
    tokenVersion: { type: Number, default: 0 },
    institution: { type: String, default: "" },
    campus: { type: String, default: "" },
    teacherVerified: { type: Boolean, default: false },
    teacherInviteCode: { type: String, default: null },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    privacy: {
      type: String,
      enum: ["public", "classmates", "private"],
      default: "public",
    },
    notificationPrefs: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      digests: { type: Boolean, default: true },
      pushSubscription: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    onboardingComplete: { type: Boolean, default: false },
    subjectsOfInterest: [{ type: String }],
    learningGoals: [{ type: String }],
    learningStyle: {
      type: String,
      enum: ["visual", "practice-first", "reading", "mixed"],
      default: "mixed",
    },
    locale: { type: String, default: "en" },
    isDeactivated: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    aiQuotaUsed: { type: Number, default: 0 },
    aiQuotaResetAt: { type: Date, default: null },
    badges: [{ type: String }],
    profileCompleteness: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
