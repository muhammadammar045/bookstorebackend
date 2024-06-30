import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "cloudinary-build-url"
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
})

const uploadImageToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        const uploadedFile = await cloudinary.uploader
            .upload(
                filePath,
                {
                    resource_type: 'auto',
                }
            )

        fs.unlinkSync(filePath);
        return uploadedFile;

    } catch (error) {
        fs.unlinkSync(filePath);
        console.log(`Cloudinary File Uploading Error ==> ${error.message}`)
        return null;
    }

}

const deleteImageFromCloudinary = async (fileUrl, resourceType = 'image') => {

    const filePath = extractPublicId(fileUrl);
    console.log(filePath)

    try {
        const deletedFile = await cloudinary.uploader.destroy(filePath, {
            resource_type: resourceType
        })

        if (deletedFile.result === 'ok') {
            console.log(`The File is deleted Successfully.`)
        }

        return deletedFile;

    } catch (error) {
        console.log(`Cloudinary File Deleting Error ==> ${error.message}`)
        return null;
    }
}

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
        console.log(`Cloudinary File Uploading Error ==> ${error.message}`);
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
                console.log(`File ${index + 1} deleted successfully.`);
            } else {
                console.log(`Failed to delete file ${index + 1}. Error: ${deletedFile.error.message}`);
            }

            return deletedFiles;
        })
    } catch (error) {
        console.log(`Cloudinary File Deleting Error ==> ${error.message}`);
        return null;
    }
}


export {
    uploadImageToCloudinary,
    deleteImageFromCloudinary,
    uploadMultipleImagesToCloudinary,
    deleteImagesFromCloudinary
}





// {
//     asset_id: '855d1c5819d62c8d94b334d2215816a5',
//     public_id: 'ignbu7l1faryuvb8oyiv',
//     version: 1708663166,
//     version_id: '84b5e86c89eb3946f6137868cb961521',
//     signature: 'd6b799f02b1334ca835ad0c61a4fb2c952af449a',
//     width: 820,
//     height: 340,
//     format: 'jpg',
//     resource_type: 'image',
//     created_at: '2024-02-23T04:39:26Z',
//     tags: [],
//     bytes: 77160,
//     type: 'upload',
//     etag: 'bd99a84e7455fb8099c69edf5ff60b7f',
//     placeholder: false,
//     url: 'http://res.cloudinary.com/ammardata/image/upload/
//           v1708663166/ignbu7l1faryuvb8oyiv.jpg',
//     secure_url: 'https://res.cloudinary.com/ammardata/image/
//           upload/v1708663166/ignbu7l1faryuvb8oyiv.jpg',
//     folder: '',
//     original_filename: 'banner-6',
//     api_key: '521924549186382'
//   },