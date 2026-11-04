import bcrypt from "bcryptjs";
import { CrudController } from "express-web-tools";
import userModel from "./model.js";
import roleModel from "../role/model.js";
import {
    httpError,
    buildProfileUpdate,
    saveProfileUpdate,
    MIN_PASSWORD_LENGTH
} from "./validation.js";

// Login, logout and /me live in ../session/router.js; this controller is for the CRUD routes.
const OWNER_ROLE = "owner";
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const PROFILE_FIELDS = ["name", "sex", "dob", "email", "phone", "timezone", "profilePicture"];
const CREATE_FIELDS = ["user", "password", "role", ...PROFILE_FIELDS];

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Turns buildProfileUpdate's "name.first" style paths back into a nested object.
const expandPaths = (flat) => {
    const result = {};
    for (const [path, value] of Object.entries(flat)) {
        const [head, ...rest] = path.split(".");
        if (rest.length) (result[head] ??= {})[rest.join(".")] = value;
        else result[head] = value;
    }
    return result;
};

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

    // Only an owner may create, edit, demote or delete owners.
    #assertOwnerAccess(role) {
        if (role === OWNER_ROLE && this.request.user?.role !== OWNER_ROLE) {
            throw httpError(403, "Only an owner can manage owner accounts");
        }
    }

    async #assertNotLastOwner() {
        const owners = await userModel.countDocuments({ role: OWNER_ROLE, origin: this.request.origin });
        if (owners <= 1) throw httpError(409, "The organization must keep at least one owner");
    }

    async create(data) {
        try {
            if (!isPlainObject(data)) throw httpError(400, "Request body must be a JSON object");
            const unknown = Object.keys(data).filter((key) => !CREATE_FIELDS.includes(key));
            if (unknown.length) throw httpError(400, `Unknown fields: ${unknown.join(", ")}`);

            const username = typeof data.user === "string" ? data.user.trim() : "";
            if (!USERNAME_PATTERN.test(username)) {
                throw httpError(400, "Username must be 3-64 characters: letters, digits, dot, underscore or hyphen");
            }
            if (typeof data.password !== "string" || data.password.length < MIN_PASSWORD_LENGTH) {
                throw httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
            }

            const role = await this.#resolveRole(data.role);
            this.#assertOwnerAccess(role);

            const profile = Object.fromEntries(PROFILE_FIELDS.filter((key) => key in data).map((key) => [key, data[key]]));
            const { update } = buildProfileUpdate(profile, PROFILE_FIELDS);

            const created = await super.create({
                ...expandPaths(update),
                user: username,
                role,
                password: await bcrypt.hash(data.password, 10)
            });
            // Reload so the hash and other hidden fields never reach the response.
            return await userModel.findOne({ _id: created._id, origin: this.request.origin });
        } catch (error) {
            throw mapError(error);
        }
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