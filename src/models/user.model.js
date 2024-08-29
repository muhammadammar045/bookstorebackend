import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: [true, "First Name is required"],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, "Last Name is required"],
            trim: true
        },
        userName: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
            unique: [true, "Username already exists"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: [true, "Email already exists"],
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: Schema.Types.ObjectId,
            ref: "Role",
            default: "6697912d3731561b502128d5"
        },
        profileImage: {
            type: String,
            default: "https://res.cloudinary.com/ammardata/image/upload/v1721213653/mp0l52imhgwsx8qca1pm.png"
        },
        coverImage: {
            type: String,
        },
        refreshToken: {
            type: String,
        },
        address: {
            type: String,
            default: "Kohat, Pakistan"
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
    if (this.email === process.env.ADMIN_EMAIL) {
        this.role = "669791941663d1d968d6025a"
    }
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
