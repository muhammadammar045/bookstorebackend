import { Review } from "../../models/product/review.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import mongoose from "mongoose";

// Create a new review
const createReview = asyncHandler(async (req, res) => {
    const { reviewTitle, reviewBody, reviewRating, reviewProduct } = req.body;

    if (!reviewTitle || !reviewBody || !reviewRating || !reviewProduct || !mongoose.Types.ObjectId.isValid(reviewProduct)) {
        throw new ApiError(400, "Invalid review data or product ID");
    }

    const review = await Review.create({
        reviewTitle,
        reviewBody,
        reviewRating,
        reviewAuthor: req.user._id,
        reviewProduct,
    });

    return res.status(201).json(new ApiResponse(201, review, "Review created successfully"));
});

// Get a single review by ID
const getReviewById = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
        throw new ApiError(400, "Invalid review ID");
    }

    const review = await Review.findById(reviewId).populate("reviewAuthor", "username").populate("reviewProduct", "productTitle");

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    return res.status(200).json(new ApiResponse(200, review, "Review retrieved successfully"));
});

// Get all reviews for a specific product
const getReviewsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const reviews = await Review.find({ reviewProduct: productId }).populate("reviewAuthor", "username");

    if (reviews.length === 0) {
        throw new ApiError(404, "No reviews found for this product");
    }

    return res.status(200).json(new ApiResponse(200, reviews, "Reviews retrieved successfully"));
});

// Update a review by ID
const updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { reviewTitle, reviewBody, reviewRating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId) || !reviewTitle || !reviewBody || reviewRating === undefined) {
        throw new ApiError(400, "Invalid review ID or review data");
    }

    const review = await Review.findOneAndUpdate(
        { _id: reviewId, reviewAuthor: req.user._id },
        { reviewTitle, reviewBody, reviewRating, updatedAt: Date.now() },
        { new: true }
    );

    if (!review) {
        throw new ApiError(404, "Review not found or you're not authorized to update this review");
    }

    return res.status(200).json(new ApiResponse(200, review, "Review updated successfully"));
});

// Delete a review by ID
const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        throw new ApiError(400, "Invalid review ID");
    }

    const review = await Review.findOneAndDelete({ _id: reviewId, reviewAuthor: req.user._id });

    if (!review) {
        throw new ApiError(404, "Review not found or you're not authorized to delete this review");
    }

    return res.status(200).json(new ApiResponse(200, review, "Review deleted successfully"));
});

export {
    createReview,
    getReviewById,
    getReviewsByProduct,
    updateReview,
    deleteReview,
};
