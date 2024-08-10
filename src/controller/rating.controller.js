import { Rating } from "../models/rating.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const addOrUpdateRating = asyncHandler(async (req, res) => {
    const { productId, rating } = req.body;

    if (!productId || !rating || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID or rating");
    }

    if (rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    let userRating = await Rating.findOne({ user: req.user._id, product: productId });

    if (userRating) {
        userRating.rating = rating;
        userRating.updatedAt = Date.now();
        await userRating.save();
    } else {
        userRating = await Rating.create({
            rating,
            user: req.user._id,
            product: productId,
        });
    }

    return res.status(201).json(new ApiResponse(201, userRating, "Rating submitted successfully"));
});

const getProductRatings = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const ratings = await Rating.find({ product: productId }).populate("user", "username");

    if (!ratings || ratings.length === 0) {
        throw new ApiError(404, "No ratings found for this product");
    }

    return res.status(200).json(new ApiResponse(200, ratings, "Ratings retrieved successfully"));
});

const getProductAverageRating = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const avgRating = await Rating.aggregate([
        { $match: { product: mongoose.Types.ObjectId(productId) } },
        { $group: { _id: "$product", averageRating: { $avg: "$rating" } } }
    ]);

    if (!avgRating || avgRating.length === 0) {
        throw new ApiError(404, "No ratings found for this product");
    }

    return res.status(200).json(new ApiResponse(200, avgRating[0].averageRating, "Average rating retrieved successfully"));
});

export {
    addOrUpdateRating,
    getProductRatings,
    getProductAverageRating,
};
