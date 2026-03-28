// Screen sharing helper functions for frontend use

export const startScreenShare = async () => {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: false,
    });
    return displayStream;
  } catch (error) {
    console.error("Error starting screen share:", error);
    if (error.name === "NotAllowedError") {
      throw new Error("Screen sharing was cancelled by user");
    }
    throw error;
  }
};

export const stopScreenShare = (screenStream) => {
  if (screenStream) {
    screenStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

export const replaceVideoTrack = async (peerConnection, newStream) => {
  const videoTrack = newStream.getVideoTracks()[0];
  if (!videoTrack) {
    throw new Error("No video track in stream");
  }

  const sender = peerConnection
    .getSenders()
    .find((s) => s.track && s.track.kind === "video");

  if (sender) {
    await sender.replaceTrack(videoTrack);
  }
};

export const getAudioStats = async (peerConnection) => {
  const stats = await peerConnection.getStats();
  let audioStats = {};

  stats.forEach((report) => {
    if (report.type === "inbound-rtp" && report.kind === "audio") {
      audioStats.bytesReceived = report.bytesReceived;
      audioStats.packetsLost = report.packetsLost;
      audioStats.jitter = report.jitter;
    } else if (report.type === "outbound-rtp" && report.kind === "audio") {
      audioStats.bytesSent = report.bytesSent;
      audioStats.audioLevel = report.audioLevel;
    }
  });

  return audioStats;
};

export const getVideoStats = async (peerConnection) => {
  const stats = await peerConnection.getStats();
  let videoStats = {};

  stats.forEach((report) => {
    if (report.type === "inbound-rtp" && report.kind === "video") {
      videoStats.bytesReceived = report.bytesReceived;
      videoStats.framesDecoded = report.framesDecoded;
      videoStats.frameRate = report.framesPerSecond;
    } else if (report.type === "outbound-rtp" && report.kind === "video") {
      videoStats.bytesSent = report.bytesSent;
      videoStats.framesEncoded = report.framesEncoded;
      videoStats.frameRate = report.frameRate;
    }
  });

  return videoStats;
};
