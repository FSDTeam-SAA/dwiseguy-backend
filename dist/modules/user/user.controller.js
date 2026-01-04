"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.getUsers = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const user_model_1 = require("./user.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const getUsers = async (req, res, next) => {
    try {
        res.json({ message: 'Get all users' });
    }
    catch (err) {
        next(err);
    }
};
exports.getUsers = getUsers;
exports.createUser = (0, catchAsync_1.default)(async (req, res) => {
    const value = req.body;
    const user = (await user_model_1.User.create(value)).save();
    if (!user)
        throw new AppError_1.default(400, 'User registration failed');
    (0, sendResponse_1.default)(res, { statusCode: 201, success: true, message: 'User created successfully', data: user });
});
