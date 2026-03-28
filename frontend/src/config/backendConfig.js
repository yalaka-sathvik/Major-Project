/**
 * Smart backend URL detection
 * Automatically detects if frontend is accessed locally or over network
 * and routes to the appropriate backend
 */

const getBackendURL = () => {
  const envURL = import.meta.env.VITE_API_URL || "http://localhost:9000";
  
  // Get the current hostname/IP the frontend is being accessed from
  const currentHost = window.location.hostname;
  
  // If accessing via localhost, use localhost backend
  if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    return "http://localhost:9000";
  }
  
  // If accessing via network IP, use network backend
  // (handles any network IP like 192.168.x.x or 10.x.x.x)
  if (currentHost.includes("192.168") || currentHost.includes("10.")) {
    return `http://${currentHost}:9000`;
  }
  
  // Fallback to env variable
  return envURL;
};

export const BackendURL = getBackendURL();

console.log("🔌 Frontend accessed from:", window.location.hostname);
console.log("🔌 Connecting to backend at:", BackendURL);
