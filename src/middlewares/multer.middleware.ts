import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import AppError from '../errors/AppError';

// 1. Absolute path for the upload directory
const uploadDir = path.join(process.cwd(), 'uploads');

// 2. Ensure directory exists
if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Storage Configuration with unique filenames
const storage = multer.diskStorage({
      destination: function (req, file, cb) {
            cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const extension = path.extname(file.originalname).toLowerCase();
            // Remove spaces and special characters from the original name
            const cleanName = path
                  .basename(file.originalname, extension)
                  .replace(/\s+/g, '_')
                  .replace(/[^a-zA-Z0-9_]/g, '');

            cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
      },
});

// 4. Enhanced File Filter (Fixes the "Empty Files" issue)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.mp3', '.aif', '.wav', '.mpeg', '.ogg'];
      const ext = path.extname(file.originalname).toLowerCase();

      // Check if extension is in our allowed list
      const isAllowedExt = allowedExts.includes(ext);

      // Flexible Mimetype check:
      // Postman/Browsers often send 'audio/mpeg' for mp3s or 'image/jpeg' for jpgs
      const isImageMime = file.mimetype.startsWith('image/');
      const isAudioMime = file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream';

      if (isAllowedExt && (isImageMime || isAudioMime)) {
            return cb(null, true);
      }

      cb(
            new AppError(
                  StatusCodes.BAD_REQUEST,
                  `Invalid file type: ${file.originalname}. Only common images and audio files are allowed.`
            ) as any
      );
};

// 5. Final Export with safety limits
export const upload = multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
            fileSize: 15 * 1024 * 1024, // 15MB
            files: 10, // Increased limit for flexibility
      },
});
