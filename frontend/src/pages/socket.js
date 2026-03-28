import { io } from "socket.io-client";
import { BackendURL } from "../config/backendConfig";

console.log("🔌 Connecting to backend at:", BackendURL);

const socket = io(`${BackendURL}`, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  console.log("✓ Socket connected! ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
  console.error("This could mean:");
  console.error("  - Backend is not running on", BackendURL);
  console.error("  - CORS is not configured");
  console.error("  - Network/firewall blocking connection");
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️  Socket disconnected. Reason:", reason);
});

socket.on("error", (error) => {
  console.error("❌ Socket error:", error);
});

export default socket;
