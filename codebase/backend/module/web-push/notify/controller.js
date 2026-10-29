import { CrudController } from "express-web-tools";
import model from "./model.js";

class NoteController extends CrudController { }

export default new NoteController(model)