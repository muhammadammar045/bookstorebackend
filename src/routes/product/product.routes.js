import { Router } from "express";

import { uploadOnMulter } from "../../middlewares/multer.middleware.js";
import { isAuthenticated } from "../../middlewares/authentication.middleware.js";
import { hasPermissions } from "../../middlewares/permissions.js";
import { Product } from "../../models/product/product.model.js";
import { addProduct, deleteProduct, getAllProducts, getAllProductsAdmin, getCurrentUserProducts, getProduct, updateProduct, updateProductThumbnail } from "../../controller/product/product.controller.js";

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
    route("/get-all-products-admin")
    .get(hasPermissions(["read"]), getAllProductsAdmin)

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
    .post(uploadOnMulter.fields([
        { name: "productImages", maxCount: 7 },
        { name: "productThumbnail", maxCount: 1 }
    ]), hasPermissions(["create"]), addProduct)

router
    .route("/update-product-thumbnail/:productId")
    .patch(uploadOnMulter.single("productThumbnail"), hasPermissions(["update"], Product, "productId"), updateProductThumbnail)


export default router