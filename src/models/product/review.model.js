import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
    {
        reviewTitle: {
            type: String,
            required: [true, 'Review title is required']
        },
        reviewBody: {
            type: String,
            required: [true, 'Review body is required']
        },
        reviewRating: {
            type: Number,
            required: [true, 'Review rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5']
        },
        reviewAuthor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required']
        },
        reviewProduct: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required']
        },
    },
    {
        timestamps: true
    }
);

export const Review = mongoose.model("Review", reviewSchema);
