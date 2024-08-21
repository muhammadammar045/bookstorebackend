import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",

    },
    review: {
        type: Schema.Types.ObjectId,
        ref: "Review",

    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);
