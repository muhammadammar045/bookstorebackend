import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        categoryName: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },

    }
)

export const Category = mongoose.model("Category", categorySchema);