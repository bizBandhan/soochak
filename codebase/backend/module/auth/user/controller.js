import {CrudController,HttpError,Token} from "express-web-tools";
import userModel from "./model.js";


class UserController extends CrudController{
    async login(user,password,rember=false){
        let temp=await userModel.findOne({user});
        let status=await temp.verifyPassword(password);
        throw new HttpError(404,"Username or password is not correct")
    }
    async logout(){}
}

const userController=new UserController(userModel);
export default userController;