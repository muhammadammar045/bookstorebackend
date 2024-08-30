import mongoose, { Schema } from "mongoose";

const productVariantSchema = new Schema(
    {
        productVariantThumbnail: {
            type: String,
            required: [true, 'Product Variant thumbnail is required']
        },
        productVariantImages: {
            type: [String],
            default: [
                'https://via.placeholder.com/150?text=Image+5',
                'https://via.placeholder.com/150?text=Image+6',
                'https://via.placeholder.com/150?text=Image+7',
                'https://via.placeholder.com/150?text=Image+8'
            ],
            validate: {
                validator: function (v) {
                    return v.length <= 7;
                },
                message: 'You can upload a maximum of 7 Variant images'
            }
        },
        productVariantSize: {
            type: Schema.Types.ObjectId,
            ref: "ProductSize",
            default: null
        },
        productVariantColor: {
            type: Schema.Types.ObjectId,
            ref: "ProductColor",
            default: null
        },
        productVariantQuantity: {
            type: Number,
            required: function () {
                return !this.productVariants || this.productVariants.length === 0;
            },
            min: [0, 'Product quantity must be a non-negative number'],
        },
        productVariantPrice: {
            type: Number,
            required: function () {
                return !this.productVariants || this.productVariants.length === 0;
            },
            min: [0, 'Product price must be a positive number'],
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        }
    },
    {
        timestamps: true,
    }
)

export const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);