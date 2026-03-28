# 🚀 Clear Connect - Setup & Configuration Guide

## ✅ Issues Fixed

### Backend Startup Error
- **Problem**: `TypeError: OAuth2Strategy requires a clientID option`
- **Solution**: Updated Passport.js to gracefully handle missing Google OAuth credentials
- **Result**: Server now starts even without OAuth configured (with a warning)

### Missing Dependencies
- **Problem**: `Cannot find module 'nodemailer'`
- **Solution**: Installed nodemailer via `npm install nodemailer`
- **Result**: Email/OTP functionality now works

### Security
- **Problem**: 8 npm vulnerabilities
- **Solution**: Ran `npm audit fix`
- **Result**: 0 vulnerabilities remaining

---

## 📋 Configuration Required

### 1. **Backend Environment Variables** (`.env`)

Located at: `backend/.env`

**Required for development (with defaults provided):**
```
MONGO_URL=mongodb://localhost:27017/clear-connect
TOKEN_KEY=your-secret-token-key-change-this-in-production
BACKEND_URL=http://localhost:9000
FRONTEND_URL=http://localhost:5173
```

**Optional but recommended for email:***
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Optional for Google OAuth (enables social login):**
```
GOOGLE_CLIENT_KEY=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Optional for AI summaries:**
```
GEMINI_API_KEY=your-gemini-api-key
```

### 2. **Frontend Environment Variables** (`.env`)

Located at: `frontend/.env`

```
VITE_API_URL = http://localhost:9000
```

---

## 🔧 Setup Steps

### Step 1: Install MongoDB
Make sure MongoDB is running locally:
```bash
# Windows (using MongoDB Community Edition)
# Download from https://www.mongodb.com/try/download/community

# Or use MongoDB Atlas (cloud): Create a cluster and use MongoDB URI
```

### Step 2: Update Backend .env

Edit `backend/.env` with your actual values:

**Email Setup (Gmail):**
1. Enable 2-Factor Authentication on your Google Account
2. Go to: Google Account → Security → App passwords
3. Generate an app password for 'Mail'
4. Use your Gmail as EMAIL_USER and app password as EMAIL_PASSWORD

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Redirect URI: `http://localhost:9000/auth/google/callback`)
5. Copy Client ID and Client Secret to `.env`

**Gemini API (optional, for AI summaries):**
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create API key
3. Add to `GEMINI_API_KEY` in `.env`

### Step 3: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should see: "server is running on port 9000"
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

---

## 🧪 Testing

### Test Backend Endpoints

**Health Check:**
```bash
curl http://localhost:9000/test
# Expected: {"message":"done!"}
```

**Register User (with OTP):**
```bash
POST http://localhost:9000/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

### Test Frontend
- Open http://localhost:5173
- Try Register → You should receive OTP email (if configured)
- Try Login after registration verification

---

## 📱 Features Available

✅ **User Authentication**
- Email registration with OTP verification
- Login with email/password
- Google OAuth login (if configured)
- Profile management

✅ **Video Conferencing**
- Real-time video/audio calls
- Screen sharing capability
- Chat during meetings
- Meeting recordings

✅ **Meeting Features**
- Create instant meetings
- Join meetings by ID
- Past meeting history
- Live transcription & AI summaries

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 9000 (Windows)
netstat -ano | findstr :9000
taskkill /PID [PID] /F
```

### MongoDB Not Running
```bash
# Make sure MongoDB service is running
# Or use MongoDB Atlas URI in MONGO_URL
```

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- Verify 2FA is enabled on Google Account
- Use app-specific password, not regular password

### Google OAuth Not Working
- Verify credentials in backend .env
- Check redirect URI matches Google Console config

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /register` - Register with email
- `POST /verify-otp` - Verify email with OTP
- `POST /resend-otp` - Resend verification OTP
- `POST /login` - Login with credentials
- `GET /auth/google` - Google OAuth redirect
- `GET /auth/google/callback` - Google OAuth callback

### Meeting Endpoints
- `POST /check-meeting` - Check if meeting exists
- `POST /past-meeting` - Create meeting record
- `GET /history` - Get user's past meetings
- `POST /meeting/recording` - Save recording
- `POST /meeting/summary` - Generate AI summary
- `POST /meeting/save-transcript` - Save transcript

---

## 🎯 Next Steps

1. ✅ Syntax verification passed
2. 🔄 Configure `.env` files with your credentials
3. 🗄️ Start MongoDB
4. ▶️ Run `npm run dev` in backend
5. ▶️ Run `npm run dev` in frontend
6. 🌐 Open http://localhost:5173
7. 📝 Test registration → Login → Create meeting

**All services are now ready to run!**
