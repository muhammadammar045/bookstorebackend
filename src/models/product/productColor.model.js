import mongoose, { Schema } from "mongoose";

const productColorSchema = new Schema(
    {
        productColorName: {
            type: String,
            required: true,
            unique: true,
        },
        productColorCode: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

export const ProductColor = mongoose.model("ProductColor", productColorSchema);
