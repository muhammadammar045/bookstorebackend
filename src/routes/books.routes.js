import { Router } from "express";
import { addBook, deleteBook, getAllBooks, getBook, updateBook, updateBookThumbnail } from "../controller/books.controller.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js";
import { Books } from "../models/books.model.js";
import paginate from "../middlewares/paginate.middelware.js"

const router = Router()

router.route("/").get((req, res) => {
    res.json({ message: "Welcome to the Book Management API!" })
})
router.route("/add-book").post(uploadOnMulter.single("thumbnail"), addBook)
router.route("/get-all-books").get(paginate(Books), getAllBooks)
router.route("/get-book/:bookId").get(getBook)
router.route("/delete-book/:bookId").delete(deleteBook)
router.route("/update-book/:bookId").patch(updateBook)
router.route("/update-book-thumbnail/:bookId").patch(uploadOnMulter.single("thumbnail"), updateBookThumbnail)

export default router