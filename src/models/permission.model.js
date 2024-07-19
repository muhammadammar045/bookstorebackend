import mongoose, { Schema } from "mongoose";

const permissionSchema = new Schema(
    {
        permissionName: {
            type: String,
            required: true,
            unique: true
        },
    },
    {
        timestamps: true
    }
)

export const Permission = mongoose.model("Permission", permissionSchema);