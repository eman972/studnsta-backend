require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const FeatureFlag = require("../src/models/FeatureFlag");

const defaults = [
  { key: "classes", enabled: true, description: "Class cohorts" },
  { key: "dms", enabled: true, description: "Direct messages" },
  { key: "live_lobby", enabled: true, description: "Realtime live quiz lobby" },
  { key: "ai_rag", enabled: true, description: "AI chat with notes" },
  { key: "flashcards", enabled: true, description: "Spaced repetition" },
  { key: "assignments", enabled: true, description: "Teacher assignments" },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const f of defaults) {
    await FeatureFlag.findOneAndUpdate({ key: f.key }, f, { upsert: true });
  }
  console.log("Feature flags seeded");
  process.exit(0);
})();
