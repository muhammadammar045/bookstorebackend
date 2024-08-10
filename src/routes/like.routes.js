import { Router } from 'express';
import { isAuthenticated } from '../middlewares/authentication.middleware.js';
import { getLikedProducts, toggleCommentLike, toggleProductLike } from '../controller/like.controller.js';


const router = Router();
router.use(isAuthenticated);

router
    .route('/toggle/p/:productId')
    .post(toggleProductLike);

router
    .route('/toggle/c/:commentId')
    .post(toggleCommentLike);

router
    .route('/videos')
    .get(getLikedProducts);

export default router;
