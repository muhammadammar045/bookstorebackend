import { Review } from "../../models/product/review.model.js";
import { Product } from "../../models/product/product.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const createReview = asyncHandler(async (req, res) => {
    const { reviewTitle, reviewBody, reviewRating } = req.body;
    const { productId } = req.params;

    if ([reviewTitle, reviewBody, reviewRating]
        .some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Please provide all required fields");
    }
    if (!productId?.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id");
    }
    if (reviewRating < 1 || reviewRating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }
    const reviewProduct = await Product.findById(productId);
    if (!reviewProduct) {
        throw new ApiError(404, "Product not found");
    }

    const existingReview = await Review.findOne({
        reviewProduct: reviewProduct._id,
        reviewAuthor: req.user._id
    });

    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this product");
    }

    const review = await Review.create({
        reviewTitle,
        reviewBody,
        reviewRating,
        reviewAuthor: req.user._id,
        reviewProduct: reviewProduct._id,
    });

    return res.status(201).json(new ApiResponse(201, review, "Review created successfully"));
});


const getReviewById = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId || !isValidObjectId(reviewId)) {
        throw new ApiError(400, "Invalid review ID");
    }

    const review = await Review.findById(reviewId)
        .populate("reviewAuthor", "username")
        .populate("reviewProduct", "productTitle");

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    return res.status(200).json(new ApiResponse(200, review, "Review retrieved successfully"));
});


const getReviewsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const reviews = await Review.aggregate([
        {
            $match: {
                reviewProduct: mongoose.Types.ObjectId.createFromHexString(productId)
            }
        },

        // OWNER DETAILS
        {
            $lookup: {
                from: "users",
                localField: "reviewAuthor",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            profileImage: 1,
                            userName: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                ownerDetails: {
                    $first: "$ownerDetails"
                }
            }
        },

        // PROJECT FIELDS
        {
            $project: {
                ownerDetails: 1,
                reviewTitle: 1,
                reviewBody: 1,
                reviewRating: 1,
                createdAt: 1
            }
        },

        // GROUP STAGE FOR AGGREGATIONS
        {
            $group: {
                _id: null,
                reviews: { $push: "$$ROOT" },
                reviewCount: { $sum: 1 },
                averageRating: { $avg: "$reviewRating" },
                starCount: {
                    $push: {
                        star: "$reviewRating",
                        count: { $sum: 1 }
                    }
                }
            }
        },

        // PROJECT FINAL OUTPUT
        {
            $project: {
                _id: 0,
                reviews: 1,
                reviewCount: 1,
                averageRating: { $round: ["$averageRating", 1] },
                individualStarCount: {
                    $reduce: {
                        input: "$reviews",
                        initialValue: {
                            oneStar: 0,
                            twoStar: 0,
                            threeStar: 0,
                            fourStar: 0,
                            fiveStar: 0
                        },
                        in: {
                            oneStar: {
                                $cond:
                                    [
                                        { $eq: ["$$this.reviewRating", 1] },
                                        { $add: ["$$value.oneStar", 1] },
                                        "$$value.oneStar"
                                    ]
                            },
                            twoStar: { $cond: [{ $eq: ["$$this.reviewRating", 2] }, { $add: ["$$value.twoStar", 1] }, "$$value.twoStar"] },
                            threeStar: { $cond: [{ $eq: ["$$this.reviewRating", 3] }, { $add: ["$$value.threeStar", 1] }, "$$value.threeStar"] },
                            fourStar: { $cond: [{ $eq: ["$$this.reviewRating", 4] }, { $add: ["$$value.fourStar", 1] }, "$$value.fourStar"] },
                            fiveStar: { $cond: [{ $eq: ["$$this.reviewRating", 5] }, { $add: ["$$value.fiveStar", 1] }, "$$value.fiveStar"] }
                        }
                    }
                }
            }
        }
    ]);



    return res.status(200).json(new ApiResponse(200, reviews[0], "Reviews retrieved successfully"));
});



const updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { reviewTitle, reviewBody, reviewRating } = req.body;

    if (!reviewId || !isValidObjectId(reviewId)) {
        throw new ApiError(400, "Invalid review ID");
    }
    if ([reviewTitle, reviewBody, reviewRating].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "Please provide all required fields (reviewTitle, reviewBody, reviewRating)");
    }
    if (reviewRating < 1 || reviewRating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const review = await Review.findOneAndUpdate(
        {
            _id: reviewId,
            reviewAuthor: req.user._id
        },
        {
            reviewTitle,
            reviewBody,
            reviewRating,
        },
        {
            new: true
        }
    );

    if (!review) {
        throw new ApiError(404, "Review not found or you're not authorized to update this review");
    }

    return res.status(200).json(new ApiResponse(200, review, "Review updated successfully"));
});


const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId.trim() || !isValidObjectId(reviewId)) {
        throw new ApiError(400, "Invalid review ID");
    }

    const review = await Review
        .findOneAndDelete
        (
            {
                _id: reviewId,
                reviewAuthor: req.user._id
            }
        );

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
