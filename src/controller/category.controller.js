import { Category } from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const getAllCategories = asyncHandler(async (req, res) => {
    const result = await Category.aggregate([
        // {
        //     $match: {
        //         parentCategory: null
        //     }
        // },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "parentCategory",
                as: "subcategories"
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "parentCategory",
                foreignField: "_id",
                as: "parentCategoryInfo"
            }
        },
        {
            $unwind: {
                path: "$parentCategoryInfo",
                preserveNullAndEmptyArrays: true // If there's no parent category, keep the null value
            }
        },
        {
            $project: {
                _id: 1,
                categoryName: 1,
                description: 1,
                parentCategory: 1,
                parentCategoryName: "$parentCategoryInfo.categoryName",
                subcategories: {
                    _id: 1,
                    categoryName: 1,
                    description: 1,
                    products: 1
                }
            }
        }
    ]);

    // console.log(result);

    if (result.length === 0) {
        throw new ApiError(404, "No categories found");
    }

    return res.status(200).json(new ApiResponse(200, result, "Categories retrieved successfully"));
});

const getCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const result = await Category.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(categoryId)
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "parentCategory",
                as: "subcategories"
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "parentCategory",
                foreignField: "_id",
                as: "parentCategoryInfo"
            }
        },
        {
            $unwind: {
                path: "$parentCategoryInfo",
                preserveNullAndEmptyArrays: true // If there's no parent category, keep the null value
            }
        },
        {
            $project: {
                _id: 1,
                categoryName: 1,
                description: 1,
                parentCategory: 1,
                parentCategoryName: "$parentCategoryInfo.categoryName",
                subcategories: {
                    _id: 1,
                    categoryName: 1,
                    description: 1,
                    products: 1
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, result[0], "Category retrieved successfully"));
});

const addCategory = asyncHandler(async (req, res) => {
    const { categoryName, description, parentCategoryId } = req.body;

    if (!categoryName && !description) {
        throw new ApiError(400, "Please provide a valid category name");
    }

    if (parentCategoryId && !mongoose.Types.ObjectId.isValid(parentCategoryId)) {
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

    return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryName, description, parentCategoryName } = req.body;
    const { categoryId } = req.params;

    if (!categoryName || typeof categoryName !== 'string' || !description || typeof description !== 'string') {
        throw new ApiError(400, "Please provide valid category name and description");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    if (parentCategoryName) {
        const parent = await Category.findOne({ categoryName: parentCategoryName });

        if (!parent) {
            throw new ApiError(404, "Parent category not found");
        }

        if (parent._id.equals(category._id)) {
            throw new ApiError(400, "A category cannot be its own parent");
        }

        category.parentCategory = parent._id;
    }

    // Update category details
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

    // Delete all subcategories
    await Category.deleteMany({ parentCategory: categoryId });

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json(new ApiResponse(200, category, "Category and its subcategories deleted successfully"));
});

export {
    getAllCategories,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,
};
