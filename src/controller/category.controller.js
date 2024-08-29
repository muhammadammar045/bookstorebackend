import { Category } from "../models/category.model.js";
import { Product } from "../models/product/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";


const addCategory = asyncHandler(async (req, res) => {
    const { categoryName, description, parentCategoryId } = req.body;

    if (!categoryName) {
        throw new ApiError(400, "Category name is required");
    }

    if (!description) {
        throw new ApiError(400, "Description is required");
    }

    if (parentCategoryId && !isValidObjectId(parentCategoryId)) {
        throw new ApiError(400, "Invalid parent category ID");
    }

    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
        throw new ApiError(400, "Category already exists");
    }

    const parentCategory = parentCategoryId ? await Category.findById(parentCategoryId) : null;

    if (parentCategoryId && !parentCategory) {
        throw new ApiError(404, "Parent category not found");
    }

    const category = await Category.create({
        categoryName,
        description,
        parentCategory: parentCategoryId || null,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});


const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().populate("parentCategory");

    if (categories.length === 0) {
        throw new ApiError(404, "No categories found")
    }

    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
})


const getAllParentCategories = asyncHandler(async (req, res) => {
    const result = await Category.find({ parentCategory: null });

    if (result.length === 0) {
        throw new ApiError(404, "No parent categories found");
    }

    return res.status(200).json(new ApiResponse(200, result, "Parent categories retrieved successfully"));
})


const getAllSubCategories = asyncHandler(async (req, res) => {
    const result = await Category.find({ parentCategory: { $ne: null } });

    if (result.length === 0) {
        throw new ApiError(404, "No subcategories found");
    }

    return res.status(200).json(new ApiResponse(200, result, "Subcategories retrieved successfully"));
})


const getCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId).populate("parentCategory");

    if (!category) {
        throw new ApiError(404, "Category not found")
    }
    return res.status(200).json(new ApiResponse(200, category, "Category retrieved successfully"));
})


const updateCategory = asyncHandler(async (req, res) => {
    const { categoryName, description, parentCategoryId } = req.body;
    const { categoryId } = req.params;

    if (!categoryName || !categoryName.trim()) {
        throw new ApiError(400, "Please provide a valid category name");
    }

    if (!description || !description.trim()) {
        throw new ApiError(400, "Please provide a valid description");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory && !existingCategory._id.equals(category._id)) {
        throw new ApiError(400, "Category name already exists");
    }

    if (parentCategoryId) {
        if (!isValidObjectId(parentCategoryId)) {
            throw new ApiError(400, "Invalid parent category ID");
        }

        const parentCategory = await Category.findById(parentCategoryId);
        if (!parentCategory) {
            throw new ApiError(404, "Parent category not found");
        }

        if (parentCategory._id.equals(category._id)) {
            throw new ApiError(400, "A category cannot be its own parent");
        }

        category.parentCategory = parentCategory._id;

    } else {
        category.parentCategory = null;
    }

    category.categoryName = categoryName;
    category.description = description;

    const updatedCategory = await category.save();

    return res.status(200).json(new ApiResponse(200, updatedCategory, "Category updated successfully"));
});


const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    await Category.deleteMany({ parentCategory: categoryId });

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json(new ApiResponse(200, category, "Category and its subcategories deleted successfully"));
});


const getCategoryProducts = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const {
        page = 1,
        limit = 10,
        q = "",
        sortField = "createdAt",
        sortOrder = "desc"
    } = req.query;

    if (!categoryId.trim() || !isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }


    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const query = q ? { productTitle: new RegExp(q, 'i') } : {};

    const productsPipeline = [
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(categoryId)
            }
        },

        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "productCategory",
                as: "products"
            }
        },

        // UNWIND: Flatten the products array for easier manipulation
        {
            $unwind: "$products"
        },
        {
            $project: {
                _id: "$products._id",
                productTitle: "$products.productTitle",
                productDescription: "$products.productDescription",
                productPrice: "$products.productPrice",
                productThumbnail: "$products.productThumbnail",
                createdAt: "$products.createdAt",
                updatedAt: "$products.updatedAt"
            }
        },

        // SORTING
        {
            $sort: { [sortField]: order }
        },

        // PAGINATION
        {
            $skip: (pageNumber - 1) * pageSize
        },

        {
            $limit: pageSize
        }
    ];

    const products = await Category.aggregate(productsPipeline);

    if (products.length === 0) {
        throw new ApiError(404, "Category products not found");
    }

    const totalProducts = await Product.countDocuments({ productCategory: categoryId });
    const totalPages = Math.ceil(totalProducts / pageSize);

    const response = {
        success: true,
        count: products.length,
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        products,
    };

    return res.status(200).json(new ApiResponse(200, response, "Category products fetched successfully"));
});


const addProductToCategory = asyncHandler(async (req, res) => {
    const { productId, categoryId } = req.params;

    if (!productId.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id")
    }

    if (!categoryId.trim() || !isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id")
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product?.productCategory?.toString() === categoryId.toString()) {
        throw new ApiError(400, "Product already added to category");
    }

    product.productCategory = categoryId;
    await product.save();

    res.status(200).json(new ApiResponse(200, product, "Product added to category successfully"));

})


const removeProductFromCategory = asyncHandler(async (req, res) => {
    const { categoryId, productId } = req.params;

    if (!categoryId.trim() || !isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    if (!productId.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product?.productCategory?.toString() !== categoryId.toString()) {
        throw new ApiError(400, "Product is not associated with this category");
    }

    product.productCategory = null;
    await product.save();

    res.status(200).json(new ApiResponse(200, product, "Product removed from category successfully"));
});


export {
    getAllCategories,
    getAllParentCategories,
    getAllSubCategories,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryProducts,
    addProductToCategory,
    removeProductFromCategory,
};
