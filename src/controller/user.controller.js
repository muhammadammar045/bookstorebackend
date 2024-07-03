import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

const registerUser = async (req, res) => {
    try {
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

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
        }
        return res.status(500).json(new ApiResponse(500, null, "Error registering user", error.message));
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) throw new ApiError(400, "Missing required fields");

        const user = await User.findOne({ email });
        if (!user) throw new ApiError(404, "User not found");

        const comparedPassword = await user.ComparePassword(password);
        if (!comparedPassword) throw new ApiError(401, "Invalid credentials");

        const loggedUser = await User.findById(user._id).select("-password -refreshToken");

        const { accessToken, refreshToken } = await generateTokens(user._id);

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(200, { user: loggedUser, accessToken, refreshToken }, "User logged in successfully")
            );

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
        }
        return res.status(500).json(new ApiResponse(500, null, "Error logging in user", error.message));
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user) throw new ApiError(404, "User not found");

        return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
        }
        return res.status(500).json(new ApiResponse(500, null, "Error getting user", error.message));
    }
};

export {
    registerUser,
    loginUser,
    getUser
};
