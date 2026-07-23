const Flashcard = require("../models/Flashcard");

/** SM-2 update */
function applySm2(card, quality) {
  // quality 0-5
  if (quality < 3) {
    card.repetitions = 0;
    card.interval = 1;
  } else {
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.repetitions += 1;
  }
  card.easeFactor = Math.max(
    1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  card.lastReviewedAt = new Date();
  if (quality < 3) {
    card.nextReviewAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
  } else {
    card.nextReviewAt = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);
  }
  return card;
}

exports.create = async (req, res) => {
  const card = await Flashcard.create({ ...req.body, user: req.user.id });
  res.status(201).json({ card });
};

exports.due = async (req, res) => {
  const cards = await Flashcard.find({
    user: req.user.id,
    nextReviewAt: { $lte: new Date() },
  }).limit(30);
  res.json({ cards });
};

exports.list = async (req, res) => {
  const cards = await Flashcard.find({ user: req.user.id }).sort({ updatedAt: -1 });
  res.json({ cards });
};

exports.review = async (req, res) => {
  const card = await Flashcard.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!card) return res.status(404).json({ message: "Not found" });
  applySm2(card, Number(req.body.quality ?? 3));
  await card.save();
  res.json({ card });
};

