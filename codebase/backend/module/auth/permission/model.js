import mongoose from "mongoose";
import { MongooseModel } from "express-web-tools";

const permissionSchema = new MongooseModel(
    "Permission",
    new mongoose.Schema({
        authorization: {
            type: String,
            required: true,
            // user: username || role: rolename
        },
        resource: {
            type: String,
            required: true,
            // module:feature
        },
        action: [{
            type: String,
            required: true,
            // view:own,view:organization,view:all
            // edit:own,edit:organization,edit:all
            // delete:own,delete:organization,delete:all
            // import:own,import:organization,import:all
            // export:own,export:organization,export:all
            // activate/deactivate
            // reSort
        }]
    }),
    [
        [
            {
                authorization: 1,
                resource: 1,
                origin: 1
            }, {
                unique: true
            }
        ]
    ],
    {},
    {
        allowSystemFieldUpdates:true,
        auditEnforce:false,
        multitenant:true,
        softDelete:false,
        timestamps:true
    }
)

export default permissionSchema.model();