import {CrudController} from "express-web-tools";
import roleModel from "./model.js";
import userModel from "../user/model.js";
import permissionModel from "../permission/model.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

class RoleController extends CrudController {
    async update(id, data) {
        const role = await roleModel.findOne({ _id: id, origin: this.request.origin });
        if (role?.name === "owner" && data?.name !== undefined) {
            throw httpError(403, "The owner role name is reserved");
        }
        return super.update(id, data);
    }

    async delete(id) {
        const role = await roleModel.findOne({ _id: id, origin: this.request.origin });
        if (!role) return super.delete(id);
        if (role.name === "owner") {
            throw httpError(403, "The owner role cannot be deleted");
        }
        const [assignedUsers, grants] = await Promise.all([
            userModel.exists({ role: role.name, origin: this.request.origin }),
            permissionModel.exists({
                authorization: `role:${role.name}`,
                origin: this.request.origin
            })
        ]);
        if (assignedUsers || grants) {
            throw httpError(409, "A role with assigned users or permissions cannot be deleted");
        }
        return super.delete(id);
    }
}

const roleController=new RoleController(roleModel);
export default roleController;