const Post = require("../models/Post");
const User = require("../models/User");

// GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.user.id;
    const isOwner = targetUserId.toString() === req.user.id.toString();
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalPosts = await Post.countDocuments({ author: targetUserId });

    // Get user stats
    const stats = {
      totalPosts,
      subjects: 0 
    };

    // Follow logic removed as per new architecture

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        tagline: user.tagline,
        activeNote: user.activeNote,
        createdAt: user.createdAt
      },
      postsBySubject: {},
      stats,
      isFollowing: false,
      isOwner
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPLOAD AVATAR
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });
    
    // Normalize path to use forward slashes so the frontend can load it easily across platforms
    const avatarUrl = "/uploads/" + req.file.filename;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: "Avatar updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        tagline: user.tagline
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER'S POSTS BY SUBJECT
exports.getUserPostsBySubject = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject } = req.query;
    
    const posts = await Post.find({ 
      author: userId,
      subject: subject 
    })
    .populate('author', 'name role')
    .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USERS (for discovery)
exports.getAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('name role avatar bio tagline')
      .limit(50);
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar, email, bio, tagline, activeNote } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (activeNote !== undefined) updateData.activeNote = activeNote;
    
    const user = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        tagline: user.tagline,
        activeNote: user.activeNote
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER POST
exports.deleteUserPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if user owns the post
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    
    await Post.findByIdAndDelete(postId);
    
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
