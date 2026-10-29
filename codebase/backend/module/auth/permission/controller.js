import {CrudController} from "express-web-tools";
import permissionModel from "./model.js";


class PermissionController extends CrudController{}

const permissionController=new PermissionController(permissionModel);
export default permissionController;