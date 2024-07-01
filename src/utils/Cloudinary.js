// src/utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});


const uploadImageToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        const uploadedFile = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });

        console.log(`Upload successful: ${uploadedFile.url}`);

        fs.unlinkSync(filePath);

        return uploadedFile;

    } catch (error) {
        console.error(`Cloudinary File Uploading Error ==> ${error.message}`);

        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);
        }
        return null;
    }
};

const deleteImageFromCloudinary = async (fileUrl) => {
    const filePath = extractPublicId(fileUrl);

    try {
        const deletedFile = await cloudinary.uploader
            .destroy(filePath, { resource_type: 'image' });

        if (deletedFile.result === 'ok') {
            console.log(`The File is deleted Successfully.`);
        }

        return deletedFile;
    } catch (error) {
        console.log(`Cloudinary File Deleting Error ==> ${error.message}`);
        return null;
    }
};

export { uploadImageToCloudinary, deleteImageFromCloudinary };
