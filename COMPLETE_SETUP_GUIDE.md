# Complete Video Conferencing Application - Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [API Documentation](#api-documentation)
7. [Features](#features)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This is a **complete, production-ready video conferencing application** built with:
- **Frontend**: React 18 + Vite + Socket.io
- **Backend**: Node.js + Express + MongoDB
- **Real-time Communication**: WebRTC + Socket.io
- **Features**: Video/Audio calls, Chat, Recording, Transcription, AI Summaries, Meeting History

### Key Features
✅ User Authentication (Email + Google OAuth)  
✅ High-quality Video & Audio  
✅ Real-time Chat  
✅ Meeting Recording & Playback  
✅ Live Transcription & Subtitles  
✅ AI-powered Meeting Summaries  
✅ Meeting History & Analytics  
✅ User Profile Management  
✅ Responsive Design (Mobile, Tablet, Desktop)  
✅ Dark Mode Support (coming soon)  

---

## 🔧 Prerequisites

### Required Software
- **Node.js** v16+ (download from https://nodejs.org)
- **npm** v7+ (comes with Node.js)
- **MongoDB** (local or Atlas cloud account)
- **Google OAuth Credentials** (for login feature)
- **Gemini API Key** (for AI summaries)

### Optional
- **Git** for version control
- **Docker** for containerization
- **Postman** for API testing

---

## 📦 Installation

### 1. Clone or Create Project
```bash
# Navigate to project directory
cd d:\Dhonesh\Projects\Major-project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Verify Installation
```bash
# Backend check
cd backend
node -v  # Should show v16+
npm -v   # Should show v7+
npm list # Should show all packages

# Frontend check
cd ../frontend
npm list
```

---

## ⚙️ Configuration

### Backend Setup (.env file)

Create `backend/.env`:
```env
# MongoDB Connection
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret
TOKEN_KEY=your_very_long_secret_key_here_at_least_32_characters

# Google OAuth
GOOGLE_CLIENT_KEY=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Application URLs
BACKEND_URL=http://localhost:9000
FRONTEND_URL=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
AI_SUMMARY_PROVIDER=gemini
```

### Frontend Setup (.env file)

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:9000
```

### Configure MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account or login
3. Create a cluster
4. Add your IP address to Network Access:
   - Click "Network Access"
   - Click "Add IP Address"
   - Select "Add Current IP Address"
   - Or allow all IPs: 0.0.0.0/0 (not recommended for production)
5. Create a Database User:
   - Click "Database Access"
   - "Add New Database User"
   - Save connection string
6. Copy connection string to `.env` as MONGO_URL

### Get Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized URIs:
   - `http://localhost:9000`
   - `http://localhost:9000/auth/google/callback`
   - `http://localhost:5173`
6. Copy Client ID and Secret to `.env`

### Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy key to `.env` as GEMINI_API_KEY

---

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Backend Server
```bash
cd d:\Dhonesh\Projects\Major-project\backend
npm run dev
```
Expected output:
```
server is running on port 9000
db connected
```

#### Terminal 2 - Frontend Dev Server  
```bash
cd d:\Dhonesh\Projects\Major-project\frontend
npm run dev
```
Expected output:
```
VITE v6.3.5 ready in XXX ms
➜  Local:   http://localhost:5173/
```

#### Testing
Open browser: http://localhost:5173

### Production Build

```bash
# Build frontend
cd frontend
npm run build
# Creates dist/ folder

# Production server (requires PM2 or similar)
cd ../backend
npm run prod
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:9000
```

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email",
  "email": "john@example.com"
}
```

#### Verify OTP
```http
POST /verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Email verified successfully!",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "token": "jwt_token_here"
  }
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass@123"
}

Response:
{
  "success": true,
  "message": "Login successful!",
  "token": "jwt_token_here",
  "username": "john_doe",
  "email": "john@example.com",
  "profilePic": "/path/to/pic.jpg"
}
```

### Meeting Endpoints

#### Generate Meeting ID
```http
GET /meeting/generate-id

Response:
{
  "success": true,
  "meetingId": "ABC123EF"
}
```

#### Start Meeting
```http
POST /meeting/start
Content-Type: application/json

{
  "meetingId": "ABC123EF",
  "admin": "john_doe",
  "title": "Team Standup"
}

Response:
{
  "success": true,
  "message": "Meeting started",
  "meeting": { ... }
}
```

#### End Meeting
```http
POST /meeting/end
Content-Type: application/json

{
  "meetingId": "ABC123EF",
  "admin": "john_doe"
}

Response:
{
  "success": true,
  "message": "Meeting ended"
}
```

#### Get Meeting History
```http
GET /meetings/list?admin=john_doe

