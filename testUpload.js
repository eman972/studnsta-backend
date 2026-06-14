const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

async function test() {
  await mongoose.connect('mongodb://localhost:27017/studnsta');
  const user = await User.findOne({});
  if (!user) return console.log("No user found");
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallbacksecret');
  
  fs.writeFileSync('test.pdf', 'dummy pdf content');
  
  const form = new FormData();
  const fileBlob = new Blob([fs.readFileSync('test.pdf')], { type: 'application/pdf' });
  form.append('pdf', fileBlob, 'test.pdf');
  form.append('title', 'Test Title');
  
  try {
    const res = await fetch('http://localhost:5000/api/papers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
  
  mongoose.disconnect();
}

test();
