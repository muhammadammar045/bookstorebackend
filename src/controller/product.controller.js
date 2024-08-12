import mongoose, { isValidObjectId } from "mongoose";
import { Product } from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../utils/Cloudinary.js";
import path from "path";
import asyncHandler from "../utils/asyncHandler.js";

const addProduct = asyncHandler(async (req, res) => {
    const { title, description, price, category } = req.body;

    if ([title, description, price, category].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Please fill all the required fields (title, description, price, category)");
    }

    const existingProduct = await Product.findOne({ title });
    if (existingProduct) {
        throw new ApiError(400, "Product with this title already exists");
    }

    const thumbnailPath = req?.file?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail path not found in request");
    }

    const uploadedThumbnail = await uploadImageToCloudinary(thumbnailPath);
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
    }

    const createProduct = await Product.create({
        title: title?.toUpperCase(),
        description,
        price,
        category: category?.toUpperCase(),
        thumbnail: uploadedThumbnail?.url,
        author: req.user?._id
    });

    if (!createProduct) {
        throw new ApiError(500, "Failed to create book record in the database");
    }

    return res.status(200).json(new ApiResponse(200, createProduct, "Product created successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, q = "" } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const query = q ? { title: new RegExp(q, 'i') } : {};


    const productsPipeline = [
        {
            $match: query
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"  // Ensures category is an object, not an array
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                price: 1,
                category: {
                    _id: "$category._id",
                    name: "$category.categoryName"
                },
                thumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
                author: {
                    _id: 1,
                    fullname: 1,
                }
            }
        },
        {
            $skip: skip
        },
        {
            $limit: pageSize
        }
    ];

    const products = await Product.aggregate(productsPipeline);
    console.log(products)
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);

    const response = {
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        products: products,
    };

    return res.status(200).json(new ApiResponse(200, response, "All Product fetched with pagination"));
});

const getAllProductsAdmin = asyncHandler(async (req, res) => {

    const productsPipeline = [
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                price: 1,
                category: {
                    _id: "$category._id",
                    name: "$category.categoryName"
                },
                thumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
                author: {
                    _id: 1,
                    fullname: 1,
                }
            }
        },

    ];

    const products = await Product.aggregate(productsPipeline);

    const response = {
        success: true,
        products: products,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "All Product fetched with pagination"));
});

const getCurrentUserProducts = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, q = "" } = req.query;
    const userId = req.user._id;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const query = q ? { title: new RegExp(q, 'i') } : {};

    const productsPipeline = [
        {
            $match: { author: userId }
        },
        { $match: query },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"  // Ensures category is an object, not an array
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                price: 1,
                category: {
                    _id: "$category._id",
                    name: "$category.categoryName"
                },
                thumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
                author: {
                    _id: 1,
                    fullname: 1,
                }
            }
        },
        {
            $skip: skip
        },
        {
            $limit: pageSize
        }
    ];

    const products = await Product.aggregate(productsPipeline);
    const totalProducts = await Product.countDocuments({ author: userId });
    const totalPages = Math.ceil(totalProducts / pageSize);

    const response = {
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        products: products,
    };

    return res.status(200).json(new ApiResponse(200, response, "Product for the user fetched with pagination"));
});

const getProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const isOwner = req.role

    if (!productId?.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const productsPipeline = [
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(productId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"  // Ensures category is an object, not an array
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                price: 1,
                category: {
                    _id: "$category._id",
                    name: "$category.categoryName"
                },
                thumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
                author: {
                    _id: 1,
                    fullname: 1,
                }
            }
        },


    ];

    const productArr = await Product.aggregate(productsPipeline)
    const product = productArr[0]

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

    const deletedThumbnail = await deleteImageFromCloudinary(product.thumbnail);
    if (!deletedThumbnail) {
        throw new ApiError(500, "Thumbnail is not deleted");
    }

    const deleteProduct = await Product.findByIdAndDelete(productId);
    if (!deleteProduct) {
        throw new ApiError(500, "Product Not Deleted");
    }

    return res.status(200).json(new ApiResponse(200, deleteProduct, "Product Deleted Successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
    const { title, description, category, price } = req.body;
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "productId is Required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product Not Found");
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                title: title?.toUpperCase(),
                description,
                category: category?.toUpperCase(),
                price
            }
        },
        { new: true }
    );

    if (!updatedProduct) {
        throw new ApiError(500, "Failed to update book");
    }

    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product Updated Successfully"));
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
