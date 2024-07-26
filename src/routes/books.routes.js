import { Router } from "express";
import { addBook, deleteBook, getAllBooks, getBook, getCurrentUserBooks, updateBook, updateBookThumbnail } from "../controller/books.controller.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js";
import { Books } from "../models/books.model.js";
import paginate from "../middlewares/paginate.middleware.js"
import { isAuthenticated } from "../middlewares/authentication.middleware.js";
import { hasPermissions } from "../middlewares/permissions.js";

const router = Router()
router.use(isAuthenticated)

router
    .route("/")
    .get((req, res) => {
        res.json({ message: "Welcome to the Authenticated Book Management API!" })
    })

router.
    route("/get-all-books")
    .get(hasPermissions(["read"]), paginate(Books), getAllBooks)

router.
    route("/get-current-user-books")
    .get(hasPermissions(["read"]), paginate(Books, (req) => ({ author: req.user._id })), getCurrentUserBooks)

router
    .route("/get-book/:bookId")
    .get(hasPermissions(["read"], Books, "bookId"), getBook)

router
    .route("/delete-book/:bookId")
    .delete(hasPermissions(["delete"], Books, "bookId"), deleteBook)

router
    .route("/update-book/:bookId")
    .patch(hasPermissions(["update"], Books, "bookId"), updateBook)

router
    .route("/add-book")
    .post(uploadOnMulter.single("thumbnail"), hasPermissions(["create"]), addBook)

router
    .route("/update-book-thumbnail/:bookId")
    .patch(uploadOnMulter.single("thumbnail"), hasPermissions(["update"], Books, "bookId"), updateBookThumbnail)


export default router