import bcrypt from "bcryptjs";
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

export const provisionOrganizationOwner = async ({ origin, owner }) => {
    if (await userModel.exists({ origin })) {
        const error = new Error("This hostname is already assigned to a user");
        error.code = "HOST_ALREADY_ASSIGNED";
        throw error;
    }

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
    let result;
    try {
        result = await userModel.updateOne(
            { user: owner.user, origin },
            {
                $setOnInsert: {
                    ...ownerDetails,
                    user: owner.user,
                    password,
                    role: OWNER_ROLE.name,
                    origin,
                    personalWorkspace: true
                }
            },
            { upsert: true, runValidators: true }
        );
    } catch (error) {
        if (error.code === 11000) {
            if (error.keyPattern?.origin && Object.keys(error.keyPattern).length === 1) {
                const hostError = new Error("This hostname is already assigned to a user");
                hostError.code = "HOST_ALREADY_ASSIGNED";
                throw hostError;
            }
            const usernameError = new Error("Owner username is already taken");
            usernameError.code = "OWNER_EXISTS";
            throw usernameError;
        }
        throw error;
    }

    // An existing account must never be claimed (or logged into) through registration.
    if (!result.upsertedCount) {
        const error = new Error("Owner username is already taken");
        error.code = "OWNER_EXISTS";
        throw error;
    }

    return userModel.findOne({ user: owner.user, origin });
};
