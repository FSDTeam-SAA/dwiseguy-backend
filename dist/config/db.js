"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const chalk_1 = __importDefault(require("chalk"));
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const dbinfo = await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log(chalk_1.default.green(`Database connection successful: ${dbinfo.connection.host}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('MongoDB connection failed!!'), error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
