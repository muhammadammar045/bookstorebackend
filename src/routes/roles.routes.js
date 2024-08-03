import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.middleware.js";
import { addRole, assignRoleToUser, deleteRole, getAllRoles, updateRole, getRole } from "../controller/roles.controller.js";


const router = Router();
router.use(isAuthenticated)

router
    .route("/get-all-roles")
    .get(isAdmin, getAllRoles)

router
    .route("/get-role/:roleId")
    .get(isAdmin, getRole)

router
    .route("/add-role")
    .post(isAdmin, addRole)

router
    .route("/update-role/:roleId")
    .patch(isAdmin, updateRole)

router
    .route("/delete-role/:roleId")
    .delete(isAdmin, deleteRole)

router
    .route("/assign-role-to-user")
    .patch(isAdmin, assignRoleToUser)

export default router