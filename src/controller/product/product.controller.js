import mongoose, { isValidObjectId } from "mongoose";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Category } from "../../models/category.model.js";
import { deleteImageFromCloudinary, uploadImageToCloudinary, uploadMultipleImagesToCloudinary, deleteImagesFromCloudinary } from "../../utils/Cloudinary.js";
import path from "path";
import asyncHandler from "../../utils/asyncHandler.js";
import { Product } from "../../models/product/product.model.js";

const addProduct = asyncHandler(async (req, res) => {
    const { productTitle, productDescription, productPrice, productQuantity } = req.body;

    if ([productTitle, productDescription, productPrice, productQuantity].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Please fill all the required fields (productTitle, productDescription, productPrice, productQuantity)");
    }

    const existingProduct = await Product.findOne({ productTitle });
    if (existingProduct) {
        throw new ApiError(400, "Product with this title already exists");
    }

    const thumbnailPath = req.files?.productThumbnail?.[0]?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail path not found in request");
    }

    const uploadedThumbnail = await uploadImageToCloudinary(thumbnailPath);
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
    }

    const imagePaths = req.files?.productImages?.map(file => file.path);
    let uploadedImages = [];

    if (imagePaths && imagePaths.length > 0) {
        uploadedImages = await uploadMultipleImagesToCloudinary(imagePaths);

        if (!uploadedImages || uploadedImages.some(img => !img.url)) {
            throw new ApiError(400, "Failed to upload one or more images to Cloudinary");
        }
    }

    const createProduct = await Product.create({
        productTitle: productTitle?.toUpperCase(),
        productDescription,
        productPrice,
        productQuantity,
        productThumbnail: uploadedThumbnail?.url,
        productImages: uploadedImages.map(img => img.url),
        productOwner: req.user?._id
    });

    if (!createProduct) {
        throw new ApiError(500, "Failed to create product record in the database");
    }

    return res.status(200).json(new ApiResponse(200, createProduct, "Product created successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        q = "",
        sortBy = "createdAt",
        sortOrder = "asc",
        priceRange = "all"
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const price = priceRange.toLowerCase() === "all" ? { $gte: 0 } : { $gte: parseFloat(priceRange) };
    const query = q ? { productTitle: new RegExp(q, 'i') } : {};
    const sort = sortBy ? { [sortBy]: order } : { createdAt: -1 };
    const skip = (pageNumber - 1) * pageSize;

    const productsPipeline = [
        // FILTER PRODUCT
        {
            $match: {
                ...query,
                productPrice: price
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

        // USER LIKE STATUS
        {
            $lookup: {
                from: "likes",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$product", "$$productId"] },
                                    { $eq: ["$likedBy", req.user?._id] }  // Use optional chaining in case req.user is undefined
                                ]
                            }
                        }
                    }
                ],
                as: "userLike"
            }
        },
        {
            $addFields: {
                isLiked: { $gt: [{ $size: "$userLike" }, 0] }
            }
        },

        // SORTING
        {
            $sort: sort
        },

        // FINAL STRUCTURE
        {
            $project: {
                _id: 1,
                productTitle: 1,
                productDescription: 1,
                productPrice: 1,
                productThumbnail: 1,
                productImages: 1,
                productReviewsCount: 1,
                productAverageRating: 1,
                categoryDetails: 1,
                isLiked: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },

        // PAGINATION
        { $skip: skip },
        { $limit: pageSize }
    ];

    const totalProducts = await Product.countDocuments({ ...query, productPrice: price });
    const totalPages = Math.ceil(totalProducts / pageSize);

    const products = await Product.aggregate(productsPipeline);

    const response = {
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        products,
    };

    return res.status(200).json(new ApiResponse(200, response, "All products fetched with pagination and sorting"));
});




const getAllProductsAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortField = "createdAt", sortOrder = "desc", price = "all" } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const priceRange = price.toLowerCase() === "all" ? { price: { $gte: 0 } } : { price: { $gte: 0, $lte: price } };

    const productsPipeline = [
        // CATEGORY DETAILS
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

        // PRODUCT REVIEWS
        {
            $lookup: {
                from: "reviews",
                localField: "productReviews",
                foreignField: "_id",
                as: "productReviews",
            }
        },

        // ADD REVIEW COUNT
        {
            $addFields: {
                productReviewsCount: { $size: "$productReviews" }
            }
        },

        // SORTING
        {
            $sort: { [sortField]: order }
        },

        // FINAL STRUCTURE
        {
            $project: {
                _id: 1,
                productTitle: 1,
                productDescription: 1,
                productPrice: 1,
                productThumbnail: 1,
                productReviewsCount: 1,
                categoryDetails: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },

        // PAGINATION
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize }
    ];

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);

    const products = await Product.aggregate(productsPipeline);

    const response = {
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        products,
    };

    return res.status(200).json(new ApiResponse(200, response, "All products fetched with pagination and sorting"));
});


const getCurrentUserProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        q = "",
        sortField = "createdAt",
        sortOrder = "desc"
    } = req.query;

    const userId = req.user._id;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    // Query to filter by product title and product owner
    const query = {
        productOwner: userId,
        ...(q && { productTitle: new RegExp(q, 'i') })
    };

    const productsPipeline = [
        // FILTER PRODUCT
        {
            $match: query
        },

        // CATEGORY DETAILS
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

        // PRODUCT REVIEWS
        {
            $lookup: {
                from: "reviews",
                localField: "productReviews",
                foreignField: "_id",
                as: "productReviews",
            }
        },

        // ADD REVIEW COUNT
        {
            $addFields: {
                productReviewsCount: { $size: "$productReviews" }
            }
        },

        // SORTING
        {
            $sort: { [sortField]: order }
        },

        // FINAL STRUCTURE
        {
            $project: {
                _id: 1,
                productTitle: 1,
                productDescription: 1,
                productPrice: 1,
                productThumbnail: 1,
                productReviewsCount: 1,
                categoryDetails: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },

        // PAGINATION
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize }
    ];

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / pageSize);

    const products = await Product.aggregate(productsPipeline);

    const response = {
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        products,
    };

    return res.status(200).json(new ApiResponse(200, response, "User's products fetched with pagination and sorting"));
});



const getProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const isOwner = req.role;

    if (!productId?.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const productsPipeline = [

        // FILTER PRODUCT
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(productId)
            }
        },

        // CATEGORY DETAILS
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

        // PRODUCT REVIEWS
        {
            $lookup: {
                from: "reviews",
                localField: "productReviews",
                foreignField: "_id",
                as: "productReviews",
                // pipeline: [
                //     {
                //         $lookup: {
                //             from: "users",
                //             localField: "reviewAuthor",
                //             foreignField: "_id",
                //             as: "reviewAuthor",
                //             pipeline: [
                //                 {
                //                     $project: {
                //                         _id: 1,
                //                         profileImage: 1,
                //                         userName: 1,
                //                     }
                //                 }
                //             ]
                //         }
                //     },
                //     {
                //         $addFields: {
                //             reviewAuthor: { $first: "$reviewAuthor" }
                //         }
                //     },
                //     {
                //         $project: {
                //             _id: 1,
                //             reviewTitle: 1,
                //             reviewBody: 1,
                //             reviewRating: 1,
                //             reviewAuthor: 1,
                //             reviewCount: 1,
                //             createdAt: 1,
                //         }
                //     },
                // ]
            }
        },

        // ADD REVIEW COUNT,INDIVIDUAL STAR COUNT  AND AVERAGE RATING
        {
            $addFields: {
                productReviewsCount: { $size: "$productReviews" },
                productAverageRating: {
                    $cond: {
                        if: { $gt: [{ $size: "$productReviews" }, 0] },
                        then: { $round: [{ $avg: "$productReviews.reviewRating" }, 1] }, // Round to 1 decimal place
                        else: null // or 0 if you prefer
                    }
                },
                individualStarCounts: {
                    $map: {
                        input: [5, 4, 3, 2, 1],
                        as: "star",
                        in: {
                            star: "$$star",
                            count: {
                                $size: {
                                    $filter: {
                                        input: "$productReviews",
                                        as: "review",
                                        cond: { $eq: ["$$review.reviewRating", "$$star"] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        // PRODUCT VARIANTS
        {
            $lookup: {
                from: "productvariants",
                localField: "productVariants",
                foreignField: "_id",
                as: "productVariants",
                pipeline: [
                    {
                        $lookup: {
                            from: "productcolors",
                            localField: "productVariantColor",
                            foreignField: "_id",
                            as: "productVariantColor"
                        }
                    },
                    {
                        $addFields: {
                            productVariantColor: { $first: "$productVariantColor" }
                        }
                    },
                    {
                        $lookup: {
                            from: "productsizes",
                            localField: "productVariantSize",
                            foreignField: "_id",
                            as: "productVariantSize"
                        }
                    },
                    {
                        $addFields: {
                            productVariantSize: { $first: "$productVariantSize" }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            productVariantSize: {
                                _id: 1,
                                productSizeName: 1,
                                productSizeCode: 1
                            },
                            productVariantColor: {
                                _id: 1,
                                productColorName: 1,
                                productColorCode: 1
                            },
                            productVariantQuantity: 1,
                            productVariantPrice: 1,
                            productVariantThumbnail: 1,
                            productVariantImages: 1
                        }
                    },
                ]
            }
        },

        // USER LIKE STATUS
        {
            $lookup: {
                from: "likes",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$product", "$$productId"] },
                                    { $eq: ["$likedBy", req.user._id] }
                                ]
                            }
                        }
                    }
                ],
                as: "userLike"
            }
        },
        {
            $addFields: {
                isLiked: { $gt: [{ $size: "$userLike" }, 0] }
            }
        },


        // FINAL STRUCTURE
        {
            $project: {
                _id: 1,
                isLiked: 1,
                productTitle: 1,
                productDescription: 1,
                productPrice: 1,
                productQuantity: 1,
                productThumbnail: 1,
                productImages: 1,
                categoryDetails: 1,
                ownerDetails: 1,
                productReviews: 1,
                productReviewsCount: 1,
                productAverageRating: 1,
                individualStarCounts: 1,
                productVariants: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }



    ];

    const productArr = await Product.aggregate(productsPipeline);
    const product = productArr[0];

    if (!product) {
        throw new ApiError(404, "Product Not Found");
    }

    return res.status(200).json(new ApiResponse(200, { product, isOwner }, "Product Fetched Successfully"));
});


const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "productId is Required");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product Not Found");
    }

    // Delete the thumbnail
    const deletedThumbnail = await deleteImageFromCloudinary(product.productThumbnail);
    if (!deletedThumbnail) {
        throw new ApiError(500, "Thumbnail is not deleted");
    }

    // Delete additional images if they exist
    if (product.productImages && product.productImages.length > 0) {
        const deletedImages = await deleteImagesFromCloudinary(product.productImages);
        if (!deletedImages) {
            throw new ApiError(500, "Some product images were not deleted");
        }
    }

    // Delete the product from the database
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
        throw new ApiError(500, "Product Not Deleted");
    }

    return res.status(200).json(new ApiResponse(200, deletedProduct, "Product Deleted Successfully"));
});


const updateProduct = asyncHandler(async (req, res) => {
    const { productTitle, productDescription, productCategory, productPrice } = req.body;
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    let categoryId;
    if (productCategory) {
        const existingCategory = await Category.findOne({ categoryName: productCategory.trim() });
        if (!existingCategory) {
            throw new ApiError(400, "Category does not exist");
        }
        categoryId = existingCategory._id;
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                productTitle: productTitle?.toUpperCase(),
                productDescription,
                productCategory: categoryId,
                productPrice
            }
        },
        { new: true }
    );

    if (!updatedProduct) {
        throw new ApiError(500, "Failed to update product");
    }

    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});


const updateProductThumbnail = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }


    if (product.thumbnail) {
        await deleteImageFromCloudinary(product.thumbnail);
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

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { thumbnail: uploadedThumbnail.url },
        { new: true }
    );

    if (!updatedProduct) {
        throw new ApiError(500, "Failed to update book with new thumbnail");
    }

    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product thumbnail updated successfully"));
});


export {
    addProduct,
    getProduct,
    getAllProducts,
    getAllProductsAdmin,
    getCurrentUserProducts,
    deleteProduct,
    updateProduct,
    updateProductThumbnail,
};