Response:
{
  "success": true,
  "count": 5,
  "meetings": [ ... ]
}
```

#### Save Recording
```http
POST /meeting/recording
Content-Type: multipart/form-data

Form Data:
- recording: [file]
- meetingId: ABC123EF
- admin: john_doe
- chat: [JSON stringified]

Response:
{
  "success": true,
  "message": "Recording saved",
  "recordingUrl": "/uploads/recordings/..."
}
```

### Real-time Events (Socket.io)

#### Join Room
```javascript
socket.emit('join-room', {
  meetingId: 'ABC123EF',
  username: 'john_doe',
  videoEnabled: true,
  audioEnabled: true
});
```

#### Send Chat Message
```javascript
socket.emit('client-msg', {
  message: 'Hello everyone!',
  username: 'john_doe',
  meetingId: 'ABC123EF'
});

// Receive message
socket.on('server-msg', ({ username, message }) => {
  console.log(`${username}: ${message}`);
});
```

---

## 🎮 Features in Detail

### 1. Video Conferencing
- HD video and audio quality
- Up to 50+ participants (depending on bandwidth)
- Automatic bitrate adjustment
- Network quality indicators

### 2. Chat
- Real-time messaging
- Typing indicators
- Message history
- Emoji support

### 3. Recording
- Automatic or manual recording
- Multiple codec support
- Cloud storage integration
- Playback with controls

### 4. Transcription
- Live speech-to-text
- Multi-language support
- Automatic subtitle generation
- Download transcript

### 5. AI Summaries
- Automatic meeting summaries
- Action items extraction
- Key points highlighting
- Integration with Gemini AI

### 6. User Management
- Profile customization
- Avatar upload
- Password management
- Account settings

---

## 🌐 Deployment

### Deploy to Render.com (Recommended for beginners)

#### Backend
1. Push code to GitHub
2. Go to https://render.com
3. Click "New Web Service"
4. Connect GitHub repository
5. Set environment variables
6. Deploy

#### Frontend
1. Push code to GitHub
2. Go to https://vercel.com
3. Import project
4. Set VITE_API_URL to Render backend URL
5. Deploy

### Deploy to AWS/GCP

See `DEPLOYMENT_GUIDE.md` for detailed instructions

### Docker Deployment

```bash
# Build images
docker build -t video-conf-backend ./backend
docker build -t video-conf-frontend ./frontend

# Run containers
docker run -p 9000:9000 -e MONGO_URL=... video-conf-backend
docker run -p 3000:3000 video-conf-frontend
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `querySrv ECONNREFUSED`

**Solutions**:
1. Check IP whitelist in MongoDB Atlas
2. Verify MONGO_URL in `.env`
3. Ensure internet connection
4. Try connecting with MongoDB Compass first

### Camera/Microphone Not Working

**Error**: `NotAllowedError: Permission denied`

**Solutions**:
1. Allow permissions when browser asks
2. Check browser settings for blocked permissions
3. Try incognito/private mode
4. Restart browser

### Socket.io Connection Failed

**Error**: `WebSocket connection failed`

**Solutions**:
1. Ensure backend is running (`npm run dev`)
2. Check backend is on http://localhost:9000
3. Verify CORS configuration
4. Check firewall settings

### npm Install Fails

**Error**: `ERR! code E404`

**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Delete package-lock.json
4. Run `npm install` again

### Frontend Won't Load

**Error**: `VITE error`

**Solutions**:
1. Check Vite server is running
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+R)
4. Check console for errors (F12)

---

## 📱 Project Structure

```
Major-project/
├── backend/
│   ├── src/
│   │   ├── configs/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database schemas
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middlewares
│   │   ├── utils/          # Helper functions
│   │   └── app.js          # Express app
│   ├── package.json
│   └── .env                # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # React components
│   │   ├── utils/          # Utility functions
│   │   ├── assets/         # Images, fonts
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env                # Environment variables
│
└── PROJECT_PLAN.md         # This file
```

---

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique),
  username: String,
  password: String (hashed),
  profilePic: String,
  token: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Meeting Model
```javascript
{
  _id: ObjectId,
  meetingId: String (unique),
  admin: String,
  username: String,
  title: String,
  startedAt: Date,
  endedAt: Date,
  status: String,
  recordingUrl: String,
  chatMessages: [{sender, text, timestamp}],
  summary: String,
  transcript: String
}
```

---

## 🤝 Contributing

To add new features:

1. Create a new branch: `git checkout -b feature/amazing-feature`
2. Make changes and commit: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For issues or questions:
1. Check Troubleshooting section above
2. Check browser console (F12) for errors
3. Check backend terminal for server logs
4. Review socket.io connections (look for "User is connected")

---

**Last Updated**: March 27, 2026
**Version**: 1.0.0
**Status**: Production Ready
