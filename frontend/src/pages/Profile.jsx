import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "../ProfileSettings.css";
import { BackendURL } from "../config/backendConfig";

function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile Tab State
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setNewProfilePic] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Preferences Tab State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    meetingReminders: true,
    messageNotifications: true,
  });
  const [theme, setTheme] = useState("light");
  
  const handleError = (err) => toast.error(err, { position: "bottom-left" });
  const handleSuccess = (msg) =>
    toast.success(msg, { position: "bottom-right" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      handleError("Please login first");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");
    const storedProfilePic = localStorage.getItem("profilePic");
    const storedTheme = localStorage.getItem("theme") || "light";
    
    if (storedUsername) setUsername(storedUsername);
    if (storedEmail) setEmail(storedEmail);
    if (storedProfilePic) setProfilePreview(storedProfilePic);
    setTheme(storedTheme);
  }, [navigate]);

  // Profile Tab Functions
  function handleProfileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        return handleError("File size must be less than 5MB");
      }
      setNewProfilePic(file);
      const preview = URL.createObjectURL(file);
      setProfilePreview(preview);
    }
  }

  async function handleSaveProfile() {
    if (!username.trim()) {
      return handleError("Username cannot be empty");
    }

    const token = localStorage.getItem("token");
    if (!token) return handleError("Please login first");

    setLoading(true);
    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    if (profilePic) formData.append("avatar", profilePic);

    try {
      const res = await axios.put(`${BackendURL}/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        localStorage.setItem("username", username);
        localStorage.setItem("email", res.data.user?.email || email);
        handleSuccess("Profile updated successfully!");
      } else {
        handleError(res.data.message || "Failed to update profile");
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  }

  // Security Tab Functions
  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return handleError("All password fields are required");
    }

    if (newPassword.length < 8) {
      return handleError("New password must be at least 8 characters");
    }

    if (newPassword !== confirmPassword) {
      return handleError("Passwords do not match");
    }

    const token = localStorage.getItem("token");
    if (!token) return handleError("Please login first");

    setPasswordLoading(true);
    try {
      const res = await axios.put(
        `${BackendURL}/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        handleSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        handleError(res.data.message || "Failed to change password");
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Error changing password");
    } finally {
      setPasswordLoading(false);
    }
  }

  // Preferences Tab Functions
  function handleNotificationChange(key) {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) return handleError("Please login first");

    setLoading(true);
    try {
      const res = await axios.delete(`${BackendURL}/account`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        handleSuccess("Account deleted successfully");
        localStorage.clear();
        setTimeout(() => navigate("/register"), 2500);
      } else {
        handleError("Failed to delete account");
      }
    } catch (err) {
      handleError(err.response?.data?.message || "Error deleting account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Account Settings</h2>
        
        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
          <button
            className={`tab-button ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🔒 Security
          </button>
          <button
            className={`tab-button ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            ⚙️ Preferences
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <div className="avatar-section">
              {profilePreview && (
                <img src={profilePreview} alt="Profile Preview" className="avatar-preview" />
              )}
              <label className="form-label fw-semibold">Avatar</label>
              <input
                className="form-control"
                type="file"
                accept="image/*"
                onChange={handleProfileChange}
              />
              <small className="text-muted">Max size: 5MB</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Username</label>
              <input
                className="form-control"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Bio</label>
              <textarea
                className="form-control"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself (optional)"
                rows="3"
              ></textarea>
              <small className="text-muted">Max 150 characters</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                className="form-control"
                type="email"
                value={email}
                readOnly
              />
              <small className="text-muted">Email cannot be changed</small>
            </div>

            <button
              className="btn btn-primary w-100"
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="tab-content">
            <div className="security-warning">
              <p>🔐 Change your password regularly to keep your account secure</p>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Current Password</label>
              <input
                className="form-control"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">New Password</label>
              <input
                className="form-control"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
              <small className="text-muted">
                Use uppercase, numbers, and special characters for security
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Confirm Password</label>
              <input
                className="form-control"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <button
              className="btn btn-success w-100 mb-3"
              onClick={handleChangePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>

            <div className="danger-zone">
              <h5>Danger Zone</h5>
              <button
                className="btn btn-danger w-100"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
              <small className="text-danger">
                ⚠️ This action is permanent and cannot be undone
              </small>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="tab-content">
            <div className="section">
              <h5>Notifications</h5>
              <div className="preference-item">
                <div>
                  <label className="fw-semibold">Email Notifications</label>
                  <p className="text-muted">Receive email notifications for important events</p>
                </div>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>

              <div className="preference-item">
                <div>
                  <label className="fw-semibold">Meeting Reminders</label>
                  <p className="text-muted">Get reminders before scheduled meetings</p>
                </div>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={notifications.meetingReminders}
                  onChange={() => handleNotificationChange("meetingReminders")}
                />
              </div>

              <div className="preference-item">
                <div>
                  <label className="fw-semibold">Message Notifications</label>
                  <p className="text-muted">Get notified when you receive messages</p>
                </div>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={notifications.messageNotifications}
                  onChange={() => handleNotificationChange("messageNotifications")}
                />
              </div>
            </div>

            <div className="section">
              <h5>Theme</h5>
              <div className="theme-section">
                <button
                  className={`theme-button ${theme === "light" ? "active" : ""}`}
                  onClick={() => handleThemeChange("light")}
                >
                  ☀️ Light Mode
                </button>
                <button
                  className={`theme-button ${theme === "dark" ? "active" : ""}`}
                  onClick={() => handleThemeChange("dark")}
                >
                  🌙 Dark Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default Profile;
