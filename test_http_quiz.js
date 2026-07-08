const fetch = require('node-fetch') || global.fetch;

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/quiz/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer faketoken'
      },
      body: JSON.stringify({
        subject: "Math",
        topic: "Algebra",
        totalQuestions: 5,
        correctAnswers: 3,
        timeTaken: 60,
        answers: [
          { questionId: "6a32f3cf493f81ccc476fc11", selectedAnswer: "A", isCorrect: true }
        ],
        status: "completed"
      })
    });
    
    console.log('Status:', res.status);
    const data = await res.text();
    console.log('Body:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
