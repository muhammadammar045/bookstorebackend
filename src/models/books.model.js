import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema(
    {
        title: {
            type: String,
            req: true
        },
        description: {
            type: String,
            req: true,
        },
        price: {
            type: Number,
            req: true
        },
        category: {
            type: String,
            // req: true,
            default: "general"
        },
        thumbnail: {
            type: String,
            req: true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
)

export const Books = mongoose.model("Book", bookSchema)

