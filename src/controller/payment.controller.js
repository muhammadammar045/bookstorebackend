import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import stripe from "../utils/stripe.js";
import { Order } from "../models/order.model.js";

const createStripePayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: order.orderItems.map(
                item => ({
                    price_data: {
                        currency: 'pkr',
                        product_data: {
                            name: item.product.productTitle,
                            images: [item.product.productThumbnail],
                        },
                        unit_amount: Math.round(item.price * 100),
                    },
                    quantity: item.quantity,
                })
            ),
            mode: 'payment',
            success_url: `${req.protocol}://localhost:5173/payment-success`,
            cancel_url: `${req.protocol}://localhost:5173/payment-cancel`,
            metadata: {
                order_id: order._id.toString(),
            },
        });


        // Return the session URL to the client
        return res.status(200).json(new ApiResponse(200, { url: session.url, session: session }, "Payment session created successfully"));
    } catch (error) {
        console.error("Stripe payment error:", error.message);
        throw new ApiError(500, "Error creating payment session");
    }
});


const stripeWebhookController = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
        return res.status(500).send('Webhook secret not set');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`, err.stack);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const orderId = session.metadata.order_id;

            try {
                const order = await Order.findById(orderId);
                if (order) {

                    if (order.paymentStatus === 'Pending') {
                        order.paymentStatus = 'Paid';
                        await order.save();
                    }
                } else {
                    console.warn(`Order with ID ${orderId} not found`);
                }
            } catch (error) {
                console.error('Error updating order status:', error.message, error.stack);
                return res.status(500).send('Internal Server Error');
            }
            break;

        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
            break;

        case 'payment_intent.created':
            const createdPaymentIntent = event.data.object;
            console.log(`PaymentIntent ${createdPaymentIntent.id} created`);
            break;

        case 'charge.succeeded':
            const charge = event.data.object;
            console.log(`Charge ${charge.id} succeeded`);
            break;

        case 'charge.updated':
            const updatedCharge = event.data.object;
            console.log(`Charge ${updatedCharge.id} updated`);
            break;

        default:
            console.warn(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json(new ApiResponse(200, true, "Webhook received and processed successfully"));
});




export {
    createStripePayment,
    stripeWebhookController
};