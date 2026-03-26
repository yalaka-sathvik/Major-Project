const { Schema } = require("mongoose");
const { model } = require("mongoose");
const meetingSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  meetingId: {
    type: String,
    required: true,
  },
  admin: {
    type: String,
    required: true,
  },
  recordingUrl: {
    type: String,
    default: null,
  },
  chatMessages: [
    {
      sender: String,
      text: String,
    },
  ],
  summary: {
    type: String,
    default: null,
  },
  transcript: {
    type: String,
    default: null,
  },
});

module.exports = model("Meetings", meetingSchema);
