// In-memory meeting storage fallback for when MongoDB is unavailable
// This is only for testing and development purposes

const testMeetings = new Map();
let meetingCounter = 1;

// Store a meeting in memory
const storeMeetingInMemory = async (meetingData) => {
  const docId = `test_meeting_${Date.now()}_${meetingCounter++}`;
  testMeetings.set(docId, {
    _id: { toString: () => docId },
    ...meetingData,
    createdAt: new Date()
  });
  return { success: true, docId };
};

// Find meeting by docId in memory
const findMeetingInMemory = (docId) => {
  return testMeetings.has(docId) ? testMeetings.get(docId) : null;
};

// Find all meetings by admin in memory
const findMeetingsByAdminInMemory = (admin) => {
  return Array.from(testMeetings.values())
    .filter(m => m.admin === admin)
    .sort((a, b) => b.createdAt - a.createdAt);
};

// Get all test meetings (for debugging)
const getAllTestMeetings = () => {
  return Array.from(testMeetings.entries());
};

module.exports = {
  storeMeetingInMemory,
  findMeetingInMemory,
  findMeetingsByAdminInMemory,
  getAllTestMeetings,
};
