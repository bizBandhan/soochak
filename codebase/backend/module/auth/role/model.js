import mongoose from "mongoose";
import { MongooseModel } from "express-web-tools";

const roleSchema = new MongooseModel(
    "Role",
    new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }),
    [
        [
            {
                name: 1,
                origin: 1
            }, {
                unique: true
            }
        ]
    ],
    {},
    {
        allowSystemFieldUpdates: true,
        auditEnforce: false,
        multitenant: true,
        softDelete: false,
        timestamps: true
    }
)

export default roleSchema.model();