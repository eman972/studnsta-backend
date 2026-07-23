const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendMail } = require("../utils/mailer");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
  publicUser,
  calcProfileCompleteness,
} = require("../utils/tokens");

async function attachRefresh(user, device = "web") {
  const raw = generateRefreshToken();
  user.refreshTokens = (user.refreshTokens || []).filter(
    (t) => t.expiresAt && t.expiresAt > new Date()
  );
  user.refreshTokens.push({
    token: hashToken(raw),
    device,
    expiresAt: refreshExpiryDate(),
  });
  // keep last 5 devices
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();
  return raw;
}

function authPayload(user, accessToken, refreshToken) {
  return {
    token: accessToken,
    refreshToken,
    user: publicUser(user),
  };
}

// REGISTER (+ email verification token)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, institution, inviteCode } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let finalRole = ["student", "teacher"].includes(role) ? role : "student";

    let teacherVerified = false;
    if (finalRole === "teacher") {
      const expected = process.env.TEACHER_INVITE_CODE || "TEACH-STUDNSTA";
      teacherVerified = inviteCode === expected;
      if (!teacherVerified && process.env.REQUIRE_TEACHER_INVITE === "true") {
        return res.status(400).json({ message: "Invalid teacher invite code" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyRaw = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      institution: institution || "",
      teacherVerified: finalRole === "teacher" ? teacherVerified : false,
      emailVerifyToken: hashToken(verifyRaw),
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      profileCompleteness: 25,
    });

    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    await sendMail({
      to: email,
      subject: "Verify your Studnsta email",
      text: `Verify: ${frontend}/verify-email?token=${verifyRaw}`,
      html: `<p>Welcome to Studnsta!</p><p><a href="${frontend}/verify-email?token=${verifyRaw}">Verify email</a></p>`,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await attachRefresh(user, req.headers["user-agent"] || "web");

    res.status(201).json({
      message: "User registered successfully. Check email to verify.",
      ...authPayload(user, accessToken, refreshToken),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.isDeleted) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.isDeactivated) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await attachRefresh(user, req.headers["user-agent"] || "web");

    res.json({
      message: "Login successful",
      ...authPayload(user, accessToken, refreshToken),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 2: refresh token rotation */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken required" });
    }
    const hashed = hashToken(refreshToken);
    const user = await User.findOne({ "refreshTokens.token": hashed });
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const entry = user.refreshTokens.find((t) => t.token === hashed);
    if (!entry || entry.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    // rotate
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashed);
    const accessToken = generateAccessToken(user);
    const newRefresh = await attachRefresh(user, entry.device || "web");
    res.json(authPayload(user, accessToken, newRefresh));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshTokens");
    if (!user) return res.status(404).json({ message: "User not found" });
    user.profileCompleteness = calcProfileCompleteness(user);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/** Feature 19: session list + remote logout */
exports.listSessions = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({
    sessions: (user.refreshTokens || []).map((t, i) => ({
      id: i,
      device: t.device,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
    })),
  });
};

exports.revokeSession = async (req, res) => {
  const idx = Number(req.params.index);
  const user = await User.findById(req.user.id);
  if (!user.refreshTokens[idx]) {
    return res.status(404).json({ message: "Session not found" });
  }
  user.refreshTokens.splice(idx, 1);
  await user.save();
  res.json({ message: "Session revoked" });
};

exports.revokeAllSessions = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.refreshTokens = [];
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ message: "All sessions revoked" });
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await User.updateOne(
        { _id: req.user.id },
        { $pull: { refreshTokens: { token: hashed } } }
      );
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
