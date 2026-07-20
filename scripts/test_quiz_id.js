const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
require('./models/Question'); // Needed for populate
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studnsta', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const id = '6a32fb653eb80c1ae24ebc4b';
      const quiz = await Quiz.findById(id).populate("questions");
      if (quiz) {
        console.log("Quiz found! isLive:", quiz.isLive, "isPublished:", quiz.isPublished);
      } else {
        console.log("Quiz not found.");
      }
    } catch (err) {
      console.log("Error:", err.message);
    }
    process.exit(0);
  });
