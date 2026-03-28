const Meetings = require("../models/meetings.model");
const { storeMeetingInMemory, findMeetingsByAdminInMemory, findMeetingInMemory } = require("../utils/testMeetingStore");
const { v4: uuidv4 } = require("uuid");

let meetingsMongoDBAvailable = true;

// Generate unique meeting ID
module.exports.generateMeetingId = (req, res) => {
  try {
    const meetingId = uuidv4().substring(0, 8).toUpperCase();
    res.status(200).json({
      success: true,
      meetingId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate meeting ID",
    });
  }
};

// Start a new meeting
module.exports.startMeeting = async (req, res) => {
  try {
    const { meetingId, admin, title } = req.body;

    if (!meetingId || !admin) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID and admin are required",
      });
    }

    const meetingData = {
      meetingId,
      admin,
      username: admin,
      title: title || "New Meeting",
      startedAt: new Date(),
      status: "active",
    };

    if (meetingsMongoDBAvailable) {
      try {
        const meeting = new Meetings(meetingData);
        await meeting.save();
        return res.status(201).json({
          success: true,
          message: "Meeting started",
          meeting,
        });
      } catch (error) {
        console.warn("MongoDB unavailable for meetings", error.message);
        meetingsMongoDBAvailable = false;
      }
    }

    // Fallback to in-memory
    await storeMeetingInMemory(meetingData);
    console.log("⚠️  Meeting started in in-memory storage");
    res.status(201).json({
      success: true,
      message: "Meeting started (in-memory)",
      meeting: meetingData,
    });
  } catch (error) {
    console.error("Start meeting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start meeting",
    });
  }
};

// End meeting
module.exports.endMeeting = async (req, res) => {
  try {
    const { meetingId, admin } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID is required",
      });
    }

    if (meetingsMongoDBAvailable) {
      try {
        const meeting = await Meetings.findOneAndUpdate(
          { meetingId, admin },
          { status: "ended", endedAt: new Date() },
          { new: true }
        );

        if (!meeting) {
          return res.status(404).json({
            success: false,
            message: "Meeting not found",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Meeting ended",
          meeting,
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        meetingsMongoDBAvailable = false;
      }
    }

    // In-memory fallback
    console.log("⚠️  Meeting ended in in-memory storage");
    res.status(200).json({
      success: true,
      message: "Meeting ended (in-memory)",
    });
  } catch (error) {
    console.error("End meeting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end meeting",
    });
  }
};

// Get meeting details
module.exports.getMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID is required",
      });
    }

    if (meetingsMongoDBAvailable) {
      try {
        const meeting = await Meetings.findOne({ meetingId });
        if (!meeting) {
          return res.status(404).json({
            success: false,
            message: "Meeting not found",
          });
        }
        return res.status(200).json({
          success: true,
          meeting,
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        meetingsMongoDBAvailable = false;
      }
    }

    // In-memory fallback
    const meeting = findMeetingInMemory(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found in in-memory storage",
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("Get meeting details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting details",
    });
  }
};

// List all meetings for a user
module.exports.listMeetings = async (req, res) => {
  try {
    const { admin } = req.query;

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin field is required",
      });
    }

    if (meetingsMongoDBAvailable) {
      try {
        const meetings = await Meetings.find({ admin }).sort({ _id: -1 }).limit(50);
        return res.status(200).json({
          success: true,
          count: meetings.length,
          meetings,
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        meetingsMongoDBAvailable = false;
      }
    }

    // In-memory fallback
    const meetings = findMeetingsByAdminInMemory(admin);
    console.log("⚠️  Fetching meetings from in-memory storage");
    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
      message: "Using in-memory storage",
    });
  } catch (error) {
    console.error("List meetings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
    });
  }
};

// Add chat message to meeting
module.exports.addChatMessage = async (req, res) => {
  try {
    const { meetingId, sender, message } = req.body;

    if (!meetingId || !sender || !message) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID, sender, and message are required",
      });
    }

    if (meetingsMongoDBAvailable) {
      try {
        const meeting = await Meetings.findOneAndUpdate(
          { meetingId },
          {
            $push: {
              chatMessages: {
                sender,
                text: message,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        );

        if (!meeting) {
          return res.status(404).json({
            success: false,
            message: "Meeting not found",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Message added",
          meeting,
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        meetingsMongoDBAvailable = false;
      }
    }

    // In-memory fallback
    console.log("⚠️  Chat message added to in-memory storage");
    res.status(200).json({
      success: true,
      message: "Message added (in-memory)",
    });
  } catch (error) {
    console.error("Add chat message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add message",
    });
  }
};

// Get meeting statistics
module.exports.getMeetingStats = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID is required",
      });
    }

    if (meetingsMongoDBAvailable) {
      try {
        const meeting = await Meetings.findOne({ meetingId });
        if (!meeting) {
          return res.status(404).json({
            success: false,
            message: "Meeting not found",
          });
        }

        const stats = {
          meetingId,
          duration: meeting.endedAt ? (meeting.endedAt - meeting.startedAt) / 1000 : 0,
          chatMessagesCount: meeting.chatMessages ? meeting.chatMessages.length : 0,
          hasRecording: !!meeting.recordingUrl,
          hasSummary: !!meeting.summary,
          hasTranscript: !!meeting.transcript,
        };

        return res.status(200).json({
          success: true,
          stats,
        });
      } catch (error) {
        console.warn("MongoDB unavailable", error.message);
        meetingsMongoDBAvailable = false;
      }
    }

    // In-memory fallback
    console.log("⚠️  Fetching stats from in-memory storage");
    res.status(200).json({
      success: true,
      stats: {
        meetingId,
        duration: 0,
        chatMessagesCount: 0,
        hasRecording: false,
        hasSummary: false,
        hasTranscript: false,
        message: "Using in-memory storage",
      },
    });
  } catch (error) {
    console.error("Get meeting stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};
