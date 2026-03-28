const axios = require('axios');

const testCompleteFlow = async () => {
  try {
    // Step 1: Register
    console.log('=== Step 1: Registering User ===');
    const registerData = {
      username: 'flowtest123',
      email: 'flowtest@example.com',
      password: 'FlowTest@123'
    };
    
    const registerResponse = await axios.post('http://localhost:9000/register', registerData, {
      withCredentials: true
    });
    
    console.log('✓ Registration successful');
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
    
    // Note: To test OTP verification, we would need to:
    // 1. Get the OTP from the server logs (since email might not be configured)
    // 2. Send it to /verify-otp endpoint
    
    console.log('\n✓ Registration test completed successfully!');
    console.log('Frontend can now display OTP verification screen');
    
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

testCompleteFlow();
