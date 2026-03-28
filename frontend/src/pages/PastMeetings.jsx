import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { BackendURL } from "../config/backendConfig";

function PastMeetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [expandedMeeting, setExpandedMeeting] = useState(null);
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first", { position: "bottom-left" });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    fetchMeetings();
  }, [navigate]);

  const fetchMeetings = async () => {
    try {
      const admin = localStorage.getItem("username");
      const response = await axios.get(`${BackendURL}/history?admin=${admin}`);
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error("Error fetching past meetings:", error);
      toast.error("Failed to load meetings", { position: "bottom-center" });
    }
  };

  const toggleMeeting = (index) => {
    setExpandedMeeting((prev) => (prev === index ? null : index));
  };

  const handleGenerateSummary = async (meeting) => {
    const key = meeting._id || `${meeting.meetingId}-${meeting.admin}`;
    setGeneratingSummaryFor(key);
    try {
      const admin = localStorage.getItem("username");
      const { data } = await axios.post(`${BackendURL}/meeting/summary`, {
        meetingId: meeting.meetingId,
        admin: admin || meeting.admin,
      });
      if (data.success) {
        toast.success("Summary generated!", { position: "bottom-right" });
        setMeetings((prev) =>
          prev.map((m) =>
            (m._id && m._id === meeting._id) ||
            (m.meetingId === meeting.meetingId && m.admin === meeting.admin)
              ? { ...m, summary: data.summary }
              : m
          )
        );
      } else {
        toast.error(data.message || "Failed to generate summary", { position: "bottom-center" });
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Failed to generate summary";
      toast.error(msg, { position: "bottom-center", autoClose: 6000 });
    } finally {
      setGeneratingSummaryFor(null);
    }
  };

  return (
    <div className="past-meetings-container">
      <h1 className="title">Past Meetings</h1>
      {meetings.length === 0 ? (
        <p className="no-meetings">No meetings found.</p>
      ) : (
        <div className="meetings-list">
          {meetings.map((meeting, index) => (
            <div key={index} className="meeting-card">
              <div
                className="meeting-card-header"
                onClick={() => toggleMeeting(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && toggleMeeting(index)
                }
              >
                <p className="meeting-summary">
                  <strong>Username:</strong> {meeting.username} &nbsp;|&nbsp;{" "}
                  <strong>Meeting ID:</strong> {meeting.meetingId}
                </p>
                <span className="expand-icon">
                  {expandedMeeting === index ? "▼" : "▶"}
                </span>
              </div>

              {expandedMeeting === index && (
                <div className="meeting-details">
                  {meeting.recordingUrl ? (
                    <div className="recording-section">
                      <h4>Recorded Video</h4>
                      <video
                        controls
                        src={`${BackendURL}${meeting.recordingUrl}`}
                        className="meeting-video"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <p className="no-recording">No recording available for this meeting.</p>
                  )}

                  {meeting.transcript ? (
                    <div className="transcript-section">
                      <h4>Call subtitles</h4>
                      <div className="transcript-messages">
                        {meeting.transcript
                          .split(/(?<=[.!?])\s+|\n+/)
                          .filter((s) => s.trim())
                          .map((line, i) => (
                            <div key={i} className="transcript-msg">
                              {line.trim()}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="no-transcript">No subtitles recorded for this meeting.</p>
                  )}

                  <div className="summary-section">
                    <h4>Meeting Summary</h4>
                    {meeting.summary ? (
                      <div className="meeting-summary-text">{meeting.summary}</div>
                    ) : (meeting.transcript || meeting.recordingUrl) ? (
                      <div>
                        <p className="no-summary">
                          No summary yet. Generate one from the call subtitles{meeting.recordingUrl ? " or recording" : ""}.
                        </p>
                        <button
                          className="btn-summary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateSummary(meeting);
                          }}
                          disabled={generatingSummaryFor === (meeting._id || `${meeting.meetingId}-${meeting.admin}`)}
                        >
                          {generatingSummaryFor === (meeting._id || `${meeting.meetingId}-${meeting.admin}`)
                            ? "Generating..."
                            : "Generate AI Summary"}
                        </button>
                      </div>
                    ) : (
                      <p className="no-summary">No summary available. Join a call so subtitles are saved, then generate summary.</p>
                    )}
                  </div>

                  {meeting.chatMessages && meeting.chatMessages.length > 0 ? (
                    <div className="chat-section">
                      <h4>Chat</h4>
                      <div className="meeting-chat">
                        {meeting.chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`chat-msg ${
                              msg.sender === meeting.username ? "my-msg" : "other-msg"
                            }`}
                          >
                            <strong>{msg.sender}:</strong> {msg.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="no-chat">No chat messages for this meeting.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

export default PastMeetings;
