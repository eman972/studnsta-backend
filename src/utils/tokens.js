const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || 30);

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_EXPIRES_DAYS);
  return d;
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    tagline: user.tagline,
    dailyStreak: user.dailyStreak,
    emailVerified: user.emailVerified,
    teacherVerified: user.teacherVerified,
    institution: user.institution,
    campus: user.campus,
    privacy: user.privacy,
    onboardingComplete: user.onboardingComplete,
    subjectsOfInterest: user.subjectsOfInterest,
    learningGoals: user.learningGoals,
    learningStyle: user.learningStyle,
    locale: user.locale,
    notificationPrefs: user.notificationPrefs,
    profileCompleteness: user.profileCompleteness,
    badges: user.badges,
  };
}

function calcProfileCompleteness(user) {
  let score = 0;
  const checks = [
    !!user.name,
    !!user.email,
    !!user.avatar,
    !!user.bio,
    !!user.tagline,
    !!user.institution,
    (user.subjectsOfInterest || []).length > 0,
    user.emailVerified,
  ];
  checks.forEach((ok) => {
    if (ok) score += 12.5;
  });
  return Math.min(100, Math.round(score));
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
  publicUser,
  calcProfileCompleteness,
  ACCESS_EXPIRES,
};
