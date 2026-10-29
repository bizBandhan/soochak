import bcrypt from "bcryptjs";
import { eventStream } from "express-web-tools";
import permissionModel from "../permission/model.js";
import roleModel from "../role/model.js";
import userModel from "../user/model.js";

const OWNER_ROLE = {
    name: "owner",
    description: "Organization owner with full organization access"
};

const OWNER_GRANTS = [
    "auth:organization",
    "auth:user",
    "auth:role",
    "auth:permission",
    "web-push:subscriber",
    "web-push:notify"
];

const OWNER_ACTIONS = [
    "view:all",
    "edit:all",
    "delete:all",
    "import:all",
    "export:all",
    "activate",
    "deactivate",
    "reSort"
];

eventStream.onEvent("organization-created", async ({ origin, owner }) => {
    await roleModel.updateOne(
        { name: OWNER_ROLE.name, origin },
        { $setOnInsert: { ...OWNER_ROLE, origin } },
        { upsert: true, runValidators: true }
    );

    for (const resource of OWNER_GRANTS) {
        await permissionModel.updateOne(
            { authorization: `role:${OWNER_ROLE.name}`, resource, origin },
            {
                $setOnInsert: {
                    authorization: `role:${OWNER_ROLE.name}`,
                    resource,
                    action: OWNER_ACTIONS,
                    origin
                }
            },
            { upsert: true, runValidators: true }
        );
    }

    const password = await bcrypt.hash(owner.password, 10);
    const ownerDetails = { ...owner };
    delete ownerDetails.password;
    await userModel.updateOne(
        { user: owner.user, origin },
        {
            $setOnInsert: {
                ...ownerDetails,
                user: owner.user,
                password,
                role: OWNER_ROLE.name,
                origin
            }
        },
        { upsert: true, runValidators: true }
    );
});
