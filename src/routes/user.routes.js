import { Router } from "express";
import { getAllUsers, getUser, loginUser, logoutUser, registerUser } from "../controller/user.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
const router = Router();

router
    .route("/login")
    .post(loginUser)
router
    .route("/register")
    .post(registerUser)
router
    .route("/get-user")
    .get(isAuthenticated, getUser)
router
    .route("/get-all-users")
    .get(isAuthenticated, isAdmin, getAllUsers)
router
    .route("/logout")
    .post(isAuthenticated, logoutUser)

export default router;