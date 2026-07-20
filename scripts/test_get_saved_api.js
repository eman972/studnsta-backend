const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const { getSavedPosts } = require('./controllers/postController');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studnsta', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const user = await User.findOne();
    
    if (!user) {
      console.log("Missing user");
      process.exit(1);
    }

    const req = {
      user: { id: user._id.toString() }
    };
    const res = {
      status: (code) => ({
        json: (data) => console.log(`Status: ${code}`, data)
      }),
      json: (data) => console.log('Response:', data)
    };

    console.log("Calling getSavedPosts...");
    await getSavedPosts(req, res);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
