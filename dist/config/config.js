"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
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
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '7d',
        },
        refresh: {
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '90d',
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
    //Email
    email: {
        expires: Number(process.env.EMAIL_EXPIRES) || 900000,
        host: process.env.HOST_MAIL,
        port: Number(process.env.EMAIL_PORT) || 587,
        address: process.env.EMAIL_ADDRESS,
        password: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        admin: process.env.ADMIN_EMAIL,
    },
    // Frontend
    frontendUrl: process.env.FRONTEND_URL,
};
