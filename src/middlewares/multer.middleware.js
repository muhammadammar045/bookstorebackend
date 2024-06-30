// src/middlewares/multer.middleware.js
import multer from 'multer';
import path from 'path';

// Define storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve('public/temp')); // Use 'public/temp' directory for storage
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`); // Ensure unique filenames
    }
});

const uploadOnMulter = multer({ storage });

export { uploadOnMulter };
