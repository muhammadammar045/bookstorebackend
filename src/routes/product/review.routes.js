import { Router } from "express";
import { isAuthenticated } from "../../middlewares/authentication.middleware.js";
import { hasPermissions } from "../../middlewares/permissions.js";
import { createReview, deleteReview, getReviewById, getReviewsByProduct, updateReview } from "../../controller/product/review.controller.js";
import { Review } from "../../models/product/review.model.js";


const router = Router();
router.use(isAuthenticated);

router
    .route("/add-review/:productId")
    .post(hasPermissions(["create"]), createReview);

router
    .route("/get-product-reviews/:productId")
    .get(hasPermissions(["read"], Review, "productId"), getReviewsByProduct);

router
    .route("/get-review/:reviewId")
    .get(hasPermissions(["read"], Review, "reviewId"), getReviewById);

router
    .route("/delete-review/:reviewId")
    .delete(hasPermissions(["delete"], Review, "reviewId"), deleteReview);

router
    .route("/update-review/:reviewId")
    .patch(hasPermissions(["update"], Review, "reviewId"), updateReview);

export default router;
