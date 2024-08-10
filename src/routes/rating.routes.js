import { Router } from "express";
import { isAuthenticated } from "../middlewares/authentication.middleware.js";
import { addOrUpdateRating, getProductAverageRating, getProductRatings } from "../controller/rating.controller.js";


const router = Router();
router.use(isAuthenticated);

router
    .route("/rate-product")
    .post(addOrUpdateRating);

router
    .route("/product/:productId/ratings")
    .get(getProductRatings);

router
    .route("/product/:productId/average-rating")
    .get(getProductAverageRating);

export default router;
