const mongoose = require("mongoose");

/**
 * ==========================================
 * NOTE MODEL (Database Schema)
 * ==========================================
 * This schema defines how study materials ("Notes" or "Papers") are stored.
 * Teachers upload these materials for students to access and download.
 */
const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Display name of the note
    description: { type: String, default: "" }, // Optional details about the material
    subject: { type: String, required: true },
    topic: { type: String, default: "" },
    year: { type: String, default: "" },
    
    // The actual link to the uploaded file (often a URL to where the PDF is stored on the server/cloud)
    pdfUrl: { type: String, required: true },
    
    noteType: { type: String, default: "Notes" }, // e.g., "Notes", "Past Papers"
    
    // Links this note to the User who uploaded it using their unique ID
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tells Mongoose this ID belongs to the "User" collection
      required: true,
    },
    
    // Analytics tracking
    downloads: { type: Number, default: 0 },
    
    // Keywords for searching and filtering
    tags: [{ type: String, trim: true }]
  },
  { 
    timestamps: true, // Auto-adds createdAt and updatedAt
    collection: 'notes' // Explicitly names the MongoDB collection to avoid pluralization weirdness
  }
);

// ==========================================
// INDEXES FOR SEARCH PERFORMANCE
// ==========================================
// Indexes make querying the database much faster.
// For example, finding all notes by a specific subject or topic will be quicker.
noteSchema.index({ subject: 1, topic: 1 });
noteSchema.index({ noteType: 1, year: 1 });

// A text index allows for powerful "search bar" functionality across multiple text fields
noteSchema.index({ title: "text", description: "text", topic: "text", tags: "text" });

module.exports = mongoose.model("Note", noteSchema);
