import { Router } from "express";
import { deleteUser, getAllUsers, getUser, loginUser, logoutUser, registerUser, updateUser } from "../controller/user.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
const router = Router();

router
    .route("/login")
    .post(loginUser)
router
    .route("/register")
    .post(registerUser)
router
    .route("/get-user/:userId")
    .get(isAuthenticated, getUser)
router
    .route("/update-user/:userId")
    .patch(isAuthenticated, updateUser)
router
    .route("/delete-user/:userId")
    .delete(isAuthenticated, deleteUser)
router
    .route("/get-all-users")
    .get(isAuthenticated, isAdmin, getAllUsers)
router
    .route("/logout")
    .post(isAuthenticated, logoutUser)

export default router;