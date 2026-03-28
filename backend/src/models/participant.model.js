const { Schema, model } = require("mongoose");

const participantSchema = new Schema({
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  videoEnabled: {
    type: Boolean,
    default: true,
  },
  audioEnabled: {
    type: Boolean,
    default: true,
  },
});

module.exports = model("Participant", participantSchema);
