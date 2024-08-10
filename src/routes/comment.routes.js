import { Router } from "express";
import { isAuthenticated } from "../middlewares/authentication.middleware.js";
import { hasPermissions } from "../middlewares/permissions.js";
import { Comment } from "../models/comment.model.js";
import { addComment, deleteComment, getComment, getCommentsByProduct, updateComment } from "../controller/comment.controller.js";


const router = Router();
router.use(isAuthenticated);

router
    .route("/add-comment")
    .post(hasPermissions(["create"]), addComment);

router
    .route("/get-comments/:productId")
    .get(hasPermissions(["read"], Comment, "productId"), getCommentsByProduct);

router
    .route("/get-comment/:commentId")
    .get(hasPermissions(["read"], Comment, "commentId"), getComment);

router
    .route("/delete-comment/:commentId")
    .delete(hasPermissions(["delete"], Comment, "commentId"), deleteComment);

router
    .route("/update-comment/:commentId")
    .patch(hasPermissions(["update"], Comment, "commentId"), updateComment);

export default router;
