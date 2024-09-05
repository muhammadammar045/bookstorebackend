import express from 'express';
import { createStripePayment, stripeWebhookController } from '../controller/payment.controller.js';
import { isAuthenticated } from '../middlewares/authentication.middleware.js';

const router = express.Router();
router.use(isAuthenticated)

router.post('/create-stripe-payment/:orderId', createStripePayment);
router.post('/webhook', stripeWebhookController);


export default router;
