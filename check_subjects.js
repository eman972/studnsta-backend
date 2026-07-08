const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studnsta', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const subjects = await Question.distinct("subject");
    console.log("Subjects in Question DB:", subjects);
    process.exit(0);
  });
