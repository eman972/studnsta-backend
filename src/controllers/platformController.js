const StudyGroup = require("../models/StudyGroup");
const Event = require("../models/Event");
const Club = require("../models/Club");
const Mentorship = require("../models/Mentorship");
const Report = require("../models/Report");
const FeatureFlag = require("../models/FeatureFlag");
const AuditLog = require("../models/AuditLog");
const User = require("../models/user");
const QuizResult = require("../models/QuizResult");
const Post = require("../models/Post");
const Note = require("../models/Note");
const NoteCollection = require("../models/NoteCollection");
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

// ---- Mentorship ----
exports.requestMentorship = async (req, res) => {
  const m = await Mentorship.create({
    mentor: req.body.mentorId,
    mentee: req.user.id,
    subject: req.body.subject,
  });
  res.status(201).json({ mentorship: m });
};

exports.respondMentorship = async (req, res) => {
  const m = await Mentorship.findById(req.params.id);
  if (!m || m.mentor.toString() !== req.user.id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }
  m.status = req.body.status;
  await m.save();
  res.json({ mentorship: m });
};

exports.listMentorships = async (req, res) => {
  const items = await Mentorship.find({
    $or: [{ mentor: req.user.id }, { mentee: req.user.id }],
  }).populate("mentor mentee", "name avatar");
  res.json({ mentorships: items });
};

// ---- Reports / moderation ----
exports.createReport = async (req, res) => {
  const report = await Report.create({ ...req.body, reporter: req.user.id });
  res.status(201).json({ report });
};

// (Removed listReports and resolveReport)

// ---- Feature flags ----
exports.listFlags = async (req, res) => {
  const flags = await FeatureFlag.find();
  res.json({ flags });
};

exports.upsertFlag = async (req, res) => {
  const flag = await FeatureFlag.findOneAndUpdate(
    { key: req.body.key },
    req.body,
    { upsert: true, new: true }
  );
  res.json({ flag });
};

exports.getFlag = async (req, res) => {
  const flag = await FeatureFlag.findOne({ key: req.params.key });
  res.json({ enabled: !!flag?.enabled, flag });
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

/** Feature 55: note collections */
exports.createCollection = async (req, res) => {
  const col = await NoteCollection.create({
    name: req.body.name,
    description: req.body.description,
    owner: req.user.id,
    notes: req.body.notes || [],
  });
  res.status(201).json({ collection: col });
};

exports.listCollections = async (req, res) => {
  const collections = await NoteCollection.find({ owner: req.user.id }).populate(
    "notes",
    "title subject topic"
  );
  res.json({ collections });
};

exports.addToCollection = async (req, res) => {
  const col = await NoteCollection.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });
  if (!col) return res.status(404).json({ message: "Not found" });
  if (!col.notes.map(String).includes(req.body.noteId)) {
    col.notes.push(req.body.noteId);
    await col.save();
  }
  res.json({ collection: col });
};

/** Feature 73: badges / certificates */
exports.myBadges = async (req, res) => {
  const user = await User.findById(req.user.id);
  const results = await QuizResult.find({ studentId: req.user.id });
  const badges = new Set(user.badges || []);
  if (results.length >= 1) badges.add("first-quiz");
  if (results.length >= 10) badges.add("quiz-warrior");
  if ((user.dailyStreak || 0) >= 7) badges.add("week-streak");
  if (results.some((r) => (r.score || 0) >= 100)) badges.add("perfect-score");
  user.badges = [...badges];
  await user.save();
  res.json({ badges: user.badges });
};

exports.transcript = async (req, res) => {
  const results = await QuizResult.find({ studentId: req.user.id }).sort({
    completedAt: -1,
  });
  const user = await User.findById(req.user.id).select("name email role institution");
  res.json({
    student: user,
    generatedAt: new Date().toISOString(),
    quizHistory: results,
  });
};

/** Feature 75: question contribution */
exports.suggestQuestion = async (req, res) => {
  const q = await Question.create({
    ...req.body,
    createdBy: req.user.id,
    status: "pending",
    isVerified: false,
  });
  res.status(201).json({ question: q });
};

exports.approveQuestion = async (req, res) => {
  const q = await Question.findByIdAndUpdate(
    req.params.id,
    { status: "approved", isVerified: true },
    { new: true }
  );
  res.json({ question: q });
};

/** Feature 44: web push subscription stub */
exports.savePushSubscription = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.notificationPrefs = {
    ...user.notificationPrefs?.toObject?.() || user.notificationPrefs || {},
    push: true,
    pushSubscription: req.body.subscription,
  };
  await user.save();
  res.json({ message: "Push subscription saved" });
};

/** Feature 72: attendance */
exports.checkIn = async (req, res) => {
  const { eventId } = req.body;
  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (!event.attendees.map(String).includes(req.user.id.toString())) {
    event.attendees.push(req.user.id);
    await event.save();
  }
  res.json({ event, checkedIn: true });
};

exports.saveAiChat = async (userId, messages, subject, title) => {
  return AiChat.create({ user: userId, messages, subject, title });
};
