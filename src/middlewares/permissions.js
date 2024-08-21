import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const hasPermissions = (requiredPermissions, Model, paramsIdName) => asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const resourceId = req.params[paramsIdName];

    // Initialize role flags
    req.role = {
        isAdmin: false,
        isEditor: false,
        isOwner: false,
    };

    const user = await User.findById(userId).populate({
        path: 'role',
        populate: {
            path: 'permissions',
            model: 'Permission'
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const userRole = user.role;
    const userPermissions = userRole.permissions.map(permission => permission.permissionName);

    // Check if the user is an admin
    if (userRole.roleName === 'admin') {
        req.role.isAdmin = true;
        return next();
    }

    // Check if the user is an editor
    if (userRole.roleName === 'editor') {
        req.role.isEditor = true;
        return next();
    }

    // Handle resource and ownership permissions
    if (Model && resourceId) {
        const resource = await Model.findById(resourceId);
        if (!resource) {
            throw new ApiError(404, "Resource not found");
        }

        req.role.isOwner = resource.productOwner.toString() === userId.toString();

        // Check permissions based on ownership and user permissions
        const permissions = {
            read: userPermissions.includes('read') || req.role.isOwner,
            create: userPermissions.includes('create') || req.role.isOwner,
            update: userPermissions.includes('update') || req.role.isOwner,
            delete: userPermissions.includes('delete') || req.role.isOwner
        };

        const hasPermission = requiredPermissions.every(permission => permissions[permission]);

        if (!hasPermission) {
            throw new ApiError(403, "You do not have permission to perform this action");
        }
    }

    next();
});
