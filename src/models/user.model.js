import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        fullname: {
            type: String,
            req: [true, "Fullname is required"],
            trim: true
        },
        email: {
            type: String,
            req: [true, "Email is required"],
            unique: [true, "Email already exists"],
            trim: true
        },
        password: {
            type: String,
            req: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // if pass is modified then return 
    const hashPassword = await bcrypt.hash(this.password, 10);
    this.password = hashPassword;
    next()
})

userSchema.methods.AccessToken = function () {
    const accessToken = jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY
        }
    )
    return accessToken;

}
userSchema.methods.RefreshToken = function () {
    const refreshToken = jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY
        }
    )
    return refreshToken;
}

userSchema.methods.ComparePassword = async function (password) {
    const comparedPassword = await bcrypt.compare(password, this.password);
    return comparedPassword;
}


export const User = mongoose.model('User', userSchema);
