# API Testing Guide

## 📌 Quick Start

This guide helps you test all 14 new API endpoints for the video conferencing application.

## 🛠️ Tools Required

- **Postman** (recommended): https://www.postman.com/downloads/
- **cURL** (command line)
- **VS Code REST Client** extension

## 🔑 Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Get your token by logging in first:
```bash
POST http://localhost:9000/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass@123"
}
```

---

## 📧 User Management APIs

### 1. Get Profile
Fetch current user profile information.

**Request:**
```http
GET http://localhost:9000/profile/:userId
Authorization: Bearer <token>
```

**Sample cURL:**
```bash
curl -X GET "http://localhost:9000/profile/65f4a9c8d7e2f1b9c3d4e5f6" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "65f4a9c8d7e2f1b9c3d4e5f6",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "/uploads/avatars/user.jpg",
    "bio": "Software Developer",
    "createdAt": "2024-03-20T10:30:00Z"
  }
}
```

---

### 2. Update Profile
Update username, bio, and avatar image.

**Request:**
```http
PUT http://localhost:9000/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- username: john_doe_updated
- bio: Full Stack Developer
- avatar: <file>
```

**Sample cURL:**
```bash
curl -X PUT "http://localhost:9000/profile" \
  -H "Authorization: Bearer <token>" \
  -F "username=john_doe_updated" \
  -F "bio=Full Stack Developer" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "username": "john_doe_updated",
    "bio": "Full Stack Developer",
    "avatar": "/uploads/avatars/new_avatar.jpg"
  }
}
```

---

### 3. Change Password
Update user password with validation.

**Request:**
```http
PUT http://localhost:9000/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "TestPass@123",
  "newPassword": "NewPass@456"
}
```

**Sample cURL:**
```bash
curl -X PUT "http://localhost:9000/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass@123",
    "newPassword": "NewPass@456"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### 4. Get All Users (Admin)
List all users in the system.

**Request:**
```http
GET http://localhost:9000/users/all
Authorization: Bearer <token>
```

**Sample cURL:**
```bash
curl -X GET "http://localhost:9000/users/all" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "_id": "65f4a9c8d7e2f1b9c3d4e5f6",
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2024-03-20T10:30:00Z"
    },
    ...
  ]
}
```

---

### 5. Delete Account
Permanently delete user account and all associated data.

**Request:**
```http
DELETE http://localhost:9000/account
Authorization: Bearer <token>
```

**Sample cURL:**
```bash
curl -X DELETE "http://localhost:9000/account" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## 🎥 Meeting Management APIs

### 6. Generate Meeting ID
Generate a unique 8-character meeting ID.

**Request:**
```http
GET http://localhost:9000/meeting/generate-id
```

**Sample cURL:**
```bash
curl -X GET "http://localhost:9000/meeting/generate-id"
```

**Expected Response (200):**
```json
{
  "success": true,
  "meetingId": "ABC123EF"
}
```

---

### 7. Start Meeting
Create and start a new meeting.

**Request:**
```http
POST http://localhost:9000/meeting/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingId": "ABC123EF",
  "admin": "john_doe",
  "title": "Team Standup"
}
```

**Sample cURL:**
```bash
curl -X POST "http://localhost:9000/meeting/start" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "ABC123EF",
    "admin": "john_doe",
    "title": "Team Standup"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Meeting started successfully",
  "meeting": {
    "_id": "65f5b1d9e8f3a2c4d5e6f7g8",
    "meetingId": "ABC123EF",
    "admin": "john_doe",
    "title": "Team Standup",
    "startedAt": "2024-03-20T14:30:00Z",
    "status": "active"
  }
}
```

---

### 8. End Meeting
Mark a meeting as ended and calculate duration.

**Request:**
```http
POST http://localhost:9000/meeting/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingId": "ABC123EF",
  "admin": "john_doe"
}
```

**Sample cURL:**
```bash
curl -X POST "http://localhost:9000/meeting/end" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "ABC123EF",
    "admin": "john_doe"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Meeting ended successfully",
  "duration": "00:45:30"
}
```

---

### 9. Get Meeting Details
Fetch complete meeting information including chat history.

**Request:**
```http
GET http://localhost:9000/meeting/ABC123EF
Authorization: Bearer <token>
```

**Sample cURL:**
```bash
curl -X GET "http://localhost:9000/meeting/ABC123EF" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "meeting": {
    "_id": "65f5b1d9e8f3a2c4d5e6f7g8",
    "meetingId": "ABC123EF",
    "admin": "john_doe",
    "title": "Team Standup",
    "startedAt": "2024-03-20T14:30:00Z",
    "endedAt": "2024-03-20T15:15:00Z",
    "duration": "00:45:00",
    "recordingUrl": "/uploads/recordings/ABC123EF.webm",
    "chatMessages": [
      {
        "_id": "65f5b2d9e8f3a2c4d5e6f7g9",
        "sender": "john_doe",
        "text": "Welcome to the meeting!",
        "timestamp": "2024-03-20T14:30:15Z"
      }
    ]
  }
}
```

