// In-memory OTP storage
// In production, consider using Redis for better scalability
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration (10 minutes)
const storeOTP = (email, userData) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email, {
    otp,
    userData,
    expiresAt,
    attempts: 0,
  });

  // Clean up expired OTPs
  setTimeout(() => {
    if (otpStore.has(email)) {
      const stored = otpStore.get(email);
      if (stored.expiresAt < Date.now()) {
        otpStore.delete(email);
      }
    }
  }, 10 * 60 * 1000);

  return otp;
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);

  if (!stored) {
    return { valid: false, message: "OTP not found or expired" };
  }

  if (stored.expiresAt < Date.now()) {
    otpStore.delete(email);
    return { valid: false, message: "OTP expired" };
  }

  if (stored.attempts >= 5) {
    otpStore.delete(email);
    return { valid: false, message: "Too many attempts. Please request a new OTP" };
  }

  stored.attempts += 1;

  if (stored.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  // OTP is valid, return user data and clean up
  const userData = stored.userData;
  otpStore.delete(email);
  return { valid: true, userData };
};

// Get stored OTP data (for resending)
const getOTPData = (email) => {
  const stored = otpStore.get(email);
  if (!stored || stored.expiresAt < Date.now()) {
    return null;
  }
  return stored.userData;
};

// Delete OTP
const deleteOTP = (email) => {
  otpStore.delete(email);
};

module.exports = {
  storeOTP,
  verifyOTP,
  getOTPData,
  deleteOTP,
};
