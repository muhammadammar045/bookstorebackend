import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../utils/Cloudinary.js";

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
    const { firstName, lastName, userName, email, password, address } = req.body;

    if ([firstName, lastName, userName, email, password, address].some((field) => !field || field === "")) {
        throw new ApiError(400, "Missing required fields");
    }

    const existedUser = await User.findOne(
        {
            $or: [
                {
                    userName
                },
                {
                    email
                }
            ]
        });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const profileImagePath = req.files?.profileImage[0]?.path;
    if (!profileImagePath) {
        throw new ApiError(400, "Profile image is required")
    };
    const profileImage = await uploadImageToCloudinary(profileImagePath);

    if (!profileImage || !profileImage.url) {
        throw new ApiError(500, "Failed to upload profile image")
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const coverImage = await uploadImageToCloudinary(coverImageLocalPath);


    const user = new User(
        {
            firstName,
            lastName,
            userName,
            email,
            password,
            address,
            profileImage: profileImage.url,
            coverImage: coverImage?.url || ""
        }
    );
    await user.save();

    const registeredUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, registeredUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if (!password || (!email && !userName)) {
        throw new ApiError(400, "Missing required fields");
    }

    const user = await User.findOne({ $or: [{ email }, { userName }] });
    const userId = user?._id
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const comparedPassword = await user.ComparePassword(password);
    if (!comparedPassword) {
        throw new ApiError(401, "Invalid credentials");
    }

    const loggedUser = await User.aggregate([
        {
            $match: {
                _id: userId,
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
                firstName: 1,
                lastName: 1,
                fullName: {
                    $concat: ["$firstName", " ", "$lastName"]
                },
                email: 1,
                userName: 1,
                profileImage: 1,
                roleName: "$role.roleName",
                address: 1,
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
                    _id: mongoose.Types.ObjectId.createFromHexString(userId),
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
                    firstName: 1,
                    lastName: 1,
                    fullName: {
                        $concat: ["$firstName", " ", "$lastName"]
                    },
                    email: 1,
                    userName: 1,
                    profileImage: 1,
                    address: 1,
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

        ]
    )
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user[0], "User fetched successfully"));

});

const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { firstName, lastName, userName, email, address } = req.body;

    if ([firstName, lastName, userName, email].some(field => !field || !field.trim())) {
        throw new ApiError(400, "Invalid input");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                firstName,
                lastName,
                userName,
                email,
                address,
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    const aggregatedUser = await User.aggregate([
        {
            $match:
            {
                _id: updatedUser._id
            }
        },
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
                firstName: 1,
                lastName: 1,
                fullName: {
                    $concat: ["$firstName", " ", "$lastName"]
                },
                email: 1,
                userName: 1,
                profileImage: 1,
                address: 1,
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

    if (!aggregatedUser.length) {
        throw new ApiError(404, "User not found after update");
    }

    return res.status(200).json(new ApiResponse(200, aggregatedUser[0], "User updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId.trim() || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const profileImage = user.profileImage;
    const coverImage = user.coverImage;

    await deleteImageFromCloudinary(profileImage);
    await deleteImageFromCloudinary(coverImage);


    const deletedUser = await User
        .findByIdAndDelete(userId)
        .select("-password -refreshToken");

    if (!deletedUser) throw new ApiError(404, "User not deleted");

    return res.status(200).json(new ApiResponse(200, deletedUser, "User deleted successfully"));
})

const getAllUsers = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        q = "",
        sortField,
        sortOrder = "desc"
    } = req.query;

    // Ensure valid pagination values
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const query = q ? { lastName: new RegExp(q, 'i') } : {};
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const usersPipeline = [
        // FILTER PRODUCT
        {
            $match: query
        },
        // LOOKUP: Fetch role details for each user
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

        // LOOKUP: Fetch permissions for each role
        {
            $lookup: {
                from: "permissions",
                localField: "role.permissions",
                foreignField: "_id",
                as: "permissions"
            }
        },

        // PROJECT: Define the fields to return
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                fullName: {
                    $concat: ["$firstName", " ", "$lastName"]
                },
                email: 1,
                userName: 1,
                profileImage: 1,
                address: 1,
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
        },

        // SORTING
        {
            $sort: { [sortField]: order }
        },

        // PAGINATION: Skip and limit stages
        {
            $skip: (pageNumber - 1) * pageSize
        },
        {
            $limit: pageSize
        }
    ];

    // Count total documents for pagination metadata
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / pageSize);

    // Execute the aggregation pipeline
    const users = await User.aggregate(usersPipeline);

    if (users.length === 0) throw new ApiError(404, "No users found");

    // Prepare the response with pagination metadata
    const response = {
        success: true,
        count: users.length,
        totalUsers,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        users,
    };

    return res.status(200).json(new ApiResponse(200, response, "Users fetched successfully with pagination"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const { accessToken, newRefreshToken } = generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token refreshed successfully"))
    } catch (error) {
        throw new ApiError(400, "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Please provide old and new password")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const updateProfileImage = asyncHandler(async (req, res) => {
    const profilePath = req.file?.path

    if (!profilePath) {
        throw new ApiError(400, "Please upload a file")
    }

    const user = await User.findById(req.user?.id)

    const userProfileImage = user.profileImage

    await deleteImageFromCloudinary(userProfileImage)


    const uploadOnCloudinary = await uploadImageToCloudinary(profilePath)

    if (!uploadOnCloudinary.url) {
        throw new ApiError(500, "Could not upload image to cloudinary")
    }
    const updatedUserWithNewProfile = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                profileImage: uploadOnCloudinary?.url
            }
        },
        {
            new: true,
        }
    )
    if (!updatedUserWithNewProfile) {
        throw new ApiError(401, "Could not update user profile image")
    }

    const updatedUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Profile image updated successfully")
        )
})

const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please provide a cover Image")
    }

    const user = await User.findById(req.user?.id)

    const userCoverImage = user.coverImage

    await deleteImageFromCloudinary(userCoverImage)


    const coverImage = await uploadImageToCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Could not upload cover Image on cloudinary")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage?.url
            },
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, updatedUser, "Cover Image updated successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    getAllUsers,
    deleteUser,
    updateUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateProfileImage,
    updateCoverImage,


};
