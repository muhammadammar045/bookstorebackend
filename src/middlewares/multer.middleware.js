import multer from 'multer';
import path from 'path';

// Define disk storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.resolve('/tmp');
        // console.log(tempDir)
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadOnMulter = multer({ storage });

export { uploadOnMulter };
