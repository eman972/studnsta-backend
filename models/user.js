const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function () {
        return this.role !== "guest";
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "guest"],
      required: true,
    },
    class: {
      type: String,
      enum: ["9th", "10th"],
      required: function () {
        return this.role === "student";
      },
    },
    board: {
      type: String,
      enum: ["BISERWP", "FBISE"],
      required: function () {
        return this.role === "student" || this.role === "teacher";
      },
    },
    staffId: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role === "teacher";
      },
    },
    avatar: String,
    followCount: {
      type: Number,
      default: 0,
    },
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    bio: {
      type: String,
      default: ""
    },
    tagline: {
      type: String,
      default: ""
    },
    activeNote: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);