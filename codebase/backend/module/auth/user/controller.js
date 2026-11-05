import { CrudController } from "express-web-tools";
import userModel from "./model.js";
import roleModel from "../role/model.js";
import {
    httpError,
    buildProfileUpdate,
    saveProfileUpdate
} from "./validation.js";

// Login, logout and /me live in ../session/router.js; this controller is for the CRUD routes.
const OWNER_ROLE = "owner";
const PROFILE_FIELDS = ["name", "sex", "dob", "email", "phone", "timezone", "profilePicture"];

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// CrudController wraps every failure in a plain Error, so map the known ones back to HTTP errors.
const mapError = (error) => {
    if (error.status) return error;
    const message = String(error.message ?? "");
    if (/E11000/.test(message)) return httpError(409, "A user with this username already exists");
    if (/Cast to ObjectId|Item not found/.test(message)) return httpError(404, "User not found");
    if (/validation failed/i.test(message)) {
        return httpError(400, message.replace(/^.*validation failed:\s*/i, ""));
    }
    return error;
};

class UserController extends CrudController {
    async #findTarget(id) {
        let target;
        try {
            target = await userModel.findOne({ _id: id, origin: this.request.origin });
        } catch {
            target = null;
        }
        if (!target) throw httpError(404, "User not found");
        return target;
    }

    async #resolveRole(role) {
        if (typeof role !== "string" || !role.trim()) throw httpError(400, "Role is required");
        const name = role.trim();
        if (!(await roleModel.exists({ name, origin: this.request.origin }))) {
            throw httpError(400, `Role "${name}" does not exist`);
        }
        return name;
    }

    // Only an owner may edit, demote or delete owner accounts.
    #assertOwnerAccess(role) {
        if (role === OWNER_ROLE && this.request.user?.role !== OWNER_ROLE) {
            throw httpError(403, "Only an owner can manage owner accounts");
        }
    }

    async #assertNotLastOwner() {
        const owners = await userModel.countDocuments({ role: OWNER_ROLE, origin: this.request.origin });
        if (owners <= 1) throw httpError(409, "The organization must keep at least one owner");
    }

    async create() {
        throw httpError(405, "Additional user accounts are not supported in a personal workspace");
    }

    async read(id) {
        try {
            return await super.read(id);
        } catch (error) {
            throw mapError(error);
        }
    }

    // Loads, edits and saves the document (instead of findOneAndUpdate) so schema validators run.
    // Username and password are not editable here; users change their own password via POST /me.
    async update(id, data) {
        try {
            if (!isPlainObject(data)) throw httpError(400, "Request body must be a JSON object");
            const { role: newRole, ...profile } = data;
            const hasRole = "role" in data;

            const target = await this.#findTarget(id);
            this.#assertOwnerAccess(target.role);

            const changes = Object.keys(profile).length
                ? buildProfileUpdate(profile, PROFILE_FIELDS)
                : { update: {}, unset: {} };
            if (!hasRole && !Object.keys(profile).length) {
                throw httpError(400, "Provide at least one field to update");
            }

            if (hasRole) {
                const role = await this.#resolveRole(newRole);
                if (role !== target.role) {
                    if (String(target._id) === String(this.request.user?._id)) {
                        throw httpError(403, "You cannot change your own role");
                    }
                    this.#assertOwnerAccess(role);
                    if (target.role === OWNER_ROLE) await this.#assertNotLastOwner();
                    changes.update.role = role;
                }
            }

            await saveProfileUpdate(target, changes);
            return await userModel.findOne({ _id: target._id, origin: this.request.origin });
        } catch (error) {
            throw mapError(error);
        }
    }

    async delete(id) {
        try {
            const target = await this.#findTarget(id);
            if (String(target._id) === String(this.request.user?._id)) {
                throw httpError(409, "You cannot delete your own account");
            }
            this.#assertOwnerAccess(target.role);
            if (target.role === OWNER_ROLE) await this.#assertNotLastOwner();
            return await super.delete(id);
        } catch (error) {
            throw mapError(error);
        }
    }
}

const userController = new UserController(userModel);
export default userController;