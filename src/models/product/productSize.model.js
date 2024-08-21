import mongoose, { Schema } from "mongoose";

const productSizeSchema = new Schema(
    {
        productSizeName: {
            type: String,
            required: true,
            unique: true,
        },
        productSizeCode: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

export const ProductSize = mongoose.model("ProductSize", productSizeSchema);
