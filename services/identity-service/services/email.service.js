// services/email.service.js
import { sendMail } from "../config/mail.js";

/**
 * Sends an email with a link to verify the user's email.
 * The email includes an inline HTML template with styling.
 * @function sendVerificationEmail
 * @param {Object} user - The user object (must have user.email, user.firstName, user.id).
 * @param {string} verificationToken - Unique token for email verification.
 * @throws Will throw an error if email sending fails.
 */
export async function sendVerificationEmail(user, verificationToken) {
  const verifyLink = `${process.env.BASE_URL}/api/auth/verify-email/${verificationToken}`;

  const subject = "Welcome to WorkNest - Verify Your Email";
  const text = `Hello ${user.firstName},\n\nTo verify your email address and activate your account, please click on the following link: ${verifyLink}\n\nIf you did not create this account, please ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify Your Email</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background-color: #4a90e2;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      width: 200px;
      height: 50px;
      margin: 0 auto;
    }
    .email-content {
      padding: 30px 40px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .action-button {
      display: inline-block;
      background-color: #4a90e2;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .note {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
    }
    .email-footer {
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" class="logo">
        <style>
          .text { font: bold 24px sans-serif; fill: #ffffff; }
          .nest { fill: none; stroke: #ffffff; stroke-width: 2; }
          .check { fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        </style>
        <!-- Nest icon -->
        <path class="nest" d="M10,25 Q25,5 40,25 T70,25" />
        <!-- Checkmark -->
        <path class="check" d="M30,25 L40,35 L55,20" />
        <!-- WorkNest text -->
        <text x="80" y="35" class="text">WorkNest</text>
      </svg>
    </div>
    
    <div class="email-content">
      <h1>Verify Your Email</h1>
      <p class="greeting">Hello ${user.firstName},</p>
      <p>Thank you for creating an account with WorkNest! To complete your registration and activate your account, please verify your email by clicking the button below:</p>
      <div class="button-container">
        <a href="${verifyLink}" class="action-button">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #4b5563;">${verifyLink}</p>
      <p class="note">If you did not request this account or believe this is an error, please ignore this message.</p>
      <p>Best regards,<br>The WorkNest Team</p>
    </div>
    
    <div class="email-footer">
      <p>This is an automated email, please do not reply.</p>
      <p class="help-text">Need help? <a href="#" style="color: #4a90e2;">Contact our support team</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail(user.email, subject, text, html);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

/**
 * Sends an email with a link to reset the user's password.
 * The email includes an inline HTML template with styling.
 * @function sendResetPasswordEmail
 * @param {Object} user - The user object (must have user.email, user.firstName, etc.).
 * @param {string} resetToken - The unique token for resetting the password.
 * @throws Will throw an error if email sending fails.
 */
export async function sendResetPasswordEmail(user, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const subject = "WorkNest - Reset Your Password";
  const text = `Hello ${user.firstName},\n\nWe received a request to reset your password. To proceed, please click on the following link: ${resetLink}\n\nIf you did not request a password reset, please ignore this email.`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background-color: #4a90e2;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      width: 200px;
      height: 50px;
      margin: 0 auto;
    }
    .email-content {
      padding: 30px 40px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .action-button {
      display: inline-block;
      background-color: #4a90e2;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .note {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
    }
    .email-footer {
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" class="logo">
        <style>
          .text { font: bold 24px sans-serif; fill: #ffffff; }
          .nest { fill: none; stroke: #ffffff; stroke-width: 2; }
          .check { fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        </style>
        <!-- Nest icon -->
        <path class="nest" d="M10,25 Q25,5 40,25 T70,25" />
        <!-- Checkmark -->
        <path class="check" d="M30,25 L40,35 L55,20" />
        <!-- WorkNest text -->
        <text x="80" y="35" class="text">WorkNest</text>
      </svg>
    </div>
    
    <div class="email-content">
      <h1>Reset Your Password</h1>
      <p class="greeting">Hello ${user.firstName},</p>
      <p>We received a request to reset your password. To proceed, please click the button below:</p>
      <div class="button-container">
        <a href="${resetLink}" class="action-button">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #4b5563;">${resetLink}</p>
      <p class="note">If you did not request a password reset, please ignore this email or contact support.</p>
      <p>Best regards,<br>The WorkNest Team</p>
    </div>
    
    <div class="email-footer">
      <p>This is an automated email, please do not reply.</p>
      <p class="help-text">Need help? <a href="#" style="color: #4a90e2;">Contact our support team</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail(user.email, subject, text, html);
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
}

/**
 * Sends an account creation email, prompting the user to set their password.
 * The email includes an inline HTML template with styling.
 * @function sendAccountCreationEmail
 * @param {Object} user - The user object (must have user.email, user.firstName, etc.).
 * @param {string} resetToken - The unique token for setting their initial password.
 * @returns {boolean} - Returns true if the email was sent successfully.
 * @throws Will throw an error if email sending fails.
 */
export async function sendAccountCreationEmail(user, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const subject = "Welcome to WorkNest - Set Your Password";
  const text = `Hello ${user.firstName},\n\nYour WorkNest account has been successfully created. To complete your registration and set your password, please click on the following link: ${resetLink}\n\nIf you didn't request this account creation, please ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to WorkNest - Set Your Password</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background-color: #4a90e2;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      width: 200px;
      height: 50px;
      margin: 0 auto;
    }
    .email-content {
      padding: 30px 40px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .reset-button {
      display: inline-block;
      background-color: #4a90e2;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .note {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
    }
    .email-footer {
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" class="logo">
        <style>
          .text { font: bold 24px sans-serif; fill: #ffffff; }
          .nest { fill: none; stroke: #ffffff; stroke-width: 2; }
          .check { fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        </style>
        <!-- Nest icon -->
        <path class="nest" d="M10,25 Q25,5 40,25 T70,25" />
        <!-- Checkmark -->
        <path class="check" d="M30,25 L40,35 L55,20" />
        <!-- WorkNest text -->
        <text x="80" y="35" class="text">WorkNest</text>
      </svg>
    </div>
    
    <div class="email-content">
      <h1>Welcome to WorkNest!</h1>
      
      <p class="greeting">Hello ${user.firstName},</p>
      
      <p>Great news! Your WorkNest account has been successfully created. To ensure the security of your account and complete your registration, please set your password by clicking the button below.</p>
      
      <div class="button-container">
        <a href="${resetLink}" class="reset-button">Set Your Password</a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #4b5563;">${resetLink}</p>
      
      <p>Here are a few things to keep in mind:</p>
      <ul>
        <li>Choose a strong, unique password that you haven't used elsewhere.</li>
        <li>Your password should be at least 8 characters long and include a mix of letters, numbers, and symbols.</li>
        <li>This link will expire in 24 hours for security reasons.</li>
      </ul>
      
      <p class="note">If you didn't request this account creation, please ignore this email or contact our support team immediately.</p>
      
      <p>We're excited to have you on board! Once you've set your password, you'll have full access to all the features WorkNest has to offer.</p>
      
      <p>Best regards,<br>The WorkNest Team</p>
    </div>
    
    <div class="email-footer">
      <p>This is an automated email, please do not reply.</p>
      <p class="help-text">Need help? <a href="#" style="color: #4a90e2;">Contact our support team</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail(user.email, subject, text, html);
    return true;
  } catch (error) {
    console.error("Error sending account creation email:", error);
    throw error;
  }
}
