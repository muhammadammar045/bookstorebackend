import { Router } from "express";
import { isAuthenticated } from "../middlewares/authentication.middleware.js";
import { cancelOrder, createOrder, getAllOrdersAdmin, getCurrentUserOrders, getOrder, updateOrderStatus } from "../controller/order.controller.js";

const router = Router();
router.use(isAuthenticated);

router
    .route("/create-order")
    .post(createOrder)
router
    .route("/get-order/:orderId")
    .get(getOrder)
router
    .route("/get-all-orders-admin")
    .get(getAllOrdersAdmin)
router
    .route("/get-current-user-orders")
    .get(getCurrentUserOrders)
router
    .route("/update-order-status/:orderId")
    .patch(updateOrderStatus)
router
    .route("/cancel-order/:orderId")
    .patch(cancelOrder)



export default router;