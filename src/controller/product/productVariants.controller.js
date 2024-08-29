import { isValidObjectId } from "mongoose";
import { Product } from "../../models/product/product.model.js";
import { ProductColor } from "../../models/product/productColor.model.js";
import { ProductSize } from "../../models/product/productSize.model.js";
import { ProductVariant } from "../../models/product/productVariant.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary } from "../../utils/Cloudinary.js";

export const createProductVariant = asyncHandler(async (req, res) => {
    const { productVariantQuantity, productVariantPrice } = req.body;
    const { productId } = req.params;

    if ([productVariantQuantity, productVariantPrice].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const thumbnailPath = req.files?.productVariantThumbnail?.[0]?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail path not found in request");
    }

    const uploadedThumbnail = await uploadImageToCloudinary(thumbnailPath);
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
    }

    const imagePaths = req.files?.productVariantImages?.map(file => file.path);
    let uploadedImages = [];

    if (imagePaths && imagePaths.length > 0) {
        uploadedImages = await uploadMultipleImagesToCloudinary(imagePaths);

        if (!uploadedImages || uploadedImages.some(img => !img.url)) {
            throw new ApiError(400, "Failed to upload one or more images to Cloudinary");
        }
    }

    const newVariant = await ProductVariant.create({
        productVariantThumbnail: uploadedThumbnail?.url,
        productVariantImages: uploadedImages.map(img => img.url),
        productVariantQuantity,
        productVariantPrice,
        product: product._id
    });

    return res.status(201).json(new ApiResponse(201, newVariant, "Product Variant created successfully"));
});


export const createProductVariantColor = asyncHandler(async (req, res) => {
    const { productColorName, productColorCode } = req.body;

    if (!productColorName || !productColorCode) {
        throw new ApiError(400, "All fields are required");
    }

    const newColor = await ProductColor.create({
        productColorName,
        productColorCode
    })

    if (!newColor) {
        throw new ApiError(400, "Product Color not created");
    }

    return res.status(201).json(new ApiResponse(201, newColor, "Product Color created successfully"))

})


export const createProductVariantSize = asyncHandler(async (req, res) => {
    const { productSizeName, productSizeCode } = req.body;

    if (!productSizeName || !productSizeCode) {
        throw new ApiError(400, "All fields are required");
    }

    const newSize = await ProductSize.create({
        productSizeName,
        productSizeCode
    })

    if (!newSize) {
        throw new ApiError(400, "Product Size not created")
    }

    return res.status(201).json(new ApiResponse(201, newSize, "Product Size created successfully"))
})


export const getProductVariantById = asyncHandler(async (req, res) => {
    const { variantId } = req.params;

    if (!variantId.trim() || !isValidObjectId(variantId)) {
        throw new ApiError(400, "Invalid Product Variant ID");
    }

    const variant = await ProductVariant.findById(variantId)
        .populate("productVariantSize")
        .populate("productVariantColor")
        .populate("product");

    if (!variant) {
        throw new ApiError(404, "Product Variant not found");
    }

    return res.status(200).json(new ApiResponse(200, variant, "Product Variant fetched successfully"));
});


export const updateProductVariantById = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const { productVariantQuantity, productVariantPrice } = req.body;

    if (!variantId.trim() || !isValidObjectId(variantId)) {
        throw new ApiError(400, "Invalid Product Variant ID");
    }

    const updatedVariant = await ProductVariant.findByIdAndUpdate(
        variantId,
        {
            productVariantQuantity,
            productVariantPrice
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedVariant) {
        throw new ApiError(404, "Product Variant not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedVariant, "Product Variant updated successfully"));
});


export const deleteProductVariantById = asyncHandler(async (req, res) => {
    const { variantId } = req.params;

    if (!variantId.trim() || !isValidObjectId(variantId)) {
        throw new ApiError(400, "Invalid Product Variant ID");
    }

    const deletedVariant = await ProductVariant.findByIdAndDelete(variantId);

    if (!deletedVariant) {
        throw new ApiError(404, "Product Variant not found");
    }

    return res.status(200).json(new ApiResponse(200, deletedVariant, "Product Variant deleted successfully"));
});


export const getProductVariantsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId.trim() || !isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product ID");
    }

    const variants = await ProductVariant.find
        (
            {
                product: productId
            }
        )
        .populate("productVariantSize")
        .populate("productVariantColor");

    return res.status(200).json(new ApiResponse(200, variants, "Product Variants fetched successfully"));
});
