import { CrudController } from "express-web-tools";
import model from "./module.js";

class NoteController extends CrudController { }

export default new NoteController(model)