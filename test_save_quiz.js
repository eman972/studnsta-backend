const mongoose = require('mongoose');
const User = require('./models/User');
const { saveQuizResult } = require('./controllers/quizApiController');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studnsta', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const user = await User.findOne();
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }

    const req = {
      user: user,
      body: {
        subject: "Math",
        topic: "Algebra",
        totalQuestions: 5,
        correctAnswers: 3,
        timeTaken: 60,
        answers: [
          { questionId: new mongoose.Types.ObjectId(), selectedAnswer: "A", isCorrect: true },
          { questionId: new mongoose.Types.ObjectId(), selectedAnswer: "B", isCorrect: true }
        ],
        status: "completed"
      }
    };
    
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log(`Response Code: ${this.statusCode}`);
        console.log("Response:", JSON.stringify(data, null, 2));
      }
    };

    console.log("Calling saveQuizResult...");
    await saveQuizResult(req, res);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
