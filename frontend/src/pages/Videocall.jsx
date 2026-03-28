// Videocall.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import socket from "./socket";
import "../Videocall.css";
import "react-toastify/dist/ReactToastify.css";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
const BackendURL = import.meta.env.VITE_API_URL;

export default function Videocall() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { username, meetingId, isVideo, isAudio, meetingDocId } = state || {};

  const [peers, setPeers] = useState([]);
  const [videoEnabled, setVideoEnabled] = useState(isVideo);
  const [audioEnabled, setAudioEnabled] = useState(isAudio);
  const [mySocketId, setMySocketId] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isParticipantsEnabled, setIsParticipantsEnabled] = useState(false);
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleText, setSubtitleText] = useState("");

  const userVideo = useRef();
  const recognitionRef = useRef(null);
  const subtitlesEnabledRef = useRef(false);
  subtitlesEnabledRef.current = subtitlesEnabled;
  const streamRef = useRef();
  const peerConnections = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const recordingAudioContextRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const transcriptRef = useRef("");

  const shouldFloatMyVideo =
    peers.length >= 1 && !chatOpen && !isParticipantsEnabled;

  useEffect(() => {
    socket.on("connect", () => {
      setMySocketId(socket.id);
      socket.emit("join-meeting", { meetingId });
    });

    socket.on("meeting-exists", ({ success, message }) => {
      if (!success) {
        toast.error(message || "Meeting already running with same ID", {
          position: "bottom-center",
        });
        setTimeout(() => navigate("/"), 3000);
      }
    });

    const handleServerMsg = ({ username: sender, message }) => {
      setMessages((prev) => [...prev, { sender, text: message }]);
    };
    socket.on("server-msg", handleServerMsg);

    socket.on("video-toggled", ({ userId, isVideoEnabled }) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.peerID === userId ? { ...p, videoEnabled: isVideoEnabled } : p
        )
      );
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("✓ Media stream acquired successfully");
        stream.getVideoTracks().forEach((track) => (track.enabled = isVideo));
        stream.getAudioTracks().forEach((track) => (track.enabled = isAudio));

        userVideo.current.srcObject = stream;
        streamRef.current = stream;

        console.log("Emitting join-room event with:", { meetingId, username, isVideo, isAudio });
        socket.emit("join-room", {
          meetingId,
          username,
          videoEnabled: isVideo,
          audioEnabled: isAudio,
        });

        // Start transcript capture for every call (subtitles → AI summary, no audio upload)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition && !recognitionRef.current) {
          const startRecognition = () => {
            if (recognitionRef.current) return;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";
            recognition.onresult = (event) => {
              let text = "";
              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                  text += event.results[i][0].transcript + " ";
                }
              }
              if (text) {
                transcriptRef.current += text;
                setSubtitleText((prev) => prev + text);
              }
            };
            recognition.onerror = (e) => {
              if (e.error !== "aborted" && e.error !== "no-speech") console.error("Speech recognition error:", e.error);
            };
            recognition.onend = () => {
              if (recognitionRef.current)
                try {
                  recognition.start();
                } catch (err) {
                  // Ignore restart failures (browser may block frequent SpeechRecognition restarts).
                  console.debug("Speech recognition restart failed:", err?.message);
                }
            };
            try {
              recognition.start();
              recognitionRef.current = recognition;
            } catch (err) {
              console.error("Could not start speech recognition:", err);
            }
          };
          setTimeout(startRecognition, 400);
        }

        socket.on("all-users", (users) => {
          console.log("✓ All-users event received. Users in room:", users);
          users.forEach((user) => {
            const peer = createPeer(user.userId, stream);
            peerConnections.current[user.userId] = peer;
            setPeers((prev) => [
              ...prev,
              {
                peerID: user.userId,
                username: user.username,
                stream: null,
                videoEnabled: user.videoEnabled ?? true,
              },
            ]);
          });
        });

        socket.on("user-joined", ({ userId, username, videoEnabled }) => {
          console.log("✓ User joined:", username, "(" + userId + ")");
          const peer = addPeer(userId, stream);
          peerConnections.current[userId] = peer;
          setPeers((prev) => [
            ...prev,
            {
              peerID: userId,
              username,
              stream: null,
              videoEnabled: videoEnabled ?? true,
            },
          ]);
        });

        socket.on("signal", async ({ from, signal }) => {
          const peer = peerConnections.current[from];
          if (peer) {
            try {
              if (signal.sdp) {
                await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                if (signal.sdp.type === "offer") {
                  const answer = await peer.createAnswer();
                  await peer.setLocalDescription(answer);
                  socket.emit("signal", {
                    to: from,
                    from: socket.id,
                    signal: { sdp: peer.localDescription },
                  });
                }
              } else if (signal.candidate) {
                await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
              }
            } catch (err) {
              console.error("Signal error:", err);
            }
          }
        });

        socket.on("user-left", ({ userId }) => {
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
          }
          setPeers((prev) => prev.filter((p) => p.peerID !== userId));
        });
      })
      .catch((error) => {
        console.error("❌ Media access error:", error);
        let errorMessage = "Media access denied. Please allow camera and microphone.";
        
        if (error.name === "NotAllowedError") {
          errorMessage = "Permission denied: Please allow camera and microphone access in your browser settings.";
          console.warn("💡 You denied permissions. Go to browser settings to allow camera/mic.");
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera or microphone found on this device.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Cannot access camera/microphone. They might be in use by another application.";
        } else if (error.name === "SecurityError") {
          errorMessage = "Secure connection required (HTTPS). Camera not available over HTTP.";
        }
        
        console.error("Error details:", error.name, error.message);
        toast.error(errorMessage, {
          position: "bottom-center",
          autoClose: 5000,
        });
        setTimeout(() => navigate("/"), 3000);
      });

    return () => {
      socket.off("server-msg", handleServerMsg);
      socket.disconnect();
    };
  }, [isAudio, isVideo, meetingId, navigate, username]);

  function createPeer(userId, stream) {
    const peer = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          to: userId,
          from: socket.id,
          signal: { candidate: event.candidate },
        });
      }
    };

    peer.ontrack = (event) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.peerID === userId && !p.stream ? { ...p, stream: event.streams[0] } : p
        )
      );
    };

    peer.createOffer()
      .then((offer) => peer.setLocalDescription(offer))
      .then(() => {
        socket.emit("signal", {
          to: userId,
          from: socket.id,
          signal: { sdp: peer.localDescription },
        });
      });

    return peer;
  }

  function addPeer(fromId, stream) {
    const peer = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          to: fromId,
          from: socket.id,
          signal: { candidate: event.candidate },
        });
      }
    };

    peer.ontrack = (event) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.peerID === fromId && !p.stream ? { ...p, stream: event.streams[0] } : p
        )
      );
    };

    return peer;
  }

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
      socket.emit("video-toggled", {
        meetingId,
        userId: socket.id,
        isVideoEnabled: track.enabled,
      });
      setVideoRefreshKey((k) => k + 1);
    }
  };

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  };

  const toggleChat = () => {
    setIsParticipantsEnabled(false);
    setChatOpen((prev) => !prev);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("client-msg", { message: newMessage, username, meetingId });
      setNewMessage("");
    }
  };

  const handleParticipants = () => {
    setChatOpen(false);
    setIsParticipantsEnabled((prev) => !prev);
  };

  const handleDisconnect = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const transcript = (transcriptRef.current || "").trim();
    const adminUser = localStorage.getItem("username") || username;
    if (transcript.length > 0) {
      axios
        .post(`${BackendURL}/meeting/save-transcript`, {
          meetingId: meetingId || "",
          admin: adminUser || username,
          username: username || adminUser,
          transcript,
          meetingDocId: meetingDocId || undefined,
        })
        .then(() => toast.success("Transcript saved. View in Past Meetings.", { position: "bottom-right" }))
        .catch((err) => console.error("Save transcript failed:", err));
    }
    if (isRecording && mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    Object.values(peerConnections.current).forEach((p) => p.close());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    socket.disconnect();
    setPeers([]);
    setChatOpen(false);
    setIsParticipantsEnabled(false);
    toast.success("Ending the meeting", { position: "bottom-right" });
    setTimeout(() => navigate("/"), 3000);
  };

  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      userVideo.current.srcObject = screenStream;
      screenTrack.onended = () => {
        const webcamTrack = streamRef.current.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track.kind === "video");
          if (sender) sender.replaceTrack(webcamTrack);
        });
        userVideo.current.srcObject = streamRef.current;
      };
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = screenStream;
      screenStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        screenStreamRef.current = null;
        setIsRecording(false);
      };
      const combinedStream = new MediaStream();
      screenStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));

      // Use AudioContext to mix: local mic + remote participants (getDisplayMedia rarely has audio for screen/window)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") await audioContext.resume();
      const audioDestination = audioContext.createMediaStreamDestination();
      let hasAnyAudio = false;

      if (streamRef.current?.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(streamRef.current);
        micSource.connect(audioDestination);
        hasAnyAudio = true;
      }
      peers.forEach((p) => {
        if (p.stream?.getAudioTracks().length > 0) {
          const remoteSource = audioContext.createMediaStreamSource(p.stream);
          remoteSource.connect(audioDestination);
          hasAnyAudio = true;
        }
      });
      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(screenStream);
        screenSource.connect(audioDestination);
        hasAnyAudio = true;
      }
      if (hasAnyAudio) {
        audioDestination.stream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
      }
      recordingAudioContextRef.current = audioContext;

      recordedChunksRef.current = [];
      const mimeOpts = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm",
      ];
      const mimeType = mimeOpts.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setIsRecording(false);
        if (recordingAudioContextRef.current) {
          recordingAudioContextRef.current.close().catch(() => {});
          recordingAudioContextRef.current = null;
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const admin = localStorage.getItem("username");
        const formData = new FormData();
        formData.append("recording", blob, "recording.webm");
        formData.append("meetingId", meetingId);
        formData.append("admin", admin || username);
        formData.append("chat", JSON.stringify(messagesRef.current));
        try {
          await axios.post(`${BackendURL}/meeting/recording`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          toast.success("Recording saved successfully", { position: "bottom-right" });
        } catch (err) {
          console.error("Failed to upload recording:", err);
          toast.error("Failed to save recording", { position: "bottom-center" });
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.success("Recording entire screen/tab - select what to share", { position: "bottom-right" });
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Screen share is required for recording. Please allow access.", { position: "bottom-center" });
    }
  };

  useEffect(() => {
    document.body.classList.toggle("chat-open", chatOpen);
    document.body.classList.toggle("participants-open", isParticipantsEnabled);
  }, [chatOpen, isParticipantsEnabled]);

  const toggleSubtitles = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Subtitles not supported in this browser. Try Chrome or Edge.", {
        position: "bottom-center",
      });
      return;
    }
    if (subtitlesEnabled) {
      subtitlesEnabledRef.current = false;
      setSubtitleText("");
      setSubtitlesEnabled(false);
      toast.info("Subtitles hidden (transcript still recorded for summary)", { position: "bottom-right" });
      return;
    }
    subtitlesEnabledRef.current = true;
    setSubtitlesEnabled(true);
    toast.success("Subtitles on – speaking will appear as text", { position: "bottom-right" });
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="video-wrapper">
      <h2 className="room-title">Meeting Id: {meetingId}</h2>

      <div
        className={`main-content ${chatOpen || isParticipantsEnabled ? "chat-open" : ""}`}
      >
        <div
          className={`remote-grid users-${peers.length + 1} ${
            chatOpen || isParticipantsEnabled ? "centered" : ""
          }`}
        >
          {!shouldFloatMyVideo && (
            <Video
              key={`self-${videoRefreshKey}`}
              stream={streamRef.current}
              username={`${username} (You)`}
              isSelf={true}
              userVideoRef={userVideo}
              videoEnabled={videoEnabled}
            />
          )}
          {peers.map(({ peerID, stream, username, videoEnabled }) => (
            <Video
              key={peerID}
              stream={stream}
              username={username}
              videoEnabled={videoEnabled}
            />
          ))}
        </div>

        {chatOpen && (
          <div className="chat-box">
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message ${
                    msg.sender === username ? "my-message" : "other-message"
                  }`}
                >
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}

        {isParticipantsEnabled && (
          <div className="participants-box">
            <h3>Participants</h3>
            <ul>
              <li key={mySocketId}>{username} (You)</li>
              {peers.map((peer) => (
                <li key={peer.peerID}>{peer.username}</li>
              ))}
            </ul>
          </div>
        )}

        </div>

      {subtitlesEnabled && (
        <div className="subtitles-overlay">
          <p>{subtitleText || "Listening..."}</p>
        </div>
      )}

      {shouldFloatMyVideo && (
        <div className="floating-self-video">
          <Video
            key={`self-floating-${videoRefreshKey}`}
            stream={streamRef.current}
            username={`${username} (You)`}
            isSelf={true}
            userVideoRef={userVideo}
            videoEnabled={videoEnabled}
          />
        </div>
      )}

      <div className="controls-row">
        {[
          {
            onClick: toggleAudio,
            srcOn: "https://img.icons8.com/ios-filled/50/microphone--v1.png",
            srcOff: "https://img.icons8.com/ios-filled/50/no-microphone--v1.png",
            enabled: audioEnabled,
            alt: "toggle-audio",
          },
          {
            onClick: toggleVideo,
            srcOn: "https://img.icons8.com/ios-filled/50/video-call.png",
            srcOff: "https://img.icons8.com/ios-filled/50/no-video--v1.png",
            enabled: videoEnabled,
            alt: "toggle-video",
          },
          {
            onClick: handleScreenShare,
            srcOn: "https://img.icons8.com/ios-filled/50/present-to-all.png",
            alt: "present",
          },
          {
            onClick: handleRecordToggle,
            srcOn: isRecording
              ? "https://img.icons8.com/ios-filled/50/stop-squared.png"
              : "https://img.icons8.com/ios-filled/50/record.png",
            alt: "record",
            className: isRecording ? "recording-active" : "",
          },
          {
            onClick: handleParticipants,
            srcOn: "https://img.icons8.com/ios-filled/50/conference-foreground-selected.png",
            alt: "participants",
          },
          {
            onClick: toggleChat,
            srcOn: "https://img.icons8.com/ios-glyphs/50/chat.png",
            alt: "chat",
          },
          {
            onClick: toggleSubtitles,
            srcOn: "https://img.icons8.com/ios-filled/50/closed-caption.png",
            alt: "subtitles",
            className: subtitlesEnabled ? "subtitles-active" : "",
          },
          {
            onClick: handleDisconnect,
            srcOn: "https://img.icons8.com/android/24/end-call.png",
            alt: "end-call",
          },
        ].map(({ onClick, srcOn, srcOff, enabled = true, alt, className = "" }, i) => (
          <button
            key={i}
            onClick={onClick}
            className={`control-btn ${className}`}
            type="button"
          >
            <img
              src={enabled ? srcOn : srcOff || srcOn}
              alt={alt}
              width={40}
              height={40}
            />
          </button>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
}

function Video({ stream, username, isSelf = false, userVideoRef, videoEnabled = true }) {
  const ref = useRef();
  const [showVideo, setShowVideo] = useState(videoEnabled);

  useEffect(() => {
    const videoElement = isSelf ? userVideoRef?.current : ref.current;
    if (videoElement && stream) videoElement.srcObject = stream;
  }, [stream, isSelf, userVideoRef]);

  useEffect(() => setShowVideo(videoEnabled), [videoEnabled]);

  const getInitials = (name) =>
    name.replace(/\(.*?\)/g, "").trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="video-box" style={{ position: "relative" }}>
      <video
        playsInline
        autoPlay
        muted={isSelf}
        ref={isSelf ? userVideoRef : ref}
        style={{ width: "100%", height: "100%", borderRadius: "1rem", objectFit: "cover" }}
      />
      {!showVideo && (
        <div
          className="video-disabled-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            background: "#000",
            width: "100%",
            height: "100%",
            borderRadius: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "5em",
            fontWeight: "bold",
          }}
        >
          {getInitials(username)}
        </div>
      )}
      <h4 className="username">{username}</h4>
    </div>
  );
}
