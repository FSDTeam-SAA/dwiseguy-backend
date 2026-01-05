// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//       destination: function (req, file, cb) {
//             cb(null, path.join(__dirname, '../../uploads'));
//       },
//       filename: function (req, file, cb) {
//             const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//             cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//       },
// });

// // export const upload = multer({
// //       storage: storage,
// //       limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// //       fileFilter: (req, file, cb) => {
// //             const filetypes = /jpeg|jpg|png/;
// //             const mimetype = filetypes.test(file.mimetype);
// //             const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

// //             if (mimetype && extname) {
// //                   return cb(null, true);
// //             }
// //             cb(new Error('Only images (jpeg, jpg, png) are allowed'));
// //       },
// // });


// // multer.middleware.ts
// export const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB for audio files
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|mp3|wav|mpeg/; // Added audio types
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Only images (jpeg, jpg, png) and audio (mp3, wav) are allowed'));
//   },
// });



// Nayem ->
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../errors/AppError'; // Ensure you have your custom error handler
import { StatusCodes } from 'http-status-codes';

// 1. Define and Ensure Upload Directory (Scalable & Absolute)
const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Cleaning filename: remove spaces and add unique timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, extension).replace(/\s+/g, '_');
        
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
});

// 3. File Filter (Handles Corner Case: Incorrect File Types)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageTypes = /jpeg|jpg|png|webp/;
    const allowedAudioTypes = /mp3|wav|mpeg|ogg/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(mimetype);
    const isAudio = allowedAudioTypes.test(extname) && allowedAudioTypes.test(mimetype);

    if (isImage || isAudio) {
        return cb(null, true);
    }

    cb(new Error('Invalid file type. Only Images (JPG, PNG, WebP) and Audio (MP3, WAV) are allowed.') as any);
};

// 4. Exporting the Middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB Limit (Crucial for high-quality piano audio)
        files: 6, // Limit: 1 Audio + 5 Images as per your controller logic
    },
});