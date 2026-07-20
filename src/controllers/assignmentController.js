const Assignment = require("../models/Assignment");

exports.create = async (req, res) => {
  const assignment = await Assignment.create({
    ...req.body,
    teacher: req.user.id,
  });
  res.status(201).json({ assignment });
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.user.role === "teacher") filter.teacher = req.user.id;
  const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
  res.json({ assignments });
};

exports.submit = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Not found" });
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
  const text = req.body.text || "";

  // Feature 76: simple similarity vs other submissions
  let similarityScore = 0;
  for (const s of assignment.submissions) {
    if (s.text && text && s.text === text) similarityScore = 100;
    else if (s.text && text) {
      const a = new Set(s.text.toLowerCase().split(/\s+/));
      const b = new Set(text.toLowerCase().split(/\s+/));
      const inter = [...a].filter((w) => b.has(w)).length;
      const score = Math.round((inter / Math.max(a.size, b.size, 1)) * 100);
      similarityScore = Math.max(similarityScore, score);
    }
  }

  const existing = assignment.submissions.find(
    (s) => s.student.toString() === req.user.id.toString()
  );
  if (existing) {
    existing.fileUrl = fileUrl || existing.fileUrl;
    existing.text = text;
    existing.submittedAt = new Date();
    existing.similarityScore = similarityScore;
  } else {
    assignment.submissions.push({
      student: req.user.id,
      fileUrl,
      text,
      similarityScore,
    });
  }
  await assignment.save();
  res.json({ assignment, similarityScore });
};

exports.grade = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Not found" });
  const sub = assignment.submissions.id(req.body.submissionId);
  if (!sub) return res.status(404).json({ message: "Submission not found" });
  sub.grade = req.body.grade;
  sub.feedback = req.body.feedback;
  await assignment.save();
  res.json({ assignment });
};

exports.peerReview = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment?.allowPeerReview) {
    return res.status(400).json({ message: "Peer review disabled" });
  }
  const sub = assignment.submissions.id(req.body.submissionId);
  if (!sub) return res.status(404).json({ message: "Submission not found" });
  sub.peerReviews.push({
    reviewer: req.user.id,
    score: req.body.score,
    comment: req.body.comment,
  });
  await assignment.save();
  res.json({ assignment });
};
