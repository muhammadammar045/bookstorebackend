import { Category } from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ parentCategory: null });

    const result = await Promise.all(categories.map(async (category) => {
        const subcategories = await Category.find({ parentCategory: category._id });
        return { category, subcategories };
    }));

    if (result.length === 0) {
        throw new ApiError(404, "No categories found");
    }

    return res.status(200).json(new ApiResponse(200, result, "Categories retrieved successfully"));
});

const getCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId).populate('parentCategory');

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const subcategories = await Category.find({ parentCategory: categoryId });

    return res.status(200).json(new ApiResponse(200, { category, subcategories }, "Category retrieved successfully"));
});

const addCategory = asyncHandler(async (req, res) => {
    const { categoryName, parentCategoryId } = req.body;

    if (!categoryName) {
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
        parentCategory: parentCategoryId || null,
    });

    return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryName } = req.body;
    const { categoryId } = req.params;

    if (!categoryName || typeof categoryName !== 'string') {
        throw new ApiError(400, "Please provide a valid category name");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    category.categoryName = categoryName;
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

    return res.status(200).json(new ApiResponse(200, null, "Category and its subcategories deleted successfully"));
});

export {
    getAllCategories,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,
};
