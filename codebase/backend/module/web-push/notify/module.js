import { MongooseModel } from "express-web-tools";
import mongoose from "mongoose";

const noteSchema = new MongooseModel(
    "Notify",
    new mongoose.Schema({
        body: {
            type: String
        },
        tag: {
            type: String
        },
        title: {
            type: String
        },
        url: {
            type: String
        },
    }),
    [],
    {},
    {
        allowSystemFieldUpdates: true,
        auditEnforce: false,
        multitenant: true,
        softDelete: false,
        timestamps: true
    }
);

export default noteSchema.model()