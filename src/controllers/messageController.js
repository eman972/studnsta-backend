const Message = require("../models/Message");
const Notification = require("../models/Notification");

function dmConversationId(a, b) {
  return [a.toString(), b.toString()].sort().join(":");
}

exports.sendDM = async (req, res) => {
  const { recipientId, body } = req.body;
  if (!recipientId || !body) {
    return res.status(400).json({ message: "recipientId and body required" });
  }
  const conversationId = dmConversationId(req.user.id, recipientId);
  const msg = await Message.create({
    conversationId,
    sender: req.user.id,
    recipient: recipientId,
    body,
    readBy: [req.user.id],
  });
  await Notification.create({
    user: recipientId,
    type: "dm",
    title: `Message from ${req.user.name}`,
    body: body.slice(0, 100),
    link: `/messages/${req.user.id}`,
  });
  const io = req.app.get("io");
  if (io) io.to(`user:${recipientId}`).emit("dm", msg);
  res.status(201).json({ message: msg });
};

exports.sendClassChat = async (req, res) => {
  const { classId, body } = req.body;
  const conversationId = `class:${classId}`;
  const msg = await Message.create({
    conversationId,
    sender: req.user.id,
    classId,
    body,
    readBy: [req.user.id],
  });
  const io = req.app.get("io");
  if (io) io.to(conversationId).emit("class-chat", msg);
  res.status(201).json({ message: msg });
};

exports.getConversation = async (req, res) => {
  const { withUserId } = req.params;
  const conversationId = dmConversationId(req.user.id, withUserId);
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar")
    .limit(200);
  res.json({ messages, conversationId });
};

exports.getClassMessages = async (req, res) => {
  const conversationId = `class:${req.params.classId}`;
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar")
    .limit(200);
  res.json({ messages });
};

exports.inbox = async (req, res) => {
  const mine = req.user.id.toString();
  const msgs = await Message.find({
    $or: [{ sender: mine }, { recipient: mine }],
    classId: null,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("sender recipient", "name avatar");
  const threads = {};
  msgs.forEach((m) => {
    if (!threads[m.conversationId]) threads[m.conversationId] = m;
  });
  res.json({ threads: Object.values(threads) });
};
