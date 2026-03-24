const Post = require("../models/Post");
const User = require("../models/User");

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    const { content, class: postClass, board, subject, chapter } = req.body;
    
    const post = await Post.create({
      content,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      class: postClass,
      board,
      subject,
      chapter,
      author: req.user.id,
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar role');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TODAY'S POSTS FROM FOLLOWED USERS (CRITICAL FEATURE)
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's following list
    const user = await User.findById(userId).populate('following');
    const followingIds = user.following.map(followedUser => followedUser._id);
    
    // Get today's start and end
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get posts from followed users created today
    const posts = await Post.find({
      author: { $in: followingIds },
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate('author', 'name avatar role')
    .populate('likes', 'name avatar')
    .populate('saves', 'name avatar')
    .populate('comments.user', 'name avatar')
    .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LIKE POST
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Toggle like
    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    
    await post.save();
    res.json({ liked: post.likes.includes(userId), likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SAVE POST
exports.savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Toggle save
    if (post.saves.includes(userId)) {
      post.saves.pull(userId);
    } else {
      post.saves.push(userId);
    }
    
    await post.save();
    res.json({ saved: post.saves.includes(userId), savesCount: post.saves.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// COMMENT ON POST
exports.commentOnPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user.id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    post.comments.push({ user: userId, text });
    await post.save();
    
    const populatedPost = await Post.findById(postId)
      .populate('comments.user', 'name avatar');
    
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    res.json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FOLLOW/UNFOLLOW USER
exports.followUser = async (req, res) => {
  try {
    const userIdToFollow = req.params.id;
    const currentUserId = req.user.id;
    
    if (userIdToFollow === currentUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    
    const currentUser = await User.findById(currentUserId);
    const userToFollow = await User.findById(userIdToFollow);
    
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Toggle follow
    if (currentUser.following.includes(userIdToFollow)) {
      currentUser.following.pull(userIdToFollow);
      userToFollow.followers.pull(currentUserId);
      userToFollow.followCount = Math.max(0, userToFollow.followCount - 1);
    } else {
      currentUser.following.push(userIdToFollow);
      userToFollow.followers.push(currentUserId);
      userToFollow.followCount += 1;
    }
    
    await currentUser.save();
    await userToFollow.save();
    
    res.json({ 
      following: currentUser.following.includes(userIdToFollow),
      followCount: userToFollow.followCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

