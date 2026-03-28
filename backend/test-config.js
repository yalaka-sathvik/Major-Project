#!/usr/bin/env node

require("dotenv").config();
const mongoose = require("mongoose");

console.log("🧪 Testing Backend Configuration...\n");

// Test MongoDB Connection
console.log("1️⃣  Testing MongoDB Connection...");
console.log(`   URL: ${process.env.MONGO_URL ? "✓ Set" : "❌ Not set"}`);

if (process.env.MONGO_URL) {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("   ✅ MongoDB connected successfully");
      mongoose.disconnect();
    })
    .catch((err) => {
      console.error("   ❌ MongoDB connection failed:", err.message);
    });
} else {
  console.log("   ⚠️  MONGO_URL not configured");
}

// Test Email Configuration
console.log("\n2️⃣  Testing Email Configuration...");
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  console.log("   ✓ EMAIL_USER:", process.env.EMAIL_USER);
  console.log("   ✓ EMAIL_PASSWORD: [set]");
  console.log("   ✅ Email credentials configured");
} else {
  console.log("   ⚠️  Email credentials not set");
}

// Test Google OAuth
console.log("\n3️⃣  Testing Google OAuth...");
if (process.env.GOOGLE_CLIENT_KEY && process.env.GOOGLE_CLIENT_SECRET) {
  console.log("   ✅ Google OAuth configured");
} else {
  console.log("   ⚠️  Google OAuth not configured (optional)");
}

// Test Gemini API
console.log("\n4️⃣  Testing Gemini API...");
if (process.env.GEMINI_API_KEY) {
  console.log("   ✅ Gemini API key configured");
} else {
  console.log("   ⚠️  Gemini API not configured (optional)");
}

// Test Token Key
console.log("\n5️⃣  Testing JWT Token Key...");
if (process.env.TOKEN_KEY) {
  console.log("   ✅ TOKEN_KEY configured");
} else {
  console.log("   ❌ TOKEN_KEY not set (required for authentication)");
}

console.log("\n✅ Configuration check complete!");
