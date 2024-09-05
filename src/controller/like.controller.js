import { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { Product } from '../models/product/product.model.js';
import { Review } from '../models/product/review.model.js';

const toggleProductLike = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId?.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    let isLiked;

    const like = await Like.findOne({
        likedBy: req.user?._id,
        product: productId
    });

    if (like) {
        await Like.deleteOne({
            product: like.product,
            likedBy: like.likedBy
        });
        isLiked = false;
    } else {
        const newLike = new Like({
            likedBy: req.user?._id,
            product: productId
        });
        await newLike.save();
        isLiked = true;
    }

    const message = isLiked ? "Product liked successfully" : "Product unliked successfully";

    return res.status(200).json(new ApiResponse(200, product, message));
});

const toggleReviewLike = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId?.trim() || !isValidObjectId(reviewId)) {
        throw new ApiError(400, "Invalid review id");
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    let isLiked;

    const like = await Like.findOne({
        review: reviewId,
        likedBy: req.user?._id
    });

    if (like) {
        await Like.deleteOne({
            review: reviewId,
            likedBy: req.user?._id
        });
        isLiked = false;
    } else {
        const newLike = new Like({
            review: reviewId,
            likedBy: req.user?._id
        });
        await newLike.save();
        isLiked = true;
    }

    const message = isLiked ? "Review liked successfully" : "Review unliked successfully";

    return res.status(200).json(new ApiResponse(200, review?.reviewTitle, message));
});

const getLikedProducts = asyncHandler(async (req, res) => {
    const likedProductsOwner = await Like.findOne({ likedBy: req.user?._id });

    if (!likedProductsOwner) {
        throw new ApiError(401, "Unauthorized to get liked products");
    }

    const likedProducts = await Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id,
                product: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "productDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "categories",
                            localField: "productCategory",
                            foreignField: "_id",
                            as: "categoryDetails",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        categoryName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            categoryDetails: {
                                $first: "$categoryDetails"
                            }
                        }
                    },

                    // OWNER DETAILS
                    {
                        $lookup: {
                            from: "users",
                            localField: "productOwner",
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

                    {
                        $project: {
                            _id: 1,
                            productTitle: 1,
                            productDescription: 1,
                            productThumbnail: 1,
                            productPrice: 1,
                            categoryDetails: 1,
                            ownerDetails: 1,
                            createdAt: 1,
                            updatedAt: 1,

                        }
                    }
                ]
            }
        },




        // FINAL STRUCTURE
        {
            $project: {
                _id: 1,
                productDetails: 1,
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, { likedProducts, productsCount: likedProducts.length }, "Liked Products fetched successfully"));
});

export {
    toggleProductLike,
    toggleReviewLike,
    getLikedProducts
};
