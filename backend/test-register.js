const axios = require('axios');

const testRegister = async () => {
  try {
    const response = await axios.post('http://localhost:9000/register', {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'TestPass@123'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', error.response?.data);
    console.log('Error Message:', error.message);
  }
};

testRegister();
