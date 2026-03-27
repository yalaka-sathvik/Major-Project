const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnv() {
  // Try to load from backend/.env first, then from repo root (if present).
  const candidatePaths = [
    path.resolve(__dirname, "..", "..", ".env"), // backend/.env
    path.resolve(__dirname, "..", "..", "..", ".env"), // repo root .env
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return p;
    }
  }

  // Fallback: use whatever dotenv can find from process.cwd()
  dotenv.config();
  return null;
}

module.exports = { loadEnv };

