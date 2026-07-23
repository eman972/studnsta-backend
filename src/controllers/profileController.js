const User = require("../models/user");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { calcProfileCompleteness, publicUser } = require("../utils/tokens");

exports.getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.user.id;
    const { isValidObjectId } = require("../utils/ids");
    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const isOwner = targetUserId.toString() === req.user.id.toString();

    const user = await User.findById(targetUserId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      !isOwner &&
      user.privacy === "private"
    ) {
      return res.status(403).json({ message: "Profile is private" });
    }

    const viewer = await User.findById(req.user.id);
    const isFollowing = (viewer.following || []).some(
      (id) => id.toString() === user._id.toString()
    );
    const totalPosts = await Post.countDocuments({ author: targetUserId });

    res.json({
      user: {
        ...publicUser(user),
        activeNote: user.activeNote,
        createdAt: user.createdAt,
        followersCount: (user.followers || []).length,
        followingCount: (user.following || []).length,
      },
      postsBySubject: {},
      stats: { totalPosts, subjects: 0 },
      isFollowing,
      isOwner,
      profileCompleteness: calcProfileCompleteness(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });
    const avatarUrl = "/uploads/" + req.file.filename;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );
    user.profileCompleteness = calcProfileCompleteness(user);
    await user.save();
    res.json({
      message: "Avatar updated successfully",
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserPostsBySubject = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject } = req.query;
    const query = { author: userId };
    if (subject) query.subject = subject;
    const posts = await Post.find(query)
      .populate("author", "name role")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      "name",
      "bio",
      "tagline",
      "activeNote",
      "institution",
      "campus",
      "privacy",
      "notificationPrefs",
      "subjectsOfInterest",
      "learningGoals",
      "learningStyle",
      "locale",
      "onboardingComplete",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });
    user.profileCompleteness = calcProfileCompleteness(user);
    await user.save();
    res.json({ message: "Profile updated", user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUserPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (
      post.author.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }
    post.isDeleted = true;
    post.deletedAt = new Date();
    if (post.isDeleted !== undefined) {
      await post.save();
    } else {
      await post.deleteOne();
    }
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = {
      isDeleted: { $ne: true },
      isDeactivated: { $ne: true },
      _id: { $ne: req.user.id },
    };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { institution: { $regex: escaped, $options: "i" } },
      ];
    }
    const users = await User.find(filter)
      .select("name email role avatar institution campus bio tagline")
      .limit(50)
      .lean();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 8: follow / unfollow */
exports.followUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const { isValidObjectId } = require("../utils/ids");
    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (targetId === req.user.id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    const target = await User.findById(targetId);
    const me = await User.findById(req.user.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (!me.following.map(String).includes(targetId)) {
      me.following.push(targetId);
      target.followers.push(me._id);
      await me.save();
      await target.save();
      await Notification.create({
        user: targetId,
        type: "follow",
        title: `${me.name} followed you`,
        link: `/profile/${me._id}`,
      });
    }
    res.json({ message: "Following", isFollowing: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const { isValidObjectId } = require("../utils/ids");
    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const me = await User.findById(req.user.id);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });
    me.following = me.following.filter((id) => id.toString() !== targetId);
    target.followers = target.followers.filter(
      (id) => id.toString() !== me._id.toString()
    );
    await me.save();
    await target.save();
    res.json({ message: "Unfollowed", isFollowing: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 17: block user */
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const me = await User.findById(req.user.id);
    if (!me.blockedUsers.map(String).includes(targetId)) {
      me.blockedUsers.push(targetId);
      me.following = me.following.filter((id) => id.toString() !== targetId);
      await me.save();
    }
    res.json({ message: "User blocked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Feature 18: deactivate + export */
exports.deactivateAccount = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.isDeactivated = true;
  user.refreshTokens = [];
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ message: "Account deactivated" });
};

exports.exportMyData = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -refreshTokens");
  const posts = await Post.find({ author: req.user.id });
  res.json({
    exportedAt: new Date().toISOString(),
    user,
    posts,
  });
};

exports.softDeleteAccount = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.refreshTokens = [];
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ message: "Account scheduled for deletion" });
};
