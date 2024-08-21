import { Router } from 'express';
import { isAuthenticated } from '../middlewares/authentication.middleware.js';
import { getLikedProducts, toggleProductLike, toggleReviewLike } from '../controller/like.controller.js';


const router = Router();
router.use(isAuthenticated);

router
    .route('/toggle/p/:productId')
    .post(toggleProductLike);

router
    .route('/toggle/r/:reviewId')
    .post(toggleReviewLike);

router
    .route('/liked-products')
    .get(getLikedProducts);

export default router;
