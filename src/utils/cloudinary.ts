import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import config from '../config/config';

cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
});

/* =====================================
   UPLOAD IMAGE / AUDIO
===================================== */
export const uploadToCloudinary = async (
      localFilePath: string,
      type: 'image' | 'audio' = 'image'
): Promise<{ public_id: string; url: string; duration?: number | null; file_type?: string } | null> => {
      try {
            if (!localFilePath) return null;

            const resourceType = type === 'audio' ? 'video' : 'image';
            const folder = type === 'audio' ? 'piano/audio' : 'piano/images';

            const response = await cloudinary.uploader.upload(localFilePath, {
                  resource_type: resourceType, // audio => video, image => image
                  folder,
                  quality: 'auto',
            });

            // Remove file from local storage after upload
            if (localFilePath && fs.existsSync(localFilePath)) {
                  fs.unlinkSync(localFilePath);
            }

            return {
                  public_id: response.public_id,
                  url: response.secure_url,
                  duration: response?.duration || null, // only for audio
                  file_type: response.format,
            };
      } catch (error) {
            // Remove file from local storage if upload fails
            if (localFilePath && fs.existsSync(localFilePath)) {
                  fs.unlinkSync(localFilePath);
            }
            return null;
      }
};

/* =====================================
   DELETE IMAGE / AUDIO
===================================== */
export const deleteFromCloudinary = async (publicId: string, type: 'image' | 'audio' = 'image'): Promise<void> => {
      try {
            if (!publicId) return;

            const resourceType = type === 'audio' ? 'video' : 'image';

            await cloudinary.uploader.destroy(publicId, {
                  resource_type: resourceType,
            });
      } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
      }
};
