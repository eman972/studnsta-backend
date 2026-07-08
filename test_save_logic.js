const mongoose = require('mongoose');
const Post = require('./models/Post');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studnsta', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB");
    const post = await Post.findOne();
    if (!post) {
      console.log("No post found");
      process.exit(0);
    }
    console.log("Post saves type:", typeof post.saves);
    console.log("Post saves:", post.saves);
    if (!post.saves) {
        console.log("SAVES IS UNDEFINED!");
    } else {
        console.log("Includes function exists?", typeof post.saves.includes === 'function');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
