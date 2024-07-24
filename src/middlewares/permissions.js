import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const hasPermissions = (requiredPermissions, Model, paramsIdName) => asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const resourceId = req.params[paramsIdName];

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

    if (userRole.roleName === 'admin') {
        // console.log('User is admin, granting access');
        return next();
    }

    if (Model && resourceId) {
        const resource = await Model.findById(resourceId);
        if (!resource) {
            throw new ApiError(404, "Resource not found");
        }

        const isOwner = resource.author.toString() === userId.toString();

        // Check permissions based on ownership and user permissions
        const permissions = {
            read: userPermissions.includes('read') || isOwner,
            create: userPermissions.includes('create') || isOwner,
            update: userPermissions.includes('update') || isOwner,
            delete: userPermissions.includes('delete') || isOwner
        };

        const hasPermission = requiredPermissions.every(permission => permissions[permission]);

        if (!hasPermission) {
            throw new ApiError(403, "You do not have permission to perform this action");
        }
    }

    next();
});
