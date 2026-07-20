const Class = require("../models/Class");
const crypto = require("crypto");
const Notification = require("../models/Notification");

function makeJoinCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

exports.createClass = async (req, res) => {
  try {
    const { name, description, subject } = req.body;
    const joinCode = makeJoinCode();
    const klass = await Class.create({
      name,
      description,
      subject,
      teacher: req.user.id,
      joinCode,
      members: [req.user.id],
    });
    res.status(201).json({ class: klass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const klass = await Class.findOne({ joinCode: joinCode?.toUpperCase() });
    if (!klass) return res.status(404).json({ message: "Invalid join code" });
    if (!klass.members.map(String).includes(req.user.id.toString())) {
      klass.members.push(req.user.id);
      await klass.save();
    }
    res.json({ class: klass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.myClasses = async (req, res) => {
  const classes = await Class.find({
    $or: [{ teacher: req.user.id }, { members: req.user.id }],
    isArchived: false,
  }).populate("teacher", "name avatar");
  res.json({ classes });
};

exports.getClass = async (req, res) => {
  const klass = await Class.findById(req.params.id)
    .populate("teacher", "name avatar")
    .populate("members", "name avatar role");
  if (!klass) return res.status(404).json({ message: "Not found" });
  res.json({ class: klass });
};

exports.announce = async (req, res) => {
  const klass = await Class.findById(req.params.id);
  if (!klass) return res.status(404).json({ message: "Not found" });
  if (klass.teacher.toString() !== req.user.id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Teachers only" });
  }
  klass.announcements.unshift({
    author: req.user.id,
    body: req.body.body,
    pinned: !!req.body.pinned,
  });
  await klass.save();
  await Notification.insertMany(
    klass.members
      .filter((m) => m.toString() !== req.user.id.toString())
      .map((m) => ({
        user: m,
        type: "announcement",
        title: `Announcement in ${klass.name}`,
        body: req.body.body?.slice(0, 120),
        link: `/classes/${klass._id}`,
      }))
  );
  res.json({ class: klass });
};

exports.addFile = async (req, res) => {
  const klass = await Class.findById(req.params.id);
  if (!klass) return res.status(404).json({ message: "Not found" });
  const url = req.file ? `/uploads/${req.file.filename}` : req.body.url;
  klass.files.push({
    name: req.body.name || req.file?.originalname || "file",
    url,
    uploadedBy: req.user.id,
  });
  await klass.save();
  res.json({ class: klass });
};

exports.roster = async (req, res) => {
  const klass = await Class.findById(req.params.id).populate(
    "members",
    "name email avatar role"
  );
  if (!klass) return res.status(404).json({ message: "Not found" });
  res.json({ roster: klass.members, joinCode: klass.joinCode });
};
