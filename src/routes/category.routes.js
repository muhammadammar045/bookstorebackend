import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
import { addCategory, addProductToCategory, deleteCategory, getAllCategories, getAllParentCategories, getAllSubCategories, getCategory, getCategoryProducts, removeProductFromCategory, updateCategory } from "../controller/category.controller.js";

const router = Router();
router.use(isAuthenticated)

router
    .route("/get-all-categories")
    .get(getAllCategories)

router
    .route("/get-parent-categories")
    .get(getAllParentCategories)

router
    .route("/get-child-categories")
    .get(getAllSubCategories)

router
    .route("/get-category/:categoryId")
    .get(getCategory)

router
    .route("/get-category-products/:categoryId")
    .get(getCategoryProducts)

router
    .route("/add-product-to-category/:productId/:categoryId")
    .patch(addProductToCategory)

router
    .route("/delete-product-from-category/:productId/:categoryId")
    .patch(removeProductFromCategory)

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