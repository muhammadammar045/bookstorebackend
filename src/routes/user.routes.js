import { Router } from "express";
import { changeCurrentPassword, deleteUser, getAllUsers, getUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateCoverImage, updateProfileImage, updateUser } from "../controller/user.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js";
const router = Router();

router
    .route("/login")
    .post(loginUser)
router
    .route("/register")
    .post(uploadOnMulter.fields(
        [
            { name: "profileImage", maxCount: 1 },
            { name: "coverImage", maxCount: 1 }
        ]
    ), registerUser)
router
    .route("/get-user/:userId")
    .get(isAuthenticated, getUser)
router
    .route("/update-user/:userId")
    .patch(isAuthenticated, updateUser)
router
    .route("/update-user-thumbnail/:userId")
    .patch(isAuthenticated, uploadOnMulter.single("profileImage"), updateProfileImage)
router
    .route("/update-user-cover-image/:userId")
    .patch(isAuthenticated, uploadOnMulter.single("coverImage"), updateCoverImage)
router
    .route("/delete-user/:userId")
    .delete(isAuthenticated, deleteUser)
router
    .route("/forgot-password")
    .post(changeCurrentPassword)
router
    .route("/refresh-access-token")
    .post(refreshAccessToken)
router
    .route("/get-all-users")
    .get(isAuthenticated, isAdmin, getAllUsers)
router
    .route("/logout")
    .post(isAuthenticated, logoutUser)

export default router;