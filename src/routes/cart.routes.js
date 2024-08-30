import { Router } from 'express';

import { isAuthenticated } from '../middlewares/authentication.middleware.js';
import { addProductToCart, decrementCartItemQuantity, getUserCart, incrementCartItemQuantity, removeProductFromCart } from '../controller/cart.controller.js';

const router = Router();
router.use(isAuthenticated)


router
    .route('/add-product-to-cart/:productId')
    .patch(
        addProductToCart
    );
router
    .route('/get-user-cart')
    .get(
        getUserCart
    );
router
    .route('/remove-product-from-cart/:productId')
    .patch(
        removeProductFromCart
    );
router
    .route('/increment-product-in-cart/:productId')
    .patch(
        incrementCartItemQuantity
    );
router
    .route('/decrement-product-in-cart/:productId')
    .patch(
        decrementCartItemQuantity
    );

export default router