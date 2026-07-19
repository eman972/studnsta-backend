const mongoose = require("mongoose");

/**
 * ==========================================
 * USER MODEL (Database Schema)
 * ==========================================
 * This file defines the structure for a "User" in the MongoDB database.
 * Every time a new user registers on the platform, a new document is created 
 * based on this schema. It dictates what information we store about a user.
 */
const userSchema = new mongoose.Schema(
  {
    // Basic account information
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // unique ensures no two users have the same email
    password: { type: String, required: true }, // The hashed password, NEVER stored as plain text
    
    // Platform role (can be 'student' or 'teacher')
    role: { type: String, default: "student" },
    
    // Profile customization fields
    avatar: { type: String, default: "" }, // URL to the profile picture
    bio: { type: String, default: "" }, // Short description about the user
    tagline: { type: String, default: "" }, // A quick status or headline
    
    // Currently active note/status the user is focused on
    activeNote: { type: String, default: "" },
    
    // Gamification
    dailyStreak: { type: Number, default: 0 },
    lastQuizDate: { type: Date, default: null },
  },
  { 
    // Automatically adds `createdAt` and `updatedAt` timestamps to every user document
    timestamps: true 
  }
);

// Export the model so it can be used in our controllers to find, create, or update users
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
