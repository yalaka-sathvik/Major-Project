# 🚀 Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Prerequisites
- Node.js v16+ 
- npm v7+

### Step 1: Install Dependencies (2 min)

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### Step 2: Setup Environment

**Create `backend/.env`:**
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
TOKEN_KEY=your_secret_key_at_least_32_chars_long
GOOGLE_CLIENT_KEY=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BACKEND_URL=http://localhost:9000
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
GEMINI_API_KEY=your_gemini_api_key
```

**Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:9000
```

### Step 3: Run the Application (2 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:9000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:5173

### Step 4: Open in Browser

Visit: **http://localhost:5173**

---

## 🎬 Quick Feature Demo

### 1. Register User
1. Click "Sign Up"
2. Enter email, username, password
3. Verify OTP from email
4. Login

### 2. Start a Meeting
1. Click "New Meeting" or "Generate ID" 
2. Share meeting ID with others
3. Click "Join Meeting"
4. Enable camera/microphone
5. Start video call

### 3. Use Features During Call
- 📹 **Video/Audio**: Toggle buttons on screen
- 💬 **Chat**: Type messages in sidebar
- 📹 **Record**: Click record button (auto-saves)
- 🎥 **Screen Share**: Share screen button
- ⏹️ **End**: Exit meeting when done

### 4. View Recordings
1. Go to Profile → Recordings
2. Click on recording to play
3. View transcript/summary
4. Download if needed

---

## 🧪 Test the API

### Using cURL

**Get Meeting ID:**
```bash
curl http://localhost:9000/meeting/generate-id
```

**Start Meeting (with token):**
```bash
curl -X POST http://localhost:9000/meeting/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "ABC123EF",
    "admin": "username",
    "title": "Test Meeting"
  }'
```

More examples in: **API_TESTING_GUIDE.md**

---

## 🐛 Common Issues

### Issue: "Cannot find module uuid"
**Fix:**
```bash
cd backend
npm install uuid
```

### Issue: MongoDB connection timeout
**Solution**: Application has fallback to in-memory storage. It will still work.

**To fix:**
1. Go to MongoDB Atlas
2. Add your IP to Network Access
3. Update MONGO_URL in `.env`

### Issue: Camera/Microphone not working
**Fix:**
1. Allow browser permissions when asked
2. Try another browser (Chrome recommended)
3. Check browser settings for camera permissions

### Issue: "Page not loading"
**Fix:**
1. Hard refresh: `Ctrl+Shift+R`
2. Clear cache: `Ctrl+Shift+Delete`
3. Check console (F12) for errors

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **COMPLETE_SETUP_GUIDE.md** | Detailed setup, config, API docs, deployment |
| **API_TESTING_GUIDE.md** | API endpoints with examples |
| **PROJECT_PLAN.md** | Features, roadmap, tech stack |
| **BUILD_COMPLETION_SUMMARY.md** | What was built, statistics |
| **README.md** | Project overview |

---

## 🔑 Default Test Account

Create your own account during registration, or use:
- Email: test@example.com
- Password: TestPass@123

---

## 📊 Architecture Overview

```
Frontend (React)
    ↓ (HTTP/WebSocket)
Backend (Node.js/Express)
    ↓ (Mongoose)
Database (MongoDB)
    ↓ (File Storage)
Uploads (Recordings, Avatars)
```

---

## 🎮 Key Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Login page |
| `/register` | Registration page |
| `/profile` | User profile & settings |
| `/meeting/:id` | Video call page |
| `/recordings` | Recording library |
| `/scheduler` | Meeting scheduler |

---

## 💾 Database Collections

| Collection | Purpose |
|-----------|---------|
| `users` | User accounts & auth |
| `meetings` | Meeting records |
| `participants` | Meeting participants |
| `notifications` | User notifications |

---

## 🔐 Authentication Flow

```
1. User Registration
   ↓
2. OTP Verification
   ↓
3. JWT Token Generation
   ↓
4. Store Token in LocalStorage
   ↓
5. Send in Authorization Header for all requests
```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Push to GitHub
# Connect to Vercel, auto-deploy
```

### Backend (Render)
```bash
# Push to GitHub
# Connect to Render, select backend folder
# Add environment variables
# Deploy
```

See: **COMPLETE_SETUP_GUIDE.md** → Deployment section

---

## 📞 Support

1. **Setup Issues?** → COMPLETE_SETUP_GUIDE.md
2. **API Questions?** → API_TESTING_GUIDE.md  
3. **Feature Info?** → PROJECT_PLAN.md
4. **Code Questions?** → Check code comments
5. **Runtime Errors?** → Check console (F12) or terminal

---

## ✅ Verification Checklist

- [ ] Backend running on 9000
- [ ] Frontend running on 5173
- [ ] Can see login page
- [ ] Can register user
- [ ] Can verify email OTP
- [ ] Can login
- [ ] Can see profile
- [ ] Can generate meeting ID
- [ ] Can join meeting
- [ ] Can see camera/mic
- [ ] Can chat
- [ ] Can end meeting

**If all checked** ✅ → Application is working!

---

## 🆘 Emergency Fixes

### Restart Everything
```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

cd backend
npm run dev

cd frontend  
npm run dev
```

### Clear All Cache
```bash
# Browser cache
Ctrl+Shift+Delete

# npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Reset Database (be careful!)
```bash
# In MongoDB Atlas console:
# Delete entire database
# App will create new collections on first use
```

---

## 🎯 Next Steps

1. ✅ Run the application (follow steps above)
2. 📝 Create test account
3. 🎬 Generate meeting ID and share
4. 📹 Record a test meeting
5. 📊 Check recordings library
6. 🚀 Deploy to production

---

## ⏱️ Typical Usage Workflow

```
1. Register (2 min)
2. Login (1 min)
3. Generate meeting ID (10 sec)
4. Share ID with others
5. Click "Join Meeting"
6. Enable camera & mic
7. Chat and video call
8. Record (optional)
9. End meeting
10. View after in Recordings
```

---

## 💡 Pro Tips

- 💾 **Save Meeting IDs** for recurring meetings
- 🔗 **Share Link** directly to join without copy-paste  
- 📹 **Always Record** important meetings
- 🔐 **Use Strong Passwords** with special characters
- 🌙 **Toggle Dark Mode** in profile settings
- 📱 **Test on Phone** before important meetings
- 🎧 **Test Audio** before starting

---

## 📈 Performance Tips

1. Close other browser tabs to improve video quality
2. Use wired internet (not WiFi) for stability
3. Close background applications
4. Use Google Chrome for best compatibility
5. Keep browser updated
6. Close other video apps

---

## 🎓 Learning Resources

- **WebRTC**: https://webrtc.org/
- **Socket.io**: https://socket.io/docs/
- **MongoDB**: https://docs.mongodb.com/
- **React**: https://react.dev/
- **Node.js**: https://nodejs.org/docs/

---

**Last Updated**: March 27, 2026  
**Version**: 1.0.0  
**Status**: Production Ready

**Ready to start?** Follow the 5 steps above! 🚀
