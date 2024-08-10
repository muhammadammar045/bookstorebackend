import { Router } from "express";
import { addProduct, deleteProduct, getAllProducts, getProduct, getCurrentUserProducts, updateProduct, updateProductThumbnail } from "../controller/product.controller.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js";
import { Product } from "../models/product.model.js";
import { isAuthenticated } from "../middlewares/authentication.middleware.js";
import { hasPermissions } from "../middlewares/permissions.js";

const router = Router()
router.use(isAuthenticated)

router
    .route("/")
    .get((req, res) => {
        res.json({ message: "Welcome to the Authenticated Product Management API!" })
    })

router.
    route("/get-all-products")
    .get(hasPermissions(["read"]), getAllProducts)

router.
    route("/get-current-user-products")
    .get(hasPermissions(["read"]), getCurrentUserProducts)

router
    .route("/get-product/:productId")
    .get(hasPermissions(["read"], Product, "productId"), getProduct)

router
    .route("/delete-product/:productId")
    .delete(hasPermissions(["delete"], Product, "productId"), deleteProduct)

router
    .route("/update-product/:productId")
    .patch(hasPermissions(["update"], Product, "productId"), updateProduct)

router
    .route("/add-product")
    .post(uploadOnMulter.single("thumbnail"), hasPermissions(["create"]), addProduct)

router
    .route("/update-product-thumbnail/:productId")
    .patch(uploadOnMulter.single("thumbnail"), hasPermissions(["update"], Product, "productId"), updateProductThumbnail)


export default router