import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

dotenv.config();

export default {
      // Server

      env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,

      // Database

      database: {
            user: process.env.MONGO_USER,
            password: process.env.MONGO_PASSWORD,
            uri: process.env.MONGO_URI,
      },

      // Access / Refresh Tokens

      tokens: {
            access: {
                  secret: process.env.ACCESS_TOKEN_SECRET,
                  expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES) || '7d',
            },
            refresh: {
                  secret: process.env.REFRESH_TOKEN_SECRET,
                  expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES) || '90d',
            },
            password: {
                  secret: process.env.PASSWORD_TOKEN_SECRET,
                  expiresIn: Number(process.env.PASSWORD_TOKEN_EXPIRES) || '10m',
            },
      },

      // Bcrypt
      bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

      // Cloudinary
      cloudinary: {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            apiSecret: process.env.CLOUDINARY_API_SECRET,
      },

      //brevo email config
      brevo: {
            host: process.env.BREVO_SMTP_HOST!,
            port: Number(process.env.BREVO_SMTP_PORT!),
            auth: {
                  user: process.env.BREVO_SMTP_USER!,
                  pass: process.env.BREVO_SMTP_PASS!,
                  apiKey: process.env.BREVO_SMTP_API_KEY!,
            },
            senderEmail: process.env.BREVO_SENDER_EMAIL!,
            senderName: process.env.BREVO_SENDER_NAME!,
            adminEmail: process.env.ADMIN_EMAIL!,
      },

      admin_email:process.env.ADMIN_EMAIL!,

      // Frontend
      frontendUrl: process.env.FRONTEND_URL,
      frontendLoginUrl: process.env.FRONTEND_LOGIN_URL,
};
