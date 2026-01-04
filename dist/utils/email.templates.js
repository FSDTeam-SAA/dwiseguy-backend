"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgetPasswordOtpTemplate = void 0;
const forgetPasswordOtpTemplate = (name, otp, title = 'Reset Your Piano Academy Password') => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h1 {
      font-size: 22px;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      margin: 10px 0;
    }
    .otp {
      display: block;
      width: fit-content;
      margin: 20px auto;
      font-size: 28px;
      font-weight: bold;
      color: #d35400;
      letter-spacing: 4px;
      padding: 10px 20px;
      border: 2px dashed #d35400;
      border-radius: 8px;
      text-align: center;
    }
    .footer {
      font-size: 14px;
      color: #777;
      margin-top: 30px;
      text-align: center;
    }
    .note {
      font-size: 14px;
      color: #555;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello ${name},</h1>
    <p>We received a request to reset your Piano Academy account password.</p>
    <p>Please use the following OTP to reset your password:</p>
    <div class="otp">${otp}</div>
    <p class="note">This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Piano Academy. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
};
exports.forgetPasswordOtpTemplate = forgetPasswordOtpTemplate;
