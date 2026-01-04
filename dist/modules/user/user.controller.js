"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.loginUser = exports.createUser = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const user_model_1 = require("./user.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
// @desc    Create user
exports.createUser = (0, catchAsync_1.default)(async (req, res) => {
    const value = req.body;
    const user = (await user_model_1.User.create(value)).save();
    if (!user)
        throw new AppError_1.default(400, 'User registration failed');
    (0, sendResponse_1.default)(res, { statusCode: 201, success: true, message: 'User created successfully', data: user });
});
// @desc    login user
exports.loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const value = req.body;
    const user = await user_model_1.User.findOne({ email: value.email }).select('+password');
    if (!user)
        throw new AppError_1.default(400, 'User not found email or password is incorrect');
    //check password match
    const isPasswordMatch = await user_model_1.User.isPasswordMatched(value.password, user.password);
    if (!isPasswordMatch)
        throw new AppError_1.default(400, 'User not found email or password is incorrect');
    //generate tokens
    const accessToken = user_model_1.User.generateAccessToken(user);
    const refreshToken = user_model_1.User.generateRefreshToken(user);
    //update refresh token in database
    user.refreshToken = refreshToken;
    await user.save();
    //save refresh token to cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User logged in successfully',
        data: {
            id: user._id,
            email: user.email,
            accessToken: accessToken,
        },
    });
});
const getUsers = async (req, res, next) => {
    try {
        res.json({ message: 'Get all users' });
    }
    catch (err) {
        next(err);
    }
};
exports.getUsers = getUsers;
