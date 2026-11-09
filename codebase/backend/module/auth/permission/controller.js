import {CrudController} from "express-web-tools";
import permissionModel from "./model.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

class PermissionController extends CrudController {
    async update(id, data) {
        const permission = await permissionModel.findOne({ _id: id, origin: this.request.origin });
        if (permission?.authorization === "role:owner") {
            throw httpError(403, "Owner role permissions cannot be changed through this API");
        }
        return super.update(id, data);
    }

    async delete(id) {
        const permission = await permissionModel.findOne({ _id: id, origin: this.request.origin });
        if (permission?.authorization === "role:owner") {
            throw httpError(403, "Owner role permissions cannot be deleted through this API");
        }
        return super.delete(id);
    }
}

const permissionController=new PermissionController(permissionModel);
export default permissionController;