import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "../RecordingLibrary.css";
import { BackendURL } from "../config/backendConfig";

function RecordingLibrary() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [sortBy, setSortBy] = useState("date");

  const handleError = (err) => toast.error(err, { position: "bottom-left" });
  const handleSuccess = (msg) =>
    toast.success(msg, { position: "bottom-right" });

  useEffect(() => {
    fetchRecordings();
  }, []);

  async function fetchRecordings() {
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
        const recordedMeetings = res.data.meetings.filter(
          (meeting) => meeting.recordingUrl
        );
        setRecordings(recordedMeetings);
      } else {
        handleError("Failed to load recordings");
      }
    } catch (error) {
      handleError("Error loading recordings");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(meeting) {
    if (!meeting.recordingUrl) {
      handleError("Recording not available");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = `${BackendURL}${meeting.recordingUrl}`;
      link.download = `${meeting.title}_${meeting.meetingId}.webm`;
      link.click();
      handleSuccess("Download started");
    } catch (error) {
      handleError("Error downloading recording");
    }
  }

  async function handleDelete(meetingId) {
    if (!window.confirm("Are you sure you want to delete this recording?")) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await axios.delete(`${BackendURL}/meeting/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        handleSuccess("Recording deleted");
        setRecordings(
          recordings.filter((r) => r._id !== meetingId)
        );
      } else {
        handleError("Failed to delete recording");
      }
    } catch (error) {
      handleError("Error deleting recording");
    }
  }

  function getFilteredRecordings() {
    let filtered = recordings;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.meetingId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === "with-transcript") {
      filtered = filtered.filter((r) => r.transcript);
    } else if (filterStatus === "with-summary") {
      filtered = filtered.filter((r) => r.summary);
    }

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.startedAt) - new Date(a.startedAt);
      } else if (sortBy === "duration") {
        return parseInt(b.duration) - parseInt(a.duration);
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }

  const filteredRecordings = getFilteredRecordings();

  return (
    <div className="recording-library-container">
      <div className="library-header">
        <h1>📹 Recording Library</h1>
        <p>Manage and access your meeting recordings</p>
      </div>

      {/* Controls */}
      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search recordings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">Sort: Latest</option>
            <option value="duration">Sort: Duration</option>
            <option value="title">Sort: Title</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Recordings</option>
            <option value="with-transcript">With Transcript</option>
            <option value="with-summary">With Summary</option>
          </select>

          <button className="btn-refresh" onClick={fetchRecordings}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading recordings...</div>}

      {/* Empty State */}
      {!loading && filteredRecordings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No recordings found</h3>
          <p>Start a meeting and enable recording to see it here</p>
        </div>
      )}

      {/* Recordings List */}
      {!loading && filteredRecordings.length > 0 && (
        <div className="recordings-grid">
          {filteredRecordings.map((recording) => (
            <div
              key={recording._id}
              className="recording-card"
              onClick={() => setSelectedRecording(recording)}
            >
              <div className="recording-thumbnail">
                <div className="thumbnail-placeholder">📹</div>
                <div className="duration-badge">{recording.duration || "N/A"}</div>
              </div>

              <div className="recording-info">
                <h3>{recording.title}</h3>
                <p className="meeting-id">ID: {recording.meetingId}</p>
                <p className="recording-date">
                  📅 {new Date(recording.startedAt).toLocaleDateString()}
                </p>

                <div className="recording-badges">
                  {recording.transcript && (
                    <span className="badge transcript-badge">📝 Transcript</span>
                  )}
                  {recording.summary && (
                    <span className="badge summary-badge">✨ Summary</span>
                  )}
                </div>

                <div className="recording-actions">
                  <button
                    className="btn-action btn-play"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecording(recording);
                    }}
                  >
                    ▶️ Play
                  </button>
                  <button
                    className="btn-action btn-download"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(recording);
                    }}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(recording._id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recording Details Modal */}
      {selectedRecording && (
        <div className="modal-overlay" onClick={() => setSelectedRecording(null)}>
          <div className="recording-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedRecording(null)}
            >
              ✕
            </button>

            <div className="modal-content">
              <div className="modal-video">
                <video
                  controls
                  width="100%"
                  src={`${BackendURL}${selectedRecording.recordingUrl}`}
                />
              </div>

              <div className="modal-details">
                <h2>{selectedRecording.title}</h2>

                <div className="detail-row">
                  <span className="label">Meeting ID:</span>
                  <span className="value">{selectedRecording.meetingId}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Duration:</span>
                  <span className="value">{selectedRecording.duration}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(
                      selectedRecording.startedAt
                    ).toLocaleString()}
                  </span>
                </div>

                {selectedRecording.summary && (
                  <div className="detail-section">
                    <h3>📝 Summary</h3>
                    <p>{selectedRecording.summary}</p>
                  </div>
                )}

                {selectedRecording.transcript && (
                  <div className="detail-section">
                    <h3>📄 Transcript</h3>
                    <div className="transcript-text">
                      {selectedRecording.transcript}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownload(selectedRecording)}
                  >
                    ⬇️ Download Recording
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      handleDelete(selectedRecording._id);
                      setSelectedRecording(null);
                    }}
                  >
                    🗑️ Delete Recording
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default RecordingLibrary;
