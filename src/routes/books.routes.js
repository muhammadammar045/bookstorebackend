import { Router } from "express";
import { addBook, deleteBook, getAllBooks, getBook, getCurrentUserBooks, updateBook, updateBookThumbnail } from "../controller/books.controller.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js";
import { Books } from "../models/books.model.js";
import paginate from "../middlewares/paginate.middleware.js"
import { isAuthenticated } from "../middlewares/authentication.middleware.js";

const router = Router()
router.use(isAuthenticated)

router
    .route("/")
    .get((req, res) => {
        res.json({ message: "Welcome to the Authenticated Book Management API!" })
    })

router.
    route("/get-all-books")
    .get(paginate(Books), getAllBooks)

router.
    route("/get-current-user-books")
    .get(getCurrentUserBooks)

router
    .route("/get-book/:bookId")
    .get(getBook)

router
    .route("/delete-book/:bookId")
    .delete(deleteBook)

router
    .route("/update-book/:bookId")
    .patch(updateBook)

router
    .route("/add-book")
    .post(uploadOnMulter.single("thumbnail"), addBook)

router
    .route("/update-book-thumbnail/:bookId")
    .patch(uploadOnMulter.single("thumbnail"), updateBookThumbnail)


export default router