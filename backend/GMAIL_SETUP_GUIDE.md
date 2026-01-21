# Quick Gmail Setup Guide - Fix Authentication Error

If you're seeing the error: `535-5.7.8 Username and Password not accepted`, follow these steps:

## Step-by-Step Instructions

### 1. Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable it (you'll need your phone)

### 2. Generate App Password
1. Still in Google Account Security settings
2. Click **2-Step Verification** (if not already there)
3. Scroll down and click **App passwords**
4. You may need to sign in again
5. Under "Select app", choose **Mail**
6. Under "Select device", choose **Other (Custom name)**
7. Type "Clear Connect" or any name you want
8. Click **Generate**
9. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### 3. Configure .env File
Create or update `backend/.env` file:

```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important Notes:**
- Use your **full Gmail address** (e.g., `john.doe@gmail.com`)
- Use the **16-character App Password** (remove spaces if any)
- **DO NOT** use your regular Gmail password
- **DO NOT** include quotes around the values

### 4. Restart Your Server
After updating `.env`, restart your Node.js server:
```bash
npm run dev
```

## Troubleshooting

### Still getting authentication error?
1. **Double-check the App Password**: Make sure you copied all 16 characters correctly
2. **Check for spaces**: Remove any spaces from the password
3. **Verify 2FA is enabled**: App passwords only work if 2FA is enabled
4. **Wait a few minutes**: Sometimes Google takes a minute to activate the app password
5. **Try generating a new App Password**: Delete the old one and create a new one

### Alternative: Use a Different Email Service
If Gmail continues to cause issues, you can use:
- **Outlook/Hotmail**: Similar setup, uses App Password
- **SendGrid**: Free tier available, better for production
- **Mailtrap**: Great for testing (doesn't send real emails)

## Example .env File
```env
# MongoDB
MONGO_URL=mongodb://localhost:27017/clear-connect

# Email (Gmail with App Password)
EMAIL_USER=myemail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop

# Optional: JWT Secret
JWT_SECRET=your-secret-key-here
```

## Testing
Once configured, try registering a new user. You should receive an email with a 6-digit OTP code.

If you still see errors, check the server console logs for more detailed error messages.
