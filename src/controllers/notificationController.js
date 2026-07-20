const Notification = require("../models/Notification");
const { sendMail } = require("../utils/mailer");
const User = require("../models/user");

exports.list = async (req, res) => {
  const items = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications: items });
};

exports.markRead = async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, user: req.user.id },
    { read: true }
  );
  res.json({ message: "ok" });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ message: "ok" });
};

exports.unreadCount = async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    read: false,
  });
  res.json({ count });
};

/** Feature 43: email digest of unread */
exports.sendDigest = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.notificationPrefs?.digests) {
    return res.json({ message: "Digests disabled" });
  }
  const unread = await Notification.find({
    user: req.user.id,
    read: false,
  }).limit(20);
  if (!unread.length) return res.json({ message: "Nothing unread" });
  const text = unread.map((n) => `- ${n.title}`).join("\n");
  await sendMail({
    to: user.email,
    subject: `Studnsta: ${unread.length} unread notifications`,
    text,
  });
  res.json({ message: "Digest sent", count: unread.length });
};
