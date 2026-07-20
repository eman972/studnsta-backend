const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const { savePost } = require('./controllers/postController');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studnsta', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const post = await Post.findOne();
    const user = await User.findOne();
    
    if (!post || !user) {
      console.log("Missing post or user");
      process.exit(1);
    }

    const req = {
      params: { id: post._id.toString() },
      user: { id: user._id.toString() }
    };
    const res = {
      status: (code) => ({
        json: (data) => console.log(`Status: ${code}`, data)
      }),
      json: (data) => console.log('Response:', data)
    };

    console.log("Calling savePost...");
    await savePost(req, res);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