---

### 10. List Meetings
Get paginated list of user's meetings.

**Request:**
```http
GET http://localhost:9000/meetings/list?admin=john_doe&page=1&limit=10
Authorization: Bearer <token>
```

**Sample cURL:**
```bash
curl -X GET "http://localhost:9000/meetings/list?admin=john_doe" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "meetings": [
    {
      "meetingId": "ABC123EF",
      "title": "Team Standup",
      "admin": "john_doe",
      "startedAt": "2024-03-20T14:30:00Z",
      "duration": "00:45:00"
    },
    ...
  ]
}
```

**Query Parameters:**
- `admin` (required): Username of meeting admin
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

---

### 11. Add Chat Message
Store a chat message in a meeting.

**Request:**
```http
POST http://localhost:9000/meeting/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingId": "ABC123EF",
  "sender": "john_doe",
  "text": "This is a test message"
}
```

**Sample cURL:**
```bash
curl -X POST "http://localhost:9000/meeting/chat" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "ABC123EF",
    "sender": "john_doe",
    "text": "This is a test message"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Chat message saved",
  "chatMessage": {
    "_id": "65f5b2d9e8f3a2c4d5e6f7g9",
    "sender": "john_doe",
    "text": "This is a test message",
    "timestamp": "2024-03-20T14:35:00Z"
  }
}
```

---

### 12. Get Meeting Statistics
Retrieve meeting analytics including duration, message count, and recording status.

**Request:**
```http
GET http://localhost:9000/meeting/ABC123EF/stats
Authorization: Bearer <token>
```

**Sample cURL:**
```bash
curl -X GET "http://localhost:9000/meeting/ABC123EF/stats" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "stats": {
    "meetingId": "ABC123EF",
    "duration": "00:45:30",
    "messageCount": 12,
    "participantCount": 5,
    "recordingStatus": "completed",
    "recordingUrl": "/uploads/recordings/ABC123EF.webm",
    "recordingSize": "125MB",
    "summary": "Team discussed Q2 roadmap priorities...",
    "transcript": "John: Welcome everyone. Today we're..."
  }
}
```

---

## 📝 Testing Checklist

### User Management
- [ ] GET `/profile/:userId` - Retrieve profile
- [ ] PUT `/profile` - Update profile with avatar
- [ ] PUT `/change-password` - Change password
- [ ] GET `/users/all` - List all users
- [ ] DELETE `/account` - Delete account

### Meeting Management
- [ ] GET `/meeting/generate-id` - Generate meeting ID
- [ ] POST `/meeting/start` - Start meeting
- [ ] POST `/meeting/end` - End meeting
- [ ] GET `/meeting/:meetingId` - Get meeting details
- [ ] GET `/meetings/list` - List user meetings
- [ ] POST `/meeting/chat` - Add chat message
- [ ] GET `/meeting/:meetingId/stats` - Get stats

---

## 💡 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: Ensure JWT token is:
- Valid (not expired)
- Properly formatted: `Bearer <token>`
- Included in Authorization header

### Issue: 400 Bad Request
**Solution**: Check that:
- Required fields are present
- Content-Type header matches payload
- Values are in correct format

### Issue: CORS Error
**Solution**: Backend CORS is configured for `http://localhost:5173`
- Ensure frontend is running on correct port
- Check browser console for exact error

### Issue: File Upload Failed (avatar)
**Solution**:
- File must be less than 5MB
- File type must be image/* 
- Ensure Content-Type is multipart/form-data

---

## 📊 Postman Collection Template

Import this into Postman as a collection:

```json
{
  "info": {
    "name": "Video Conference API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "User Management",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/profile/:userId",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Update Profile",
          "request": {
            "method": "PUT",
            "url": "{{baseUrl}}/profile",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Meeting Management",
      "item": [
        {
          "name": "Generate Meeting ID",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/meeting/generate-id"
          }
        },
        {
          "name": "Start Meeting",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/meeting/start",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## 🚀 Performance Testing

Test API response times:

```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 http://localhost:9000/meeting/generate-id

# Results show:
# Requests per second
# Time per request (mean)
# Failed requests
```

---

## 📞 Support

For API issues:
1. Check backend logs: `npm run dev` terminal
2. Verify environment variables in `.env`
3. Check MongoDB connection status
4. Use browser DevTools (F12) - Network tab to inspect requests

---

**Last Updated**: March 27, 2026
**API Version**: 1.0.0
**Status**: Production Ready
