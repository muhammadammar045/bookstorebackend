// src/middlewares/multer.middleware.js
import multer from 'multer';

const storage = multer.memoryStorage(); // Use memory storage

const uploadOnMulter = multer({ storage });

export { uploadOnMulter };
