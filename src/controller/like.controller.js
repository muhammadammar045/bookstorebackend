import { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';
import { Product } from '../models/product.model.js';
import { Comment } from '../models/comment.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

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

    return res.status(200).json(new ApiResponse(200, product?.name, message)); // Adjust based on Product fields
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId?.trim() || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    let isLiked;

    const like = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    });

    if (like) {
        await Like.deleteOne({
            comment: commentId,
            likedBy: req.user?._id
        });
        isLiked = false;
    } else {
        const newLike = new Like({
            comment: commentId,
            likedBy: req.user?._id
        });
        await newLike.save();
        isLiked = true;
    }

    const message = isLiked ? "Comment liked successfully" : "Comment unliked successfully";

    return res.status(200).json(new ApiResponse(200, {}, message));
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
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'likedProducts',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            price: 1,
                            description: 1,
                            thumbnail: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedProducts: { $first: '$likedProducts' }
            }
        },
        {
            $project: {
                _id: 0,
                likedProducts: 1
            }
        },
        {
            $replaceRoot: { newRoot: '$likedProducts' }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, { likedProducts, productsCount: likedProducts.length }, "Liked Products fetched successfully"));
});

export {
    toggleProductLike,
    toggleCommentLike,
    getLikedProducts
};
