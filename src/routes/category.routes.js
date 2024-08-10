import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
import { addCategory, deleteCategory, getAllCategories, getCategory, updateCategory } from "../controller/category.controller.js";

const router = Router();
router.use(isAuthenticated)

router
    .route("/get-all-categories")
    .get(isAdmin, getAllCategories)

router
    .route("/get-category/:categoryId")
    .get(isAdmin, getCategory)

router
    .route("/add-category")
    .post(isAdmin, addCategory)

router
    .route("/update-category/:categoryId")
    .patch(isAdmin, updateCategory)

router
    .route("/delete-category/:categoryId")
    .delete(isAdmin, deleteCategory)



export default router