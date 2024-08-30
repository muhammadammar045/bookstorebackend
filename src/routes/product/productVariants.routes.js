import { Router } from "express";

import { ProductVariant } from "../../models/product/productVariant.model.js";
import { isAuthenticated } from "../../middlewares/authentication.middleware.js";
import { hasPermissions } from "../../middlewares/permissions.js";
import { createProductVariantSize, createProductVariant, createProductVariantColor, deleteProductVariantById, getProductVariantById, getProductVariantsByProduct, updateProductVariantById } from "../../controller/product/productVariants.controller.js";
import { uploadOnMulter } from "../../middlewares/multer.middleware.js";

const router = Router();

router.use(isAuthenticated);

router
    .route("/")
    .get((req, res) => {
        res.json({ message: "Welcome to the Authenticated Product Variant Management API!" });
    });

router
    .route("/add-product-variant/:productId")
    .post(uploadOnMulter.fields([
        { name: "productVariantImages", maxCount: 7 },
        { name: "productVariantThumbnail", maxCount: 1 }
    ]), hasPermissions(["create"]), createProductVariant);

router
    .route("/add-product-variant-color")
    .post(hasPermissions(["create"]), createProductVariantColor);
router
    .route("/add-product-variant-size")
    .post(hasPermissions(["create"]), createProductVariantSize);

router
    .route("/get-product-variant/:variantId")
    .get(hasPermissions(["read"], ProductVariant, "variantId"), getProductVariantById);

router
    .route("/update-variant/:variantId")
    .patch(hasPermissions(["update"], ProductVariant, "variantId"), updateProductVariantById);

router
    .route("/delete-variant/:variantId")
    .delete(hasPermissions(["delete"], ProductVariant, "variantId"), deleteProductVariantById);

router
    .route("/get-variants-by-product/:productId")
    .get(hasPermissions(["read"]), getProductVariantsByProduct);

export default router;
