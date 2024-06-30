import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/temp") // the destination of file
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // the file name to be stored in destination
    }
})

export const uploadOnMulter = multer(
    {
        storage
    }
)