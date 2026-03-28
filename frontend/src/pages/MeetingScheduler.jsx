import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "../MeetingScheduler.css";
import { BackendURL } from "../config/backendConfig";

function MeetingScheduler() {
  const [meetings, setMeetings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    attendees: "",
    meetingType: "video",
  });

  const handleError = (err) => toast.error(err, { position: "bottom-left" });
  const handleSuccess = (msg) =>
    toast.success(msg, { position: "bottom-right" });

  useEffect(() => {
    fetchScheduledMeetings();
  }, []);

  async function fetchScheduledMeetings() {
    const token = localStorage.getItem("token");
    const admin = localStorage.getItem("username");

    if (!token || !admin) {
      handleError("Please login first");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `${BackendURL}/meetings/list?admin=${admin}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setMeetings(res.data.meetings);
      }
    } catch (error) {
      handleError("Error loading meetings");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.date ||
      !formData.time
    ) {
      return handleError("Please fill all required fields");
    }

    const token = localStorage.getItem("token");
    if (!token) return handleError("Please login first");

    setLoading(true);
    try {
      const res = await axios.post(
        `${BackendURL}/meeting/start`,
        {
          title: formData.title,
          admin: localStorage.getItem("username"),
          description: formData.description,
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          duration: formData.duration,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        handleSuccess("Meeting scheduled successfully!");
        setFormData({
          title: "",
          description: "",
          date: "",
          time: "",
          duration: "60",
          attendees: "",
          meetingType: "video",
        });
        setShowForm(false);
        fetchScheduledMeetings();
      } else {
        handleError(res.data.message || "Failed to schedule meeting");
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Error scheduling meeting");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(meetingId) {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await axios.delete(`${BackendURL}/meeting/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        handleSuccess("Meeting cancelled");
        setMeetings(meetings.filter((m) => m._id !== meetingId));
      }
    } catch (error) {
      handleError("Error cancelling meeting");
    }
  }

  function getUpcomingMeetings() {
    return meetings.filter((m) => {
      const meetingDate = new Date(m.startedAt);
      return meetingDate > new Date();
    });
  }

  function getPastMeetings() {
    return meetings.filter((m) => {
      const meetingDate = new Date(m.startedAt);
      return meetingDate <= new Date();
    });
  }

  const upcomingMeetings = getUpcomingMeetings();
  const pastMeetings = getPastMeetings();

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h1>📅 Meeting Scheduler</h1>
        <button
          className="btn-new-meeting"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "+ Schedule Meeting"}
        </button>
      </div>

      {/* Schedule Form */}
      {showForm && (
        <div className="schedule-form-card">
          <h2>Schedule a New Meeting</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Meeting Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Team Standup"
                  required
                />
              </div>

              <div className="form-group">
                <label>Meeting Type</label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleInputChange}
                >
                  <option value="video">Video Call</option>
                  <option value="audio">Audio Call</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  max="480"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Meeting agenda and details..."
                rows="4"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Attendees (Email addresses, comma separated)</label>
              <textarea
                name="attendees"
                value={formData.attendees}
                onChange={handleInputChange}
                placeholder="john@example.com, jane@example.com"
                rows="2"
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Meeting"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Meetings */}
      {!loading && upcomingMeetings.length > 0 && (
        <div className="meetings-section">
          <h2>📋 Upcoming Meetings ({upcomingMeetings.length})</h2>
          <div className="meetings-list">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting._id} className="meeting-item upcoming">
                <div className="meeting-icon">📍</div>
                <div className="meeting-details">
                  <h3>{meeting.title}</h3>
                  <p className="meeting-type">{meeting.meetingType || "Video Call"}</p>
                  <p className="meeting-time">
                    🕐 {new Date(meeting.startedAt).toLocaleString()}
                  </p>
                  {meeting.description && (
                    <p className="meeting-description">{meeting.description}</p>
                  )}
                </div>
                <div className="meeting-actions">
                  <button
                    className="btn-action btn-join"
                    onClick={() => (window.location.href = `/meeting/${meeting.meetingId}`)}
                  >
                    Join Now
                  </button>
                  <button
                    className="btn-action btn-cancel"
                    onClick={() => handleDelete(meeting._id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {!loading && pastMeetings.length > 0 && (
        <div className="meetings-section">
          <h2>✅ Past Meetings ({pastMeetings.length})</h2>
          <div className="meetings-list">
            {pastMeetings.map((meeting) => (
              <div key={meeting._id} className="meeting-item past">
                <div className="meeting-icon">✔️</div>
                <div className="meeting-details">
                  <h3>{meeting.title}</h3>
                  <p className="meeting-time">
                    📅 {new Date(meeting.startedAt).toLocaleDateString()}
                  </p>
                  <p className="meeting-duration">
                    ⏱️ Duration: {meeting.duration || "N/A"}
                  </p>
                  {meeting.recordingUrl && (
                    <p className="meeting-recording">📹 Recording available</p>
                  )}
                </div>
                <div className="meeting-actions">
                  <button
                    className="btn-action btn-view"
                    onClick={() => (window.location.href = `/recordings`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && upcomingMeetings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No meetings scheduled</h3>
          <p>Schedule a meeting to get started</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Schedule Your First Meeting
          </button>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default MeetingScheduler;
