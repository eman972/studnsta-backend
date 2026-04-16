
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'test@example.com' });
  console.log('User activeNote:', user?.activeNote);
  await mongoose.disconnect();
}

checkUser();
