import { Role } from "../models/role.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({});

    if (roles.length === 0) throw new ApiError(404, "No roles found");

    return res
        .status(200)
        .json(new ApiResponse(200, roles, "Roles retrieved successfully"));
});

const addRole = asyncHandler(async (req, res) => {
    const { roleName } = req.body;

    if (!roleName || typeof roleName !== 'string') throw new ApiError(400, "Please provide a valid role name");

    const existingRole = await Role.findOne({ roleName });

    if (existingRole) throw new ApiError(400, "Role already exists");

    const role = await Role.create({ roleName: roleName });

    return res
        .status(201)
        .json(new ApiResponse(201, role, "Role created successfully"));
});

const updateRole = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const { roleId } = req.params;

    if (!name || typeof name !== 'string') throw new ApiError(400, "Please provide a valid role name");

    const role = await Role.findById(roleId);

    if (!role) throw new ApiError(404, "Role not found");

    role.roleName = name;
    const updatedRole = await role.save();

    return res
        .status(200)
        .json(new ApiResponse(200, updatedRole, "Role updated successfully"));
});

const deleteRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const role = await Role.findById(roleId);

    if (!role) throw new ApiError(404, "Role not found");

    await role.remove();

    return res
        .status(200)
        .json(new ApiResponse(200, role, "Role deleted successfully"));
});

const assignRoleToUser = asyncHandler(async (req, res) => {
    const { userId, roleId } = req.params;

    if (!userId || !roleId) throw new ApiError(400, "Please provide a valid user and role id");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const role = await Role.findById(roleId);
    if (!role) throw new ApiError(404, "Role not found");

    user.role = role._id;

    const roleAssigned = await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, roleAssigned, "Role assigned successfully")
        );
});


export {
    getAllRoles,
    addRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
};
