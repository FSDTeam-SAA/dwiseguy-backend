export const forgetPasswordOtpTemplate = (
      name: string,
      otp: string | number,
      title: string = 'Reset Your Piano Academy Password'
): string => {
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

type AccountCreatedEmailArgs = {
      email: string;
      password: string;
      username: string;
      appName?: string;
      loginUrl?: string;
};

export const accountCreatedEmailTemplate = ({
      email,
      password,
      username,
      appName = 'Piano Academy',
      loginUrl = 'https://piano-academy.com/login',
}: AccountCreatedEmailArgs): string => {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Created</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header {
      background: #0f172a;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      padding: 24px;
      color: #334155;
      line-height: 1.6;
      font-size: 15px;
    }
    .credentials {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 16px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .credentials p {
      margin: 6px 0;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 22px;
      border-radius: 6px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 16px;
      font-size: 12px;
      color: #64748b;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${appName}
    </div>

    <div class="content">
      <p>Hello <strong>${username}</strong>,</p>

      <p>Your account has been successfully created.</p>

      <div class="credentials">
        <p>Username: ${username}</p>
        <p>Email: ${email}</p>
        <p>Temporary Password: ${password}</p>
      </div>

      <p>
        For security reasons, this password is temporary.  
        Please log in and <strong>update your profile</strong> and 
        <strong>change your password immediately</strong>.
      </p>

      <a href="${loginUrl}" class="button">Log In to Your Account</a>

      <p style="margin-top: 24px;">
        If you did not request this account, please contact our support team immediately.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
};
