const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://fare-wave1.onrender.com/api/auth/signup', {
      name: 'test', email: 'test@test.com', password: 'password'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error Status:", err.response?.status);
    console.log("Error Data:", err.response?.data);
    console.log("Error Message:", err.message);
  }
}
test();
