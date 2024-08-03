import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
import { addPermission, assignPermissionsToRole, deletePermission, getAllPermissions, getPermission, updatePermission } from "../controller/permissions.controller.js";

const router = Router();
router.use(isAuthenticated)

router
    .route("/get-all-permissions")
    .get(isAdmin, getAllPermissions)

router
    .route("/get-permission/:permissionId")
    .get(isAdmin, getPermission)

router
    .route("/add-permission")
    .post(isAdmin, addPermission)

router
    .route("/update-permission/:permissionId")
    .patch(isAdmin, updatePermission)

router
    .route("/delete-permission/:permissionId")
    .delete(isAdmin, deletePermission)

router
    .route("/assign-permissions-to-role")
    .patch(isAdmin, assignPermissionsToRole)

export default router