import {CrudController} from "express-web-tools";
import subscriberModel from "./model.js";

class SubscriberController extends CrudController{

}


export default new SubscriberController(subscriberModel)