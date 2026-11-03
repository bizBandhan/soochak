import mongoose from "mongoose";
import { MongooseModel } from "express-web-tools";
import { DEFAULT_PLAN, PLAN_IDS } from "./plans.js";

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
        plan: {
            type: String,
            enum: PLAN_IDS,
            default: DEFAULT_PLAN
        },
        limits: {
            type: mongoose.Schema.Types.Mixed
            // Derived from the plan on the server; never taken from client input.
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
