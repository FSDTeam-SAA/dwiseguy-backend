import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import AppError from '../errors/AppError';
import config from '../config/config';

dotenv.config();

// Create transporter
const transporter: Transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: process.env.NODE_ENV === 'production' ? true : false,
      auth: {
            user: config.email.host as string,
            pass: config.email.password as string,
      },
});

console.log(config.email.host, config.email.password);

interface MailerOptions {
      subject: string;
      template: string;
      email: string;
}

export const mailer = async ({ subject, template, email }: MailerOptions): Promise<void> => {
      try {
            await transporter.sendMail({
                  from: `"Piano Academy" <${config.email.host}>`,
                  to: email,
                  subject,
                  html: template,
            });
      } catch (error: unknown) {
            throw new AppError(500, 'Failed to send email', error);
      }
};
