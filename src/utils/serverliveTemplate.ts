import { Request, Response } from 'express';

export const serverTemplate = (_req: Request, res: Response): void => {
      res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dwiseguy Backend – Server Live</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: linear-gradient(135deg, #1e293b, #0f172a);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
      }

      .container {
        background: rgba(255, 255, 255, 0.08);
        padding: 40px;
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        max-width: 520px;
        animation: fadeIn 0.8s ease-in-out;
      }

      h1 {
        color: #22c55e;
        margin-bottom: 12px;
      }

      .status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .dot {
        width: 10px;
        height: 10px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }

      .url {
        margin-top: 16px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        font-family: monospace;
        font-size: 0.95rem;
        word-break: break-all;
      }

      .footer {
        margin-top: 22px;
        font-size: 0.85rem;
        opacity: 0.7;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.4);
          opacity: 0.6;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="status">
        <div class="dot"></div>
        <strong>Server Online</strong>
      </div>

      <h1>✅ Server is Live</h1>
      <p>Dwiseguy Backend API is running successfully.</p>

      <p>Base API URL:</p>
      <div class="url">
        https://dwiseguy-backend.onrender.com
      </div>

      <div class="footer">
        © 2026 Dwiseguy Backend · All systems operational
      </div>
    </div>
  </body>
</html>
`);
};
