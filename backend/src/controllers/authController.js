const User = require("../models/user.models");
const { createSecretToken } = require("../secretToken");
const bcrypt = require("bcrypt");
const { storeOTP, verifyOTP, getOTPData } = require("../utils/otpStore");
const { sendOTPEmail } = require("../utils/emailService");
const { findUserByEmailInMemory, storeUserInMemory } = require("../utils/testUserStore");

// Flag to track if MongoDB is available
let mongoDBAvailable = true;

// Helper function to check user existence (tries MongoDB first, falls back to memory)
const checkUserExists = async (email) => {
  // Try MongoDB first
  if (mongoDBAvailable) {
    try {
      const user = await User.findOne({ email: email });
      return user ? true : false;
    } catch (error) {
      console.warn("MongoDB unavailable, switching to in-memory storage for testing", error.message);
      mongoDBAvailable = false;
      // Fall through to in-memory check
    }
  }
  
  // Fall back to in-memory store
  const user = findUserByEmailInMemory(email);
  return user ? true : false;
};

// Helper function to store user (tries MongoDB first, falls back to memory)
const saveUserData = async (userData) => {
  if (mongoDBAvailable) {
    try {
      const user = new User(userData);
      await user.save();
      return { success: true, user, isMemory: false };
    } catch (error) {
      console.warn("MongoDB unavailable, using in-memory storage for testing", error.message);
      mongoDBAvailable = false;
      // Fall through to in-memory store
    }
  }
  
  // Fall back to in-memory store
  await storeUserInMemory(userData);
  return { success: true, user: userData, isMemory: true };
};

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase, one number, one special character
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

module.exports.Register = async (req, res, next) => {
  console.log("register route hit");
  try {
    const { username, email, password } = req.body;
    console.log(req.body);

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase letter, number, and special character (@$!%*?&)"
      });
    }

    // Validate username
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 50 characters"
      });
    }

    // Check if user already exists (using helper that falls back to memory)
    const isExisting = await checkUserExists(email);
    if (isExisting) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Store user data temporarily with OTP
    const userData = {
      username,
      email,
      password,
      profilePic: "/images/2903-default-blue.png",
    };

    // Generate and store OTP
    const otp = storeOTP(email, userData);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, username);

    if (!emailResult.success) {
      console.error("Email sending failed:", emailResult.error);
      return res.status(500).json({
        success: false,
        message: emailResult.error || "Failed to send verification email. Please check your email configuration in the server logs.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration.",
      email: email, // Send email back for frontend to use in verification
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      details: error.message
    });
  }
};

module.exports.VerifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Verify OTP
    const result = verifyOTP(email, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // OTP is valid, create user
    const { username, password, profilePic } = result.userData;

    // Double-check user doesn't exist (race condition protection)
    const isExisting = await checkUserExists(email);
    if (isExisting) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create and hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user object
    const userData = {
      username,
      email,
      password: hashedPassword,
      profilePic,
    };

    // Save user (uses MongoDB if available, falls back to memory)
    const saveResult = await saveUserData(userData);

    if (saveResult.isMemory) {
      console.log("⚠️  User saved to in-memory storage (MongoDB unavailable)");
    }

    // Generate token (create a token-like structure even for in-memory users)
    const token = createSecretToken(saveResult.user._id || email);
    
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Account created.",
      user: {
        _id: saveResult.user._id || email,
        username: saveResult.user.username,
        email: saveResult.user.email,
        profilePic: saveResult.user.profilePic,
        token: token,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports.ResendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user already exists (use fallback function)
    const isExisting = await checkUserExists(email);
    if (isExisting) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Get stored user data
    const userData = getOTPData(email);

    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found. Please register again.",
      });
    }

    // Generate new OTP
    const otp = storeOTP(email, userData);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, userData.username);

    if (!emailResult.success) {
      console.error("Email sending failed:", emailResult.error);
      return res.status(500).json({
        success: false,
        message: emailResult.error || "Failed to send verification email. Please check your email configuration in the server logs.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP resent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports.Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Incorrect password or email" });
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(401).json({ success: false, message: "Incorrect password or email" });
    }
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });
    res.status(200).json({
      success: true,
      message: "Login successful!",
      token: token,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || null,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
