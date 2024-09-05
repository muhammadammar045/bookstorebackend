import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


const createOrder = asyncHandler(async (req, res) => {
    const { fullAddress, street, city, postalCode, phone } = req.body

    if ([fullAddress, city, phone].some((item) => !item || item === "")) {
        throw new ApiError(400, "Please fill all the fields")
    }

    const cart = await Cart
        .findOne(
            {
                cartOwner: req.user._id
            }
        )
        .populate('cartItems.product');

    if (!cart || cart.cartItems.length === 0) {
        throw new ApiError(400, "Your cart is empty");
    }

    const totalPrice = cart.cartItems.reduce((total, item) => {
        return total + (item.quantity * item.product.productPrice);
    }, 0);

    const order = await Order.create(
        {
            user: req.user._id,
            orderItems: cart.cartItems.map(item => (
                {
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.productPrice
                }
            )),
            shippingAddress: {
                fullAddress,
                street,
                city,
                postalCode,
                phone
            },
            totalPrice
        })

    await order.save();
    cart.cartItems = [];
    await cart.save();

    return res.status(200).json(new ApiResponse(200, order, "Order created successfully"));

});


const getCurrentUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).populate("orderItems.product");

    if (!orders || orders.length === 0) {
        throw new ApiError(404, "No orders found for this user");
    }

    return res.status(200).json(new ApiResponse(200, orders, "User orders retrieved successfully"));
});


const getOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to view this order");
    }

    return res.status(200).json(new ApiResponse(200, order, "Order retrieved successfully"));
});


const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});


const getAllOrdersAdmin = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate("orderItems.product");

    if (!orders || orders.length === 0) {
        throw new ApiError(404, "No orders found");
    }

    return res.status(200).json(new ApiResponse(200, orders, "All orders retrieved successfully"));
});


const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to cancel this order");
    }

    if (order.orderStatus !== 'Processing') {
        throw new ApiError(400, "Only orders in 'Processing' status can be cancelled");
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    let cart = await Cart.findOne({ cartOwner: req.user._id });

    if (!cart) {
        cart = new Cart({ cartOwner: req.user._id });
    }

    order.orderItems.forEach(item => {
        const existingItem = cart.cartItems.find(cartItem => cartItem.product.toString() === item.product._id.toString());
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            cart.cartItems.push(
                {
                    product: item.product._id,
                    quantity: item.quantity
                }
            );
        }
    });

    await cart.save();

    return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
});

export {
    createOrder,
    getOrder,
    getCurrentUserOrders,
    updateOrderStatus,
    getAllOrdersAdmin,
    cancelOrder
};
