import mongoose from "mongoose";
import { MongooseModel } from "express-web-tools";

const organizationSchema = new MongooseModel(
    "Organization",
    new mongoose.Schema({
        name: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        limits: {
            type: mongoose.Schema.Types.Mixed
            // Based on plan chosen.
            // user:10
            // subscriber:10000
            // message:50000
            // supportTicket:10
        }
    }),
    [
        [
            {
                origin: 1,
                name: 1
            },
            {
                unique: true
            }
        ],
        [
            {
                origin: 1,
                slug: 1
            },
            {
                unique: true
            }
        ],

    ],
    {},
    {
        allowSystemFieldUpdates: false,
        auditEnforce: false,
        multitenant: true,
        softDelete: true,
        timestamps: true
    }
);
export default organizationSchema.model();
