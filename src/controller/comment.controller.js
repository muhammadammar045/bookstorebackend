import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const addComment = asyncHandler(async (req, res) => {
    const { content, productId } = req.body;

    if (!content || !productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid content or product ID");
    }

    const comment = await Comment.create({
        content,
        user: req.user._id,
        product: productId,
    });

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId).populate("user", "username");

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment retrieved successfully"));
});

const getCommentsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const comments = await Comment.find({ product: productId }).populate("user", "username");

    if (comments.length === 0) {
        throw new ApiError(404, "No comments found for this product");
    }

    return res.status(200).json(new ApiResponse(200, comments, "Comments retrieved successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId) || !content) {
        throw new ApiError(400, "Invalid comment ID or content");
    }

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, user: req.user._id },
        { content, updatedAt: Date.now() },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found or you're not authorized to update this comment");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findOneAndDelete({ _id: commentId, user: req.user._id });

    if (!comment) {
        throw new ApiError(404, "Comment not found or you're not authorized to delete this comment");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export {
    addComment,
    getComment,
    getCommentsByProduct,
    updateComment,
    deleteComment,
};
