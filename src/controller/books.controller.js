import { isValidObjectId } from "mongoose";
import { Books } from "../models/books.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../utils/Cloudinary.js";
import path from "path";
import asyncHandler from "../utils/asyncHandler.js";

const addBook = asyncHandler(async (req, res) => {
    const { title, description, price, category } = req.body;

    if ([title, description, price, category].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Please fill all the required fields (title, description, price, category)");
    }

    const existingBook = await Books.findOne({ title });
    if (existingBook) {
        throw new ApiError(400, "Book with this title already exists");
    }

    const thumbnailPath = req?.file?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail path not found in request");
    }

    const uploadedThumbnail = await uploadImageToCloudinary(thumbnailPath);
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
    }

    const createBook = await Books.create({
        title,
        description,
        price,
        category,
        thumbnail: uploadedThumbnail.url,
        author: req.user?._id
    });

    if (!createBook) {
        throw new ApiError(500, "Failed to create book record in the database");
    }

    return res.status(200).json(new ApiResponse(200, createBook, "Book created successfully"));
});

const getAllBooks = asyncHandler(async (req, res) => {
    const paginatedResult = res.paginatedResult;

    if (!paginatedResult) {
        throw new ApiError(400, "No result found");
    }

    return res.status(200).json(new ApiResponse(200, paginatedResult, "Books fetched with pagination"));
});

const getBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    if (!bookId?.trim() || !isValidObjectId(bookId)) {
        throw new ApiError(400, "Invalid book id");
    }

    const book = await Books.findById(bookId);

    if (!book) {
        throw new ApiError(404, "Book Not Found");
    }

    return res.status(200).json(new ApiResponse(200, book, "Book Fetched Successfully"));
});

const deleteBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    if (!bookId) {
        throw new ApiError(400, "bookId is Required");
    }

    const book = await Books.findById(bookId);

    if (!book) {
        throw new ApiError(404, "Book Not Found");
    }

    if (book.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this Book")
    }

    const deletedThumbnail = await deleteImageFromCloudinary(book.thumbnail);
    if (!deletedThumbnail) {
        throw new ApiError(500, "Thumbnail is not deleted");
    }

    const deleteBook = await Books.findByIdAndDelete(bookId);
    if (!deleteBook) {
        throw new ApiError(500, "Book Not Deleted");
    }

    return res.status(200).json(new ApiResponse(200, deleteBook, "Book Deleted Successfully"));
});

const updateBook = asyncHandler(async (req, res) => {
    const { title, description, category, price } = req.body;
    const { bookId } = req.params;

    if (!bookId) {
        throw new ApiError(400, "bookId is Required");
    }

    const book = await Books.findById(bookId);
    if (!book) {
        throw new ApiError(404, "Book Not Found");
    }

    if (book.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this Book")
    }

    const updatedBook = await Books.findByIdAndUpdate(
        bookId,
        {
            $set: { title, description, category, price }
        },
        { new: true }
    );

    if (!updatedBook) {
        throw new ApiError(500, "Failed to update book");
    }

    return res.status(200).json(new ApiResponse(200, updatedBook, "Book Updated Successfully"));
});

const updateBookThumbnail = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    if (!bookId) {
        throw new ApiError(400, "Book ID is required");
    }

    const book = await Books.findById(bookId);
    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    if (book.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this Book Thumbnail")
    }

    if (book.thumbnail) {
        await deleteImageFromCloudinary(book.thumbnail);
    }

    const file = req.file;
    if (!file) {
        throw new ApiError(400, "No file uploaded");
    }

    const filePath = path.resolve('/tmp', file.filename);
    const uploadedThumbnail = await uploadImageToCloudinary(filePath);

    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }

    const updatedBook = await Books.findByIdAndUpdate(
        bookId,
        { thumbnail: uploadedThumbnail.url },
        { new: true }
    );

    if (!updatedBook) {
        throw new ApiError(500, "Failed to update book with new thumbnail");
    }

    return res.status(200).json(new ApiResponse(200, updatedBook, "Book thumbnail updated successfully"));
});

export {
    addBook,
    getBook,
    getAllBooks,
    deleteBook,
    updateBook,
    updateBookThumbnail,
};
