import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            // req: true,
            default: "general"
        },
        thumbnail: {
            type: String,
            required: true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required']
        }
    },
    {
        timestamps: true
    }
)

export const Product = mongoose.model("Product", productSchema)

