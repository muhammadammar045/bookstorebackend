import mongoose from "mongoose";
import { Role } from "../models/role.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.aggregate(
        [
            {
                $lookup: {
                    from: "permissions",
                    localField: "permissions",
                    foreignField: "_id",
                    as: "permissions"
                }
            },
            {
                $project: {
                    _id: 1,
                    roleName: 1,
                    permissions: {
                        $map: {
                            input: "$permissions",
                            as: "perm",
                            in: "$$perm.permissionName"
                        }
                    }
                }
            }

        ]
    );

    if (roles.length === 0) throw new ApiError(404, "No roles found");

    return res
        .status(200)
        .json(new ApiResponse(200, roles, "Roles retrieved successfully"));
});

const getRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params

    const role = await Role.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(roleId)
            }
        },
        {
            $lookup: {
                from: "permissions",
                localField: "permissions",
                foreignField: "_id",
                as: "permissions"
            }
        },
        {
            $project: {
                _id: 1,
                roleName: 1,
                permissions: {
                    $map: {
                        input: "$permissions",
                        as: "permission",
                        in: "$$permission.permissionName"
                    }
                },
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    if (!role) throw new ApiError(404, "Role not found");

    return res
        .status(200)
        .json(new ApiResponse(200, role[0], "Role retrieved successfully"));
})

const addRole = asyncHandler(async (req, res) => {
    const { roleName } = req.body;

    if (!roleName) throw new ApiError(400, "Please provide a valid role name");

    const existingRole = await Role.findOne({ roleName });

    if (existingRole) throw new ApiError(400, "Role already exists");

    const role = await Role.create({ roleName: roleName });

    return res
        .status(201)
        .json(new ApiResponse(201, role, "Role created successfully"));
});

const updateRole = asyncHandler(async (req, res) => {
    const { roleName } = req.body;
    const { roleId } = req.params;

    if (!roleName || typeof roleName !== 'string') throw new ApiError(400, "Please provide a valid role name");

    const role = await Role.findById(roleId);

    if (!role) throw new ApiError(404, "Role not found");

    role.roleName = roleName;
    const updatedRole = await role.save();

    return res
        .status(200)
        .json(new ApiResponse(200, updatedRole, "Role updated successfully"));
});

const deleteRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const role = await Role.findByIdAndDelete(roleId);

    if (!role) throw new ApiError(404, "Role not Deleted");


    return res
        .status(200)
        .json(new ApiResponse(200, role, "Role deleted successfully"));
});

const assignRoleToUser = asyncHandler(async (req, res) => {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
        throw new ApiError(400, "Please provide a valid user ID and role name");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const role = await Role.findOne({ roleName });
    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    user.role = role._id;

    await user.save();

    const updatedUserRole = await User.findById(user._id).populate("role");

    return res.status(200).json(
        new ApiResponse(200, updatedUserRole, "Role assigned successfully")
    );
});



export {
    getAllRoles,
    getRole,
    addRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
};
