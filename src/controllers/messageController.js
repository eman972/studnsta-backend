const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/user");
const { requireObjectId } = require("../utils/ids");

function dmConversationId(a, b) {
  return [a.toString(), b.toString()].sort().join(":");
}

exports.sendDM = async (req, res) => {
  const { recipientId, body } = req.body;
  if (!recipientId || !body?.trim()) {
    return res.status(400).json({ message: "recipientId and body required" });
  }

  requireObjectId(recipientId, "recipientId");

  if (recipientId === req.user.id.toString()) {
    return res.status(400).json({ message: "Cannot message yourself" });
  }

  const recipient = await User.findById(recipientId).select("_id name");
  if (!recipient) {
    return res.status(404).json({ message: "Recipient not found" });
  }

  const conversationId = dmConversationId(req.user.id, recipientId);
  const msg = await Message.create({
    conversationId,
    sender: req.user.id,
    recipient: recipientId,
    body: String(body).trim().slice(0, 5000),
    readBy: [req.user.id],
  });

  await Notification.create({
    user: recipientId,
    type: "dm",
    title: `Message from ${req.user.name}`,
    body: String(body).trim().slice(0, 100),
    link: `/messages/${req.user.id}`,
  });

  const io = req.app.get("io");
  if (io) io.to(`user:${recipientId}`).emit("dm", msg);

  res.status(201).json({ message: msg });
};

exports.sendClassChat = async (req, res) => {
  const { classId, body } = req.body;
  if (!classId || !body?.trim()) {
    return res.status(400).json({ message: "classId and body required" });
  }
  requireObjectId(classId, "classId");

  const conversationId = `class:${classId}`;
  const msg = await Message.create({
    conversationId,
    sender: req.user.id,
    classId,
    body: String(body).trim().slice(0, 5000),
    readBy: [req.user.id],
  });
  const io = req.app.get("io");
  if (io) io.to(conversationId).emit("class-chat", msg);
  res.status(201).json({ message: msg });
};

exports.getConversation = async (req, res) => {
  const { withUserId } = req.params;
  requireObjectId(withUserId, "userId");
  const conversationId = dmConversationId(req.user.id, withUserId);
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar")
    .limit(200);
  res.json({ messages, conversationId });
};

exports.getClassMessages = async (req, res) => {
  requireObjectId(req.params.classId, "classId");
  const conversationId = `class:${req.params.classId}`;
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar")
    .limit(200);
  res.json({ messages });
};

exports.inbox = async (req, res) => {
  const mine = req.user.id.toString();
  const all = await Message.find({
    $and: [
      { $or: [{ sender: mine }, { recipient: mine }] },
      { $or: [{ classId: null }, { classId: { $exists: false } }] },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("sender recipient", "name avatar");

  const threads = {};
  all.forEach((m) => {
    if (!threads[m.conversationId]) threads[m.conversationId] = m;
  });
  res.json({ threads: Object.values(threads) });
};
