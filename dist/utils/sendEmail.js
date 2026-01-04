"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailer = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const config_1 = __importDefault(require("../config/config"));
dotenv_1.default.config();
// Create transporter
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    secure: process.env.NODE_ENV === 'production' ? true : false,
    auth: {
        user: config_1.default.email.host,
        pass: config_1.default.email.password,
    },
});
console.log(config_1.default.email.host, config_1.default.email.password);
const mailer = async ({ subject, template, email }) => {
    try {
        await transporter.sendMail({
            from: `"Piano Academy" <${config_1.default.email.host}>`,
            to: email,
            subject,
            html: template,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, 'Failed to send email', error);
    }
};
exports.mailer = mailer;
