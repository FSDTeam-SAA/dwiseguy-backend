import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import AppError from '../errors/AppError';
import config from '../config/config';

dotenv.config();



// Create transporter
const transporter: Transporter = nodemailer.createTransport({
      host: config.brevo.host,
      port: config.brevo.port,
      secure: false, // Always false for port 587
      auth: {
            user: config.brevo.auth.user,
            pass: config.brevo.auth.pass,
      },
      tls: {
            rejectUnauthorized: false,
      },
});

// Mailer function
interface MailerOptions {
      subject: string;
      template: string;
      email: string;
}

export const mailer = async ({ subject, template, email }: MailerOptions): Promise<void> => {
      try {
            const info = await transporter.sendMail({
                  from: `Piano Academy <sabbir.dev001@gmail.com>`,
                  to: email,
                  subject,
                  html: template,
            });

            // console.log('📧 Email sent successfully:', info.messageId);
      } catch (error) {
            // console.error('❌ Failed to send email', error);
            throw new AppError(500, 'Failed to send email', error);
      }
};
