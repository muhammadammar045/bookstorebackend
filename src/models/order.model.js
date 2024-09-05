import mongoose, { Schema } from 'mongoose';

const AddressSchema = new Schema(
    {
        fullAddress: {
            type: String,
            required: true
        },
        street: {
            type: String,
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
        },
    });

const OrderItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    });

const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [OrderItemSchema],
    shippingAddress: AddressSchema,
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery'],
        default: 'Cash on Delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing'
    },

    totalPrice: {
        type: Number,
        required: true
    },

});

export const Order = mongoose.model('Order', OrderSchema);
