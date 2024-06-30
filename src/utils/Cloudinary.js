// src/utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadImageToCloudinary = async (fileBuffer, fileName) => {
    try {
        const uploadedFile = await cloudinary.uploader.upload_stream(
            { resource_type: 'auto', public_id: fileName },
            (error, result) => {
                if (error) throw error;
                return result;
            }
        ).end(fileBuffer);

        return uploadedFile;
    } catch (error) {
        console.log(`Cloudinary File Uploading Error ==> ${error.message}`);
        return null;
    }
};

const deleteImageFromCloudinary = async (fileUrl) => {
    const filePath = extractPublicId(fileUrl);
    try {
        const deletedFile = await cloudinary.uploader.destroy(filePath, {
            resource_type: 'image',
        });

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
