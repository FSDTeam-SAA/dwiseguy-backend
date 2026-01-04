"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config/config"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary.cloudName,
    api_key: config_1.default.cloudinary.apiKey,
    api_secret: config_1.default.cloudinary.apiSecret,
});
/* =====================================
   UPLOAD IMAGE / AUDIO
===================================== */
const uploadToCloudinary = async (localFilePath, type = 'image') => {
    try {
        if (!localFilePath)
            return null;
        const resourceType = type === 'audio' ? 'video' : 'image';
        const folder = type === 'audio' ? 'piano/audio' : 'piano/images';
        const response = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: resourceType, // audio => video, image => image
            folder,
            quality: 'auto',
        });
        console.log(localFilePath);
        // Remove file from local storage after upload
        if (localFilePath && fs_1.default.existsSync(localFilePath)) {
            fs_1.default.unlinkSync(localFilePath);
        }
        return {
            public_id: response.public_id,
            url: response.secure_url,
            duration: response?.duration || null, // only for audio
            file_type: response.format,
        };
    }
    catch (error) {
        // Remove file from local storage if upload fails
        if (localFilePath && fs_1.default.existsSync(localFilePath)) {
            fs_1.default.unlinkSync(localFilePath);
        }
        return null;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
/* =====================================
   DELETE IMAGE / AUDIO
===================================== */
const deleteFromCloudinary = async (publicId, type = 'image') => {
    try {
        if (!publicId)
            return;
        const resourceType = type === 'audio' ? 'video' : 'image';
        await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
