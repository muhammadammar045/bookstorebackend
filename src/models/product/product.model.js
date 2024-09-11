import mongoose, { Schema } from "mongoose";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const productSchema = new Schema(
    {
        productTitle: {
            type: String,
            required: [true, 'Product title is required']
        },
        productDescription: {
            type: String,
            required: [true, 'Product description is required'],
        },
        productCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null
        },
        productReviews: {
            type: Schema.Types.ObjectId,
            ref: 'Review',
            default: null
        },
        productPrice: {
            type: mongoose.Types.Decimal128,
            required: [true, 'Product price is required'],
            min: [0, 'Product price must be a positive number']
        },
        productThumbnail: {
            type: String,
            required: [true, 'Product thumbnail is required']
        },
        productImages: {
            type: [String],
            default: [
                'https://via.placeholder.com/150?text=Image+1',
                'https://via.placeholder.com/150?text=Image+2',
                'https://via.placeholder.com/150?text=Image+3',
                'https://via.placeholder.com/150?text=Image+4'
            ],
            validate: {
                validator: function (v) {
                    return v.length <= 7;
                },
                message: 'You can upload a maximum of 7 images'
            }
        },
        productQuantity: {
            type: Number,
            required: [true, 'Product quantity is required'],
            min: [0, 'Product quantity must be a non-negative number']
        },
        productOwner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Product owner is required']
        },


    },
    {
        timestamps: true
    }
)
productSchema.plugin(aggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
