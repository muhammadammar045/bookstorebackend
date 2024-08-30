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

        // console.log(`Upload successful: ${uploadedFile.url}`);

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

        // if (deletedFile.result === 'ok') {
        //     console.log(`The File is deleted Successfully.`);
        // }

        return deletedFile;
    } catch (error) {
        console.log(`Cloudinary File Deleting Error ==> ${error.message}`);
        return null;
    }
};

const uploadMultipleImagesToCloudinary = async (filePaths) => {
    try {
        if (!filePaths || filePaths.length === 0) return null;

        const uploadedFiles = await Promise
            .all(
                filePaths
                    .map(
                        async (filePath) => {
                            const uploadedFile = await cloudinary.uploader.upload(
                                filePath,
                                {
                                    resource_type: 'auto',
                                }
                            );
                            fs.unlinkSync(filePath);

                            return uploadedFile;
                        }
                    )
            );

        return uploadedFiles;

    } catch (error) {
        console.log(chalk.red(`Cloudinary File Uploading Error ==> ${error.message}`));
        return null;
    }
}

const deleteImagesFromCloudinary = async (fileUrls, resourceType = 'image') => {
    try {
        if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
            return null;
        }

        const deletedFiles = await Promise
            .all(fileUrls
                .map(async (fileUrl) => {
                    const filePath = extractPublicId(fileUrl);
                    const deletedFile = await cloudinary.uploader.destroy(
                        filePath,
                        {
                            resource_type: resourceType
                        }
                    );
                    return deletedFile;
                }
                )
            );

        // Log the result of deletion for each file
        deletedFiles.forEach((deletedFile, index) => {
            if (deletedFile.result === 'ok') {
                console.log(chalk.blue(`File ${index + 1} deleted successfully.`));
            } else {
                console.log(chalk.red(`Failed to delete file ${index + 1}. Error: ${deletedFile.error.message}`));
            }
        });

        return deletedFiles;
    } catch (error) {
        console.log(chalk.red(`Cloudinary File Deleting Error ==> ${error.message}`));
        return null;
    }
}

export { uploadImageToCloudinary, uploadMultipleImagesToCloudinary, deleteImageFromCloudinary, deleteImagesFromCloudinary };
