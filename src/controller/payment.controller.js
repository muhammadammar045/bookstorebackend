import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import stripe from "../utils/stripe.js";
import { Order } from "../models/order.model.js";

const createStripePayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: order.orderItems
                .map(
                    item => (
                        {
                            price_data:
                            {
                                currency: 'pkr',
                                product_data:
                                {
                                    name: item.product.productTitle,
                                },
                                unit_amount: item.price * 100,
                            },
                            quantity: item.quantity,

                        })),
            mode: 'payment',
            success_url: `https://www.google.com`,
            cancel_url: `https://www.youtube.com`,
            metadata: {
                order_id: order._id.toString(),
            },
        });

        // Return the session URL to the client
        return res.status(200).json(new ApiResponse(200, { url: session.url }, "Payment session created successfully"));
    } catch (error) {
        console.error("Stripe payment error:", error);
        throw new ApiError(500, "Error creating payment session");
    }
});

export {
    createStripePayment
}
