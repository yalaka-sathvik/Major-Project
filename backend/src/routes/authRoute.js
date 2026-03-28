const passport = require("passport");
const { Register, Login, VerifyOTP, ResendOTP } = require("../controllers/authController");
const { updateProfile, getUserProfile, changePassword, getAllUsers, deleteAccount } = require("../controllers/userController");
const { generateMeetingId, startMeeting, endMeeting, getMeetingDetails, listMeetings, addChatMessage, getMeetingStats } = require("../controllers/meetingController");
const { userVerification } = require("../middlewares/authMiddleware");
const router = require("express").Router();
const multer = require("multer");
const User = require("../models/user.models");
const bcrypt = require("bcrypt");
const path = require("path");
const { activeMeetings } = require("../utils/MeetingStore");
const Meetings = require("../models/meetings.model");
const { generateSummaryFromTranscript } = require("../utils/aiSummaryService");
const { storeMeetingInMemory, findMeetingsByAdminInMemory } = require("../utils/testMeetingStore");
const fs = require("fs");

// Flag to track if MongoDB is available for meetings
let meetingsMongoDBAvailable = true;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${Date.now()}-${file.fieldname}.${ext}`);
  },
});

const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const recordingsPath = path.join(__dirname, "..", "uploads", "recordings");
    require("fs").mkdirSync(recordingsPath, { recursive: true });
    cb(null, recordingsPath);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop() || "webm";
    cb(null, `${Date.now()}-recording.${ext}`);
  },
});

const upload = multer({ storage });
const uploadRecording = multer({ storage: recordingStorage });

const liveSummaryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "recordings");
    require("fs").mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `live-${Date.now()}-segment.${(file.originalname || "webm").split(".").pop()}`);
  },
});
const uploadLiveAudio = multer({ storage: liveSummaryStorage, limits: { fileSize: 15 * 1024 * 1024 } });
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
router.put(
  "/update-profile",
  userVerification,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      console.log("Incoming profile update request...");
      console.log("User ID:", req.user.id);
      console.log("Request Body:", req.body);
      console.log("Uploaded File:", req.file);

      const { username, password } = req.body;
      const userId = req.user.id;
      const updateFields = {};

      if (username) updateFields.username = username;
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields.password = hashedPassword;
      }
      if (req.file) {
        const profilePicPath = `/uploads/${req.file.filename}`;
        updateFields.profilePic = profilePicPath;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: updateFields,
        },
        { new: true }
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        message: "Profile updated",
        username: updatedUser.username,
        updatedProfilePic: updatedUser.profilePic,
      });
    } catch (err) {
      console.error("âŒ Update error:", err);
      res
        .status(500)
        .json({ success: false, message: "Update failed", error: err.message });
    }
  }
);
router.delete("/delete-profile", userVerification, async (req, res) => {
  console.log(" DELETE /delete-profile route loaded");
  try {
    const userId = req.user.id;
    console.log("user", userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" });
    }
    const val = await User.findByIdAndDelete(userId);
    console.log(val);
    console.log("deleted");
    res.clearCookie("token");
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete profile",
      error: err.message,
    });
  }
});
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://clear-connect.vercel.app";

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    if (!req.user || !req.user.token) {
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
    const token = req.user.token;
    const email = req.user.email;
    const username = req.user.username;
    const picture = req.user.profilePic || "./images/2903-default-blue.png";
    res.redirect(
      `${FRONTEND_URL}/google-auth-success?token=${encodeURIComponent(token)}&name=${encodeURIComponent(username || "")}&email=${encodeURIComponent(email || "")}&picture=${encodeURIComponent(picture)}`
    );
  }
);
router.post("/check-meeting", (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    return res
      .status(400)
      .json({ success: false, message: "Meeting ID required" });
  }

  const exists = activeMeetings.has(meetingId);
  console.log(exists);
  if (exists) {
    return res.status(200).json({ success: true, exists: true });
  } else {
    return res.status(200).json({ success: true, exists: false });
  }
});
router.post("/past-meeting", async (req, res) => {
  try {
    const { meetingId, username, admin } = req.body;
    
    // Try MongoDB first
    if (meetingsMongoDBAvailable) {
      try {
        const meeting = new Meetings({
          username,
          meetingId,
          admin,
        });
        await meeting.save();
        return res.status(201).json({ success: true, message: "Meeting saved", meetingDocId: meeting._id.toString() });
      } catch (error) {
        console.warn("MongoDB unavailable for meetings, switching to in-memory storage", error.message);
        meetingsMongoDBAvailable = false;
        // Fall through to in-memory store
      }
    }
    
    // Fall back to in-memory store
    const meetingData = { username, meetingId, admin };
    const result = await storeMeetingInMemory(meetingData);
    console.log("⚠️  Meeting saved to in-memory storage (MongoDB unavailable)");
    res.status(201).json({ 
      success: true, 
      message: "Meeting saved (in-memory)", 
      meetingDocId: result.docId 
    });
  } catch (error) {
    console.error("Error saving meeting:", error);
    res.status(500).json({ success: false, message: "Failed to save meeting" });
  }
});
let data = {};
router.get("/history", async (req, res) => {
  try {
    const { admin } = req.query;
    if (!admin) {
      return res.status(400).json({ success: false, message: "Admin field is required" });
    }
    
    // Try MongoDB first
    if (meetingsMongoDBAvailable) {
      try {
        const userMeetings = await Meetings.find({ admin: admin }).sort({ _id: -1 });
        const data = userMeetings.map((m) => m.toObject());
        return res.status(200).json({ success: true, message: "Meetings loaded", data });
      } catch (error) {
        console.warn("MongoDB unavailable for meetings, switching to in-memory storage", error.message);
        meetingsMongoDBAvailable = false;
        // Fall through to in-memory store
      }
    }
    
    // Fall back to in-memory store
    const meetings = findMeetingsByAdminInMemory(admin);
    const data = meetings.map(m => ({
      _id: m._id.toString(),
      username: m.username,
      meetingId: m.meetingId,
      admin: m.admin,
      createdAt: m.createdAt
    }));
    console.log("⚠️  Fetching meetings from in-memory storage");
    res.status(200).json({ success: true, message: "Meetings loaded (in-memory)", data });
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ success: false, message: "Failed to fetch meetings" });
  }
});

router.post(
  "/meeting/recording",
  uploadRecording.single("recording"),
  async (req, res) => {
    try {
      const { meetingId, admin, chat } = req.body;
      if (!meetingId || !admin) {
        return res.status(400).json({ success: false, message: "meetingId and admin required" });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Recording file required" });
      }
      const recordingPath = `/uploads/recordings/${req.file.filename}`;
      const chatMessages = chat ? JSON.parse(chat) : [];
      const meeting = await Meetings.findOneAndUpdate(
        { meetingId, admin },
        { $set: { recordingUrl: recordingPath, chatMessages } },
        { new: true }
      );
      if (!meeting) {
        return res.status(404).json({ success: false, message: "Meeting not found" });
      }
      return res.status(200).json({ success: true, message: "Recording saved", recordingUrl: recordingPath });
    } catch (error) {
      console.error("Error saving recording:", error);
      return res.status(500).json({ success: false, message: "Failed to save recording", error: error.message });
    }
  }
);

router.post(
  "/meeting/live-summary",
  uploadLiveAudio.single("audio"),
  async (req, res) => {
    let filePath = null;
    try {
      if (req.file) {
        filePath = path.join(__dirname, "..", "uploads", "recordings", req.file.filename);
      }
      return res.status(400).json({
        success: false,
        message: "Summary is generated from call subtitles only. Use the 'Generate summary' button after the call ends.",
      });
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Could not delete live segment file:", e.message);
        }
      }
    }
  }
);

router.post("/meeting/save-live-summary", async (req, res) => {
  try {
    const { meetingId, admin, summary, username } = req.body;
    if (!meetingId || !admin || summary == null) {
      return res.status(400).json({ success: false, message: "meetingId, admin and summary required" });
    }
    let meeting = await Meetings.findOne({ meetingId, admin }).sort({ _id: -1 });
    if (!meeting) {
      meeting = new Meetings({
        meetingId,
        admin,
        username: username || admin,
        summary: String(summary),
      });
      await meeting.save();
    } else {
      await Meetings.findByIdAndUpdate(meeting._id, { $set: { summary: String(summary) } });
    }
    return res.status(200).json({ success: true, message: "Live summary saved" });
  } catch (error) {
    console.error("Save live summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save live summary",
      error: error.message,
    });
  }
});

router.post("/meeting/save-transcript", async (req, res) => {
  try {
    const { meetingId, admin, username, transcript, meetingDocId } = req.body || {};
    if (transcript == null) {
      return res.status(400).json({ success: false, message: "transcript required" });
    }
    const transcriptStr = String(transcript).trim();
    let meeting = null;
    if (meetingDocId) {
      meeting = await Meetings.findById(meetingDocId);
    }
    if (!meeting && meetingId && admin) {
      meeting = await Meetings.findOne({ meetingId, admin }).sort({ _id: -1 });
    }
    if (!meeting) {
      if (meetingId && admin) {
        meeting = new Meetings({
          meetingId,
          admin,
          username: username || admin,
          transcript: transcriptStr,
        });
        await meeting.save();
      } else {
        return res.status(400).json({ success: false, message: "meetingDocId or meetingId and admin required" });
      }
    } else {
      await Meetings.findByIdAndUpdate(meeting._id, { $set: { transcript: transcriptStr } });
    }
    return res.status(200).json({ success: true, message: "Transcript saved" });
  } catch (error) {
    console.error("Save transcript error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save transcript",
      error: error.message,
    });
  }
});

router.post("/meeting/summary", async (req, res) => {
  try {
    const { meetingId, admin } = req.body;
    if (!meetingId || !admin) {
      return res.status(400).json({ success: false, message: "meetingId and admin required" });
    }
    const meeting = await Meetings.findOne({ meetingId, admin }).sort({ _id: -1 });
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    if (!meeting.transcript || meeting.transcript.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "No call subtitles available. Join a call so subtitles are captured, then generate summary.",
      });
    }
    const summary = await generateSummaryFromTranscript(meeting.transcript);
    await Meetings.findByIdAndUpdate(meeting._id, { $set: { summary } });
    return res.status(200).json({ success: true, message: "Summary generated", summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate summary",
      error: error.message,
    });
  }
});

router.post("/register", Register);
router.post("/verify-otp", VerifyOTP);
router.post("/resend-otp", ResendOTP);
router.get("/test", (req, res) => {
  return res.json({ message: "done!" });
});
router.post("/login", Login);
router.post("/", userVerification);

// ============ USER ROUTES ============
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "..", "uploads", "avatars");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-avatar${ext}`);
  },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.put("/profile", uploadAvatar.single("profilePic"), updateProfile);
router.get("/profile/:userId", getUserProfile);
router.put("/change-password", changePassword);
router.get("/users/all", getAllUsers);
router.delete("/account", deleteAccount);

// ============ MEETING ROUTES ============
router.get("/meeting/generate-id", generateMeetingId);
router.post("/meeting/start", startMeeting);
router.post("/meeting/end", endMeeting);
router.get("/meeting/:meetingId", getMeetingDetails);
router.get("/meetings/list", listMeetings);
router.post("/meeting/chat", addChatMessage);
router.get("/meeting/:meetingId/stats", getMeetingStats);

module.exports = router;

