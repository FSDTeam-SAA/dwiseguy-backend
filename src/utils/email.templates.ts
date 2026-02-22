import config from "../config/config";

export const forgetPasswordOtpTemplate = (
  name: string,
  otp: string | number,
  title: string = "Reset Your Password",
): string => {
  const expiryMinutes = 5;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>

<body style="margin:0;padding:0;background-color:#f2f4f6;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f6;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.06);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:24px;text-align:center;">
              <h2 style="color:#ffffff;margin:0;font-weight:600;letter-spacing:1px;">
                🎵 Bao Music Academy
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;color:#333333;">

              <h3 style="margin-top:0;font-size:20px;">Hello ${name},</h3>

              <p style="font-size:16px;line-height:1.6;color:#555;">
                We received a request to reset your account password. 
                Please use the One-Time Password (OTP) below to continue.
              </p>

              <!-- OTP Box -->
              <div style="margin:32px 0;text-align:center;">
                <span style="
                  display:inline-block;
                  font-size:32px;
                  letter-spacing:6px;
                  font-weight:bold;
                  padding:14px 28px;
                  border-radius:10px;
                  background:#f9fafb;
                  border:2px solid #111827;
                  color:#111827;
                ">
                  ${otp}
                </span>
              </div>

              <p style="font-size:15px;color:#666;">
                This OTP is valid for <strong>${expiryMinutes} minutes</strong>. 
                For your security, do not share this code with anyone.
              </p>

              <p style="font-size:15px;color:#666;margin-top:24px;">
                If you did not request a password reset, 
                please ignore this email or contact our support team.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;font-size:13px;color:#888;border-top:1px solid #eee;">
              © ${new Date().getFullYear()} Piano Academy. All rights reserved.
              <br/>
              Need help? Contact support@baomusic.com
            </td>
          </tr>

        </table>

        <!-- Bottom spacing -->
        <div style="height:40px;"></div>

      </td>
    </tr>
  </table>

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
  appName = 'Bao Music Academy',
  loginUrl = config.frontendLoginUrl,
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

export const adminNotificationTemplate = (
  title: string,
  data: Record<string, any>
): string => {
  // Generate table rows dynamically from the data object
  const tableRows = Object.entries(data)
    .map(
      ([key, value]) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">${key}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${value}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Admin Alert: ${title}</h2>
        </div>
        <div style="padding: 20px;">
            <p>A new event has occurred in the system that requires your attention:</p>
            <table style="width: 100%; border-collapse: collapse;">
                ${tableRows}
            </table>
            <p style="margin-top: 20px; font-size: 13px; color: #888;">
                This is an automated notification from the Piano Academy Engine.
            </p>
        </div>
    </div>
</body>
</html>`;
};