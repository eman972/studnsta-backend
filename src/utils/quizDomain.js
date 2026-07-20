/**
 * Feature 10: Unified quiz domain helpers
 * Practice (/api/quiz), live (/api/live-quiz), and CRUD (/api/quizzes)
 * share Question + Quiz + QuizAttempt / QuizResult models.
 */
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Feature 67: per-student question shuffle */
function shuffleQuizForStudent(questions, seedExtra = "") {
  const seeded = questions.map((q, idx) => ({
    ...((q.toObject && q.toObject()) || q),
    options: q.options ? shuffle(q.options) : q.options,
    _order: idx,
  }));
  return shuffle(seeded);
}

async function getAdaptiveQuestions({ subject, topic, count = 10, difficulty }) {
  const filter = { status: "approved" };
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;
  let questions = await Question.findRandomQuestions(count, filter);
  if (questions.length < count) {
    questions = await Question.find(filter).limit(count);
  }
  return questions;
}

module.exports = {
  shuffle,
  shuffleQuizForStudent,
  getAdaptiveQuestions,
  Question,
  Quiz,
};
