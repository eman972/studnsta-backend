const StudyGroup = require("../models/StudyGroup");
const Event = require("../models/Event");
const Club = require("../models/Club");
const AuditLog = require("../models/AuditLog");
const User = require("../models/user");
const QuizResult = require("../models/QuizResult");
const Post = require("../models/Post");
const Note = require("../models/Note");
const AiChat = require("../models/AiChat");
const Question = require("../models/Question");

// ---- Study groups ----
exports.createStudyGroup = async (req, res) => {
  const group = await StudyGroup.create({
    ...req.body,
    owner: req.user.id,
    members: [req.user.id],
  });
  res.status(201).json({ group });
};

exports.joinStudyGroup = async (req, res) => {
  const group = await StudyGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Not found" });
  if (group.members.length >= group.maxSize) {
    return res.status(400).json({ message: "Group full" });
  }
  if (!group.members.map(String).includes(req.user.id.toString())) {
    group.members.push(req.user.id);
    await group.save();
  }
  res.json({ group });
};

exports.updateWhiteboard = async (req, res) => {
  const group = await StudyGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Not found" });
  group.whiteboard = req.body.whiteboard || "";
  await group.save();
  const io = req.app.get("io");
  if (io) io.to(`group:${group._id}`).emit("whiteboard", group.whiteboard);
  res.json({ group });
};

exports.listStudyGroups = async (req, res) => {
  const groups = await StudyGroup.find().populate("owner members", "name avatar");
  res.json({ groups });
};

// ---- Events / calendar ----
exports.createEvent = async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ event });
};

exports.listEvents = async (req, res) => {
  const events = await Event.find({
    $or: [{ createdBy: req.user.id }, { attendees: req.user.id }],
  }).sort({ start: 1 });
  res.json({ events });
};

exports.exportIcs = async (req, res) => {
  const events = await Event.find({
    $or: [{ createdBy: req.user.id }, { attendees: req.user.id }],
  });
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Studnsta//EN"];
  events.forEach((e) => {
    const start = e.start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e._id}@studnsta`);
    lines.push(`DTSTART:${start}`);
    lines.push(`SUMMARY:${e.title}`);
    lines.push(`DESCRIPTION:${(e.description || "").replace(/\n/g, "\\n")}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  res.setHeader("Content-Type", "text/calendar");
  res.send(lines.join("\r\n"));
};

// ---- Clubs ----
exports.createClub = async (req, res) => {
  const club = await Club.create({
    ...req.body,
    owner: req.user.id,
    members: [req.user.id],
  });
  res.status(201).json({ club });
};

exports.listClubs = async (req, res) => {
  const clubs = await Club.find().populate("owner", "name");
  res.json({ clubs });
};

exports.joinClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club.members.map(String).includes(req.user.id.toString())) {
    club.members.push(req.user.id);
    await club.save();
  }
  res.json({ club });
};


// Admin controllers removed

// ---- Mastery map ----
exports.masteryMap = async (req, res) => {
  const results = await QuizResult.find({
    studentId: req.user.id,
  }).sort({ completedAt: -1 });
  const map = {};
  results.forEach((r) => {
    const key = `${r.subject || "General"}::${r.topic || "General"}`;
    if (!map[key]) map[key] = { scores: [], subject: r.subject, topic: r.topic };
    map[key].scores.push(r.score ?? 0);
  });
  const mastery = Object.values(map).map((m) => {
    const avg = Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length);
    return {
      subject: m.subject,
      topic: m.topic,
      average: avg,
      attempts: m.scores.length,
      level: avg >= 85 ? "mastered" : avg >= 70 ? "proficient" : avg >= 50 ? "learning" : "needs-work",
    };
  });
  res.json({ mastery });
};

exports.weeklyStudyPlan = async (req, res) => {
  const results = await QuizResult.find({ studentId: req.user.id }).limit(50);
  const weak = {};
  results.forEach((r) => {
    if ((r.score || 0) < 70) {
      const k = r.topic || r.subject || "General";
      weak[k] = (weak[k] || 0) + 1;
    }
  });
  const topics = Object.keys(weak).slice(0, 5);
  const plan = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
    day,
    focus: topics[i % Math.max(topics.length, 1)] || "Review notes",
    minutes: 30 + (i % 3) * 15,
  }));
  res.json({ plan, weakTopics: topics });
};

// ---- Search ----
exports.search = async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ users: [], notes: [], posts: [], quizzes: [] });
  const rx = { $regex: q, $options: "i" };
  const [users, notes, posts] = await Promise.all([
    User.find({ $or: [{ name: rx }, { email: rx }], isDeleted: { $ne: true } })
      .select("name role avatar")
      .limit(10),
    Note.find({ $or: [{ title: rx }, { subject: rx }, { topic: rx }] }).limit(10),
    Post.find({ content: rx }).limit(10),
  ]);
  res.json({ users, notes, posts, quizzes: [] });
};

// ---- Presence (memory) ----
const presence = new Map();
exports.heartbeat = async (req, res) => {
  presence.set(req.user.id.toString(), Date.now());
  res.json({ ok: true });
};
exports.online = async (req, res) => {
  const cutoff = Date.now() - 60 * 1000;
  const online = [...presence.entries()]
    .filter(([, t]) => t >= cutoff)
    .map(([id]) => id);
  res.json({ online });
};


exports.saveAiChat = async (userId, messages, subject, title) => {
  return AiChat.create({ user: userId, messages, subject, title });
};
