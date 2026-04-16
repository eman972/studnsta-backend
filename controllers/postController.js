const Post = require("../models/Post");
const User = require("../models/User");

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    const { content, subject, topic, tags } = req.body;
    
    const post = await Post.create({
      content,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      subject,
      topic,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      author: req.user.id,
    });

    // Link the post to the user's profile array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { posts: post._id }
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar role');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET GLOBAL FEED (PAGINATED)
exports.getFeed = async (req, res) => {
  try {
    const { subject, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (subject) query.subject = subject;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'name avatar role')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      posts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
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

