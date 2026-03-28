// In-memory user storage fallback for when MongoDB is unavailable
// This is only for testing and development purposes

const testUsers = new Map();

// Store a user in memory
const storeUserInMemory = async (userData) => {
  const { email } = userData;
  if (testUsers.has(email)) {
    return { exists: true };
  }
  testUsers.set(email, userData);
  return { exists: false };
};

// Find user by email in memory
const findUserByEmailInMemory = (email) => {
  return testUsers.has(email) ? testUsers.get(email) : null;
};

// Get all test users (for debugging)
const getAllTestUsers = () => {
  return Array.from(testUsers.entries());
};

module.exports = {
  storeUserInMemory,
  findUserByEmailInMemory,
  getAllTestUsers,
};
