const axios = require('axios');

async function testCORS() {
  try {
    const res = await axios.options('https://fare-wave1.onrender.com/api/auth/signup', {
      headers: {
        Origin: 'https://fare-wave1.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log("CORS Headers:", res.headers);
  } catch (err) {
    console.log("CORS Error:", err.message);
  }
}
testCORS();
