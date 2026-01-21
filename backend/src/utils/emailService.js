const nodemailer = require("nodemailer");

// Create transporter
// For production, use environment variables for email credentials
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Validate environment variables
  if (!emailUser || !emailPassword) {
    throw new Error(
      "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your .env file.\n" +
      "For Gmail:\n" +
      "1. Enable 2-Factor Authentication on your Google Account\n" +
      "2. Go to: Google Account → Security → 2-Step Verification → App passwords\n" +
      "3. Generate an app password for 'Mail'\n" +
      "4. Use your Gmail address as EMAIL_USER and the app password as EMAIL_PASSWORD"
    );
  }

  // Check if using default values (which won't work)
  if (emailUser === "your-email@gmail.com" || emailPassword === "your-app-password") {
    throw new Error(
      "Please configure your email credentials in the .env file.\n" +
      "Set EMAIL_USER and EMAIL_PASSWORD with your actual Gmail credentials."
    );
  }

  // Using Gmail - requires App Password (not regular password)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - Pop Meet",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ff9a9e, #fecfef, #a8edea); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #4a148c; margin: 0;">Clear Connect</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #4a148c;">Email Verification</h2>
            <p style="color: #333; font-size: 16px;">Hello ${username},</p>
            <p style="color: #333; font-size: 16px;">Thank you for registering with Clear Connect!</p>
            <p style="color: #333; font-size: 16px;">Please use the following OTP to verify your email address:</p>
            <div style="background: linear-gradient(135deg, #ff9a9e, #fecfef); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: #4a148c; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't create an account with Clear Connect, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Clear Connect. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    
    if (error.code === "EAUTH") {
      errorMessage = 
        "Email authentication failed. Please check:\n" +
        "1. EMAIL_USER and EMAIL_PASSWORD are set correctly in .env\n" +
        "2. For Gmail, you MUST use an App Password (not your regular password)\n" +
        "3. Enable 2-Factor Authentication and generate an App Password\n" +
        "4. Make sure you're using the App Password, not your account password";
    } else if (error.message.includes("not configured")) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

module.exports = {
  sendOTPEmail,
};
