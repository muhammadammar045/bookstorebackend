import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return next(new ApiError(401, "Authorization token is missing"));
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        } catch (err) {
            return next(new ApiError(401, "Invalid or expired token", err.message));
        }

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            return next(new ApiError(401, "User not found or unauthorized"));
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error during JWT verification:', error);
        next(new ApiError(500, "Internal server error"));
    }
}
)

export const isAdmin = async (req, res, next) => {
    const user = await User
        .findById(req.user._id)
        .populate('role');

    if (!user) throw new ApiError(404, "User not found");

    if (user.role.roleName !== "admin") {
        throw new ApiError(403, "Admin access required");
    }

    next();
};



