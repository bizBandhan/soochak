import {CrudController} from "express-web-tools";
import roleModel from "./model.js";


class RoleController extends CrudController{}

const roleController=new RoleController(roleModel);
export default roleController;