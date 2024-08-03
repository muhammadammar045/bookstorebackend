import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure cookies only in production
    sameSite: 'strict' // Prevent CSRF attacks
};

const generateTokens = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.AccessToken();
    const refreshToken = user.RefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, password } = req.body;

    if ([fullname, email, password].some((field) => !field || field === "")) {
        throw new ApiError(400, "Missing required fields");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(409, "User already exists");

    const user = new User({ fullname, email, password });
    await user.save();

    const registerUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(201).json(
        new ApiResponse(201, registerUser, "User registered successfully")
    );


});

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) throw new ApiError(400, "Missing required fields");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const userId = user._id;

    const comparedPassword = await user.ComparePassword(password);
    if (!comparedPassword) throw new ApiError(401, "Invalid credentials");

    // const loggedUser = await User
    //     .findById(user._id)
    //     .populate({
    //         path: "role",
    //         populate: {
    //             path: "permissions",
    //         }
    //     })
    //     .select("-password -refreshToken");

    const loggedUser = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "role",
                    foreignField: "_id",
                    as: "role"
                }
            },
            {
                $unwind: "$role"
            },
            {
                $lookup: {
                    from: "permissions",
                    localField: "role.permissions",
                    foreignField: "_id",
                    as: "permissions"
                }
            },

            {
                $project: {
                    _id: 1,
                    fullname: 1,
                    email: 1,
                    profileImage: 1,
                    roleName: "$role.roleName",
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
    )

    const { accessToken, refreshToken } = await generateTokens(user._id);

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { user: loggedUser[0], accessToken, refreshToken }, "User logged in successfully")
        );

});

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "User logged out successfully"));



})

const getUser = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "role",
                    foreignField: "_id",
                    as: "role"
                }
            },
            {
                $unwind: "$role"
            },
            {
                $lookup: {
                    from: "permissions",
                    localField: "role.permissions",
                    foreignField: "_id",
                    as: "permissions"
                }
            },

            {
                $project: {
                    _id: 1,
                    fullname: 1,
                    email: 1,
                    profileImage: 1,
                    roleName: "$role.roleName",
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
    )
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user[0], "User fetched successfully"));

});

const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { fullname, email } = req.body;

    // Validate input
    if ([fullname, email].some(field => !field || !field.trim())) {
        throw new ApiError(400, "Invalid input");
    }

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                fullname,
                email,
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    // Aggregate to get role and permissions
    const aggregatedUser = await User.aggregate([
        { $match: { _id: updatedUser._id } },
        {
            $lookup: {
                from: "roles",
                localField: "role",
                foreignField: "_id",
                as: "role"
            },
        },
        { $unwind: "$role" },
        {
            $lookup: {
                from: "permissions",
                localField: "role.permissions",
                foreignField: "_id",
                as: "permissions"
            }
        },
        {
            $project: {
                _id: 1,
                fullname: 1,
                email: 1,
                roleName: "$role.roleName",
                createdAt: 1,
                updatedAt: 1,
                permissions: {
                    $map: {
                        input: "$permissions",
                        as: "permission",
                        in: "$$permission.permissionName"
                    }
                }
            }
        }
    ]);

    if (!aggregatedUser.length) {
        throw new ApiError(404, "User not found after update");
    }

    return res.status(200).json(new ApiResponse(200, aggregatedUser[0], "User updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const deletedUser = await User.findByIdAndDelete(userId).select("-password -refreshToken");
    if (!deletedUser) throw new ApiError(404, "User not deleted");

    return res.status(200).json(new ApiResponse(200, deletedUser, "User deleted successfully"));
})

const getAllUsers = asyncHandler(async (req, res) => {

    const users = await User.aggregate([
        {
            $lookup: {
                from: "roles",
                localField: "role",
                foreignField: "_id",
                as: "role"
            }
        },
        {
            $unwind: "$role"
        },
        {
            $lookup: {
                from: "permissions",
                localField: "role.permissions",
                foreignField: "_id",
                as: "permissions"
            }
        },

        {
            $project: {
                _id: 1,
                fullname: 1,
                email: 1,
                profileImage: 1,
                roleName: "$role.roleName",
                createdAt: 1,
                updatedAt: 1,
                permissions: {
                    $map: {
                        input: "$permissions",
                        as: "perm",
                        in: "$$perm.permissionName"
                    }
                }
            }
        }
    ]);

    if (users.length === 0) throw new ApiError(404, "No users found");

    return res.status(200).json(new ApiResponse(200, users, "User fetched successfully"));

});

export {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    getAllUsers,
    deleteUser,
    updateUser,

};
