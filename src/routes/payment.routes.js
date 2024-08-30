import express from 'express';
import { createStripePayment } from '../controller/payment.controller.js';

const router = express.Router();

router.post('/create-payment', createStripePayment);

export default router;
