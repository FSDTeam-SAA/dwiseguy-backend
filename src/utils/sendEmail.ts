import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import AppError from '../errors/AppError';
import config from '../config/config';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';

dotenv.config();
interface MailerOptions {
      subject: string;
      template: string;
      email: string;
}

// Create transporter
const transporter: Transporter = nodemailer.createTransport({
      host: config.brevo.host,
      port: config.brevo.port,
      secure: config.brevo.port === 587 ? false : true, // Always false for port 587
      auth: {
            user: config.brevo.auth.user,
            pass: config.brevo.auth.pass,
      },
      tls: {
            rejectUnauthorized: false,
      },
});

// Mailer function
export const mailer = async ({ subject, template, email }: MailerOptions): Promise<void> => {
      try {
            const info = await transporter.sendMail({
                  from: `${config.brevo.senderName} <${config.brevo.senderEmail}>`,
                  to: email,
                  subject,
                  html: template,
            });

            config.env === 'development' && console.log('Email sent successfully:', info.messageId);
      } catch (error) {
            config.env === 'development' && console.error('Failed to send email', error);
            throw new AppError(500, 'Failed to send email', error);
      }
};

// //!Use breve email service webhook
// export const mailer = async ({ subject, template, email }: MailerOptions): Promise<void> => {
//       const response = await axios.post(
//             'https://api.brevo.com/v3/smtp/email',
//             {
//                   sender: { name: 'Dream Builders', email: 'sabbir.dev001@gmail.com' },
//                   to: [{ email: email }],
//                   subject,
//                   htmlContent: template,
//             },
//             {
//                   headers: {
//                         'api-key': config.brevo.auth.apiKey,
//                         'Content-Type': 'application/json',
//                   },
//             }
//       );

//       config.env === 'development' && console.log(response.data);
// };