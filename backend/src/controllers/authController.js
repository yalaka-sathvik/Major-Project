const User = require("../models/user.models");
const { createSecretToken } = require("../secretToken");
const bcrypt = require("bcrypt");
const { storeOTP, verifyOTP, getOTPData } = require("../utils/otpStore");
const { sendOTPEmail } = require("../utils/emailService");

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

    // Check if user already exists
    const isExisting = await User.findOne({ email: email });
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
      message: "Internal Server Error" 
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
    const isExisting = await User.findOne({ email: email });
    if (isExisting) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      profilePic,
    });

    await user.save();

    // Generate token
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });

    res.status(201).json({
      success: true,
      message: "Email verified successfully! Account created.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
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

    // Check if user already exists
    const isExisting = await User.findOne({ email: email });
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
      return res.json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Incorrect password or email" });
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.json({ message: "Incorrect password or email" });
    }
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });
    res.status(201).json({
      message: "Login successful!",
      token: createSecretToken(user._id),
      username: user.username,
      profilePic: user.profilePic || null,
      success: true,
    });
  } catch (error) {
    console.error(error);
  }
};
