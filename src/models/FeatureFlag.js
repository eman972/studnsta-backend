const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: String,
    rolloutPercent: { type: Number, default: 100 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FeatureFlag || mongoose.model("FeatureFlag", featureFlagSchema);
