import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
import { getDashboardStats } from "../controller/dashboard.controller.js";

const router = Router();
router.use(isAuthenticated)

router
    .route("/")
    .get((req, res) => {
        res.json({ message: "Welcome to the Authenticated Dashboard Management API!" })
    })

router.
    route("/get-dashboard-stats")
    .get(isAdmin, getDashboardStats)

export default router