import { User } from "../models/user.model.js";
import { Permission } from "../models/permission.model.js";
import { Role } from "../models/role.model.js";
import { Category } from "../models/category.model.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Product } from "../models/product/product.model.js";

const getDashboardStats = asyncHandler(async (req, res) => {
    const [userStats, productStats, categoryStats, roleStats, permissionStats] = await Promise.all([
        User.aggregate([{ $count: "totalUsers" }]),
        Product.aggregate([{ $count: "totalProducts" }]),
        Category.aggregate([{ $count: "totalCategories" }]),
        Role.aggregate([{ $count: "totalRoles" }]),
        Permission.aggregate([{ $count: "totalPermissions" }])
    ]);

    const stats = {
        users: userStats[0]?.totalUsers || 0,
        products: productStats[0]?.totalProducts || 0,
        categories: categoryStats[0]?.totalCategories || 0,
        roles: roleStats[0]?.totalRoles || 0,
        permissions: permissionStats[0]?.totalPermissions || 0,
    };

    return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats retrieved successfully"));
});




export {
    getDashboardStats
}
