import { MongooseModel } from "express-web-tools"
import mongoose from "mongoose";

const subscriberSchema = new MongooseModel(
    "Subscriber",
    new mongoose.Schema({
        endpoint: { type: String, required: true },
        expirationTime: {
            type: String
        },
        keys: {
            type: mongoose.Schema.Types.Mixed
        },
        userAgent: {
            type: String
        },
        memberInfo: {
            type: mongoose.Schema.Types.Mixed
        }
    }),
    [
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

export default subscriberSchema.model()