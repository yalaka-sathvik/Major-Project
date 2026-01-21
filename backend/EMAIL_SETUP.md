# Email Configuration Setup

To enable OTP email verification, you need to configure email credentials in your `.env` file.

## Environment Variables

Add the following variables to your `backend/.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to your Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASSWORD`

## Alternative Email Services

You can modify `backend/src/utils/emailService.js` to use other email services:

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### Custom SMTP
```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.yourdomain.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Testing

For testing purposes, you can use services like:
- **Mailtrap** (for development)
- **SendGrid** (for production)
- **AWS SES** (for production)

## Notes

- OTP expires in 10 minutes
- Maximum 5 verification attempts per OTP
- OTP is stored in memory (consider Redis for production scalability)
