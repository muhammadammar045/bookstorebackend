import { Permission } from "../models/permission.model.js";
import { Role } from "../models/role.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


const getAllPermissions = asyncHandler(async (req, res) => {
    const permissions = await Permission.find({});

    if (permissions.length === 0) {
        throw new ApiError(404, "No permissions found");
    }

    return res.status(200).json(new ApiResponse(200, permissions, "Permissions retrieved successfully"));
});


const getPermission = asyncHandler(async (req, res) => {
    const { permissionId } = req.params;

    const permission = await Permission.findById(permissionId);

    if (!permission) {
        throw new ApiError(404, "Permission not found");
    }

    return res.status(200).json(new ApiResponse(200, permission, "Permission retrieved successfully"));
})


const addPermission = asyncHandler(async (req, res) => {
    const { permissionName } = req.body;

    if (!permissionName) {
        throw new ApiError(400, "Please provide a valid permission name");
    }

    const existingPermission = await Permission.findOne({ permissionName });

    if (existingPermission) {
        throw new ApiError(400, "Permission already exists");
    }

    const permission = await Permission.create({ permissionName });

    return res.status(201).json(new ApiResponse(201, permission, "Permission created successfully"));
});


const updatePermission = asyncHandler(async (req, res) => {
    const { permissionName } = req.body;
    const { permissionId } = req.params;

    if (!permissionName || typeof permissionName !== 'string') {
        throw new ApiError(400, "Please provide a valid permission name");
    }

    const permission = await Permission.findById(permissionId);

    if (!permission) {
        throw new ApiError(404, "Permission not found");
    }

    permission.permissionName = permissionName;
    const updatedPermission = await permission.save();

    return res.status(200).json(new ApiResponse(200, updatedPermission, "Permission updated successfully"));
});


const deletePermission = asyncHandler(async (req, res) => {
    const { permissionId } = req.params;

    const permission = await Permission.findByIdAndDelete(permissionId);

    if (!permission) {
        throw new ApiError(404, "Permission not Deleted");
    }


    return res.status(200).json(new ApiResponse(200, permission, "Permission deleted successfully"));
});

const assignPermissionsToRole = asyncHandler(async (req, res) => {
    const { roleId, permissionsName } = req.body;

    if (!roleId || !Array.isArray(permissionsName) || permissionsName.length === 0) {
        throw new ApiError(400, "Please provide role ID and an array of permission names");
    }

    const role = await Role.findById(roleId);
    if (!role) throw new ApiError(404, "Role not found");

    const permissions = await Permission.find({ permissionName: { $in: permissionsName } });
    if (permissions.length !== permissionsName.length) {
        throw new ApiError(404, "Some permissions not found");
    }

    role.permissions = permissions.map(permission => permission._id);
    await role.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, role, `Permissions assigned to role ${role.roleName} successfully`)
        );
});




export {
    getAllPermissions,
    getPermission,
    addPermission,
    updatePermission,
    deletePermission,
    assignPermissionsToRole
};
