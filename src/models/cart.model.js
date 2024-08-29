import mongoose, { Schema } from "mongoose";

const CartItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }
);

const CartSchema = new Schema(
    {
        cartOwner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cartItems: {
            type: [CartItemSchema],
            default: [] // Ensure cartItems is initialized as an empty array
        }
    },
    {
        timestamps: true
    }
);

export const Cart = mongoose.model("Cart", CartSchema);
