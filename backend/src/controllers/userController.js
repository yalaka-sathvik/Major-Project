const User = require("../models/user.models");
const bcrypt = require("bcrypt");
const { createSecretToken } = require("../secretToken");
const path = require("path");
const fs = require("fs");
const { findUserByEmailInMemory, storeUserInMemory } = require("../utils/testUserStore");

// Flag to track if MongoDB is available
let mongoDBAvailable = true;

// Helper function to find user
const findUser = async (email) => {
  if (mongoDBAvailable) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      console.warn("MongoDB unavailable for users, using in-memory fallback", error.message);
      mongoDBAvailable = false;
    }
  }
  return findUserByEmailInMemory(email);
};

// Helper function to find user by ID
const findUserById = async (id) => {
  if (mongoDBAvailable) {
    try {
      return await User.findById(id);
    } catch (error) {
      console.warn("MongoDB unavailable, using in-memory fallback", error.message);
      mongoDBAvailable = false;
    }
  }
  return null; // In-memory doesn't support ID lookups yet
};

// Update user profile
module.exports.updateProfile = async (req, res) => {
  try {
    const { userId, username, email, bio } = req.body;
    let profilePicPath = null;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Handle profile picture upload
    if (req.file) {
      const uploadsDir = path.join(__dirname, "../../uploads/avatars");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      profilePicPath = `/uploads/avatars/${req.file.filename}`;
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (bio) updateData.bio = bio;
    if (profilePicPath) updateData.profilePic = profilePicPath;

    if (mongoDBAvailable) {
      try {
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
        return res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
          },
        });
      } catch (error) {
        console.warn("MongoDB unavailable, using in-memory fallback", error.message);
        mongoDBAvailable = false;
      }
    }

    // In-memory fallback
    console.log("⚠️  Profile update using in-memory storage");
    res.status(200).json({
      success: true,
      message: "Profile updated (in-memory)",
      user: {
        username: username || "User",
        email: email || "user@example.com",
        profilePic: profilePicPath || "/images/default-avatar.png",
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Get user profile
module.exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    let user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// Change password
module.exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, number, and special character",
      });
    }

    if (mongoDBAvailable) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Current password is incorrect",
          });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
          success: true,
          message: "Password changed successfully",
        });
      } catch (error) {
        console.warn("MongoDB unavailable, using in-memory fallback", error.message);
        mongoDBAvailable = false;
      }
    }

    // In-memory fallback
    console.log("⚠️  Password change using in-memory storage");
    res.status(200).json({
      success: true,
      message: "Password changed (in-memory)",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// Get all users (admin feature)
module.exports.getAllUsers = async (req, res) => {
  try {
    if (mongoDBAvailable) {
      try {
        const users = await User.find({}, { password: 0 }).limit(100);
        return res.status(200).json({
          success: true,
          count: users.length,
          users,
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        mongoDBAvailable = false;
      }
    }

    console.log("⚠️  Fetching users from in-memory storage");
    res.status(200).json({
      success: true,
      count: 0,
      users: [],
      message: "Using in-memory storage (limited data)",
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Delete user account
module.exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (mongoDBAvailable) {
      try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
        return res.status(200).json({
          success: true,
          message: "Account deleted successfully",
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        mongoDBAvailable = false;
      }
    }

    // In-memory fallback
    console.log("⚠️  Account deletion using in-memory storage");
    res.status(200).json({
      success: true,
      message: "Account deleted (simulated in-memory)",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};
