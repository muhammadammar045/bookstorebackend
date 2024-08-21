import { Product } from "../../models/product/product.model.js";
import { ProductColor } from "../../models/product/productColor.model.js";
import { ProductSize } from "../../models/product/productSize.model.js";
import { ProductVariant } from "../../models/product/productVariant.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { uploadImageToCloudinary } from "../../utils/Cloudinary.js";

// Create a new Product Variant
export const createProductVariant = asyncHandler(async (req, res) => {
    const { productVariantSize, productVariantColor, productVariantQuantity, productVariantPrice, productId } = req.body;

    if (!productVariantSize || !productVariantColor || !productVariantQuantity || !productVariantPrice || !productId) {
        throw new ApiError(400, "All fields are required");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Handle thumbnail upload
    const thumbnailPath = req?.file?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail path not found in request");
    }

    const uploadedThumbnail = await uploadImageToCloudinary(thumbnailPath);
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
    }

    const newVariant = await ProductVariant.create({
        productVariantThumbnail: uploadedThumbnail?.url,
        productVariantSize,
        productVariantColor,
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

// Get a specific Product Variant by ID
export const getProductVariantById = asyncHandler(async (req, res) => {
    const { variantId } = req.params;

    if (!variantId || !mongoose.isValidObjectId(variantId)) {
        throw new ApiError(400, "Invalid Product Variant ID");
    }

    const variant = await ProductVariant.findById(variantId)
        .populate("productSize")
        .populate("productColor")
        .populate("product");

    if (!variant) {
        throw new ApiError(404, "Product Variant not found");
    }

    return res.status(200).json(new ApiResponse(200, variant, "Product Variant fetched successfully"));
});

// Update a Product Variant by ID
export const updateProductVariantById = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const { productSize, productColor, productVariantQuantity, productVariantPrice } = req.body;

    if (!variantId || !mongoose.isValidObjectId(variantId)) {
        throw new ApiError(400, "Invalid Product Variant ID");
    }

    const updatedVariant = await ProductVariant.findByIdAndUpdate(
        variantId,
        { productSize, productColor, productVariantQuantity, productVariantPrice },
        { new: true, runValidators: true }
    );

    if (!updatedVariant) {
        throw new ApiError(404, "Product Variant not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedVariant, "Product Variant updated successfully"));
});

// Delete a Product Variant by ID
export const deleteProductVariantById = asyncHandler(async (req, res) => {
    const { variantId } = req.params;

    if (!variantId || !mongoose.isValidObjectId(variantId)) {
        throw new ApiError(400, "Invalid Product Variant ID");
    }

    const deletedVariant = await ProductVariant.findByIdAndDelete(variantId);

    if (!deletedVariant) {
        throw new ApiError(404, "Product Variant not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "Product Variant deleted successfully"));
});

// Get all Product Variants for a specific product
export const getProductVariantsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product ID");
    }

    const variants = await ProductVariant.find({ product: productId })
        .populate("productSize")
        .populate("productColor");

    return res.status(200).json(new ApiResponse(200, variants, "Product Variants fetched successfully"));
});
