const mongoose = require("mongoose");

const noteCollectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
    description: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NoteCollection || mongoose.model("NoteCollection", noteCollectionSchema);
