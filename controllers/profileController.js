const Post = require("../models/Post");
const User = require("../models/User");

// GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with populated posts
    const user = await User.findById(userId)
      .populate({
        path: 'posts',
        match: { author: userId },
        options: { sort: { createdAt: -1 } }
      });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Group posts by subject
    const postsBySubject = {};
    user.posts.forEach(post => {
      const subject = post.subject || 'General';
      if (!postsBySubject[subject]) {
        postsBySubject[subject] = [];
      }
      postsBySubject[subject].push(post);
    });

    // Get user stats
    const stats = {
      totalPosts: user.posts.length,
      followers: user.followers.length,
      following: user.following.length,
      subjects: Object.keys(postsBySubject).length
    };

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class,
        board: user.board,
        avatar: user.avatar,
        followCount: user.followCount,
        createdAt: user.createdAt
      },
      postsBySubject,
      stats
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
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('name role class board avatar followCount')
      .sort({ followCount: -1 })
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
    const { name, avatar } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    
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
        class: user.class,
        board: user.board,
        avatar: user.avatar
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
