import multer from "multer";
import fs from "fs";
import path from "path";

// Resolve the __dirname
const __dirname = path.resolve();

// Define the upload directory
const uploadDir = path.join(__dirname, "public", "temp");

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Use absolute path
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // The file name to be stored in the destination
    }
});

export const uploadOnMulter = multer({
    storage
});
