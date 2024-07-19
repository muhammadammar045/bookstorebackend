import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema(
    {
        roleName: {
            type: String,
            required: true,
            unique: true
        },
        permissions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Permission'
            }
        ]
    },
    {
        timestamps: true
    }
)

export const Role = mongoose.model('Role', roleSchema)