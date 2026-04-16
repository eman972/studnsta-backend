
const axios = require('axios');

async function testProfile() {
  try {
    const res = await axios.get('http://localhost:5000/api/profile', {
      headers: {
        Authorization: 'Bearer test-token' // I'll need a real token or I'll get 401
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error('ERROR status:', err.response?.status);
    console.error('ERROR data:', err.response?.data);
  }
}

// Since I don't have a token easily, I'll just check the backend code more carefully.
