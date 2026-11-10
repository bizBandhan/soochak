import { Router } from "express";
import mongoose from "mongoose";
import siteModel from "./model.js";
import isAuthenticated from "../../auth/user/guard.js";
import { authorize } from "../../auth/user/authorize.js";
import { httpError } from "../../auth/user/validation.js";

const router = Router();
const read = [isAuthenticated, authorize("web-push:subscriber", "view:organization")];
const edit = [isAuthenticated, authorize("web-push:subscriber", "edit:organization")];
const unavailable = (req, res) => res.status(405).json({ status: "error", message: "Method not allowed" });
const idFilter = (req) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid site ID");
    return { _id: req.params.id, workspace: req.origin };
};
const fields = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)
        || Object.keys(body).some((key) => !["name", "origin", "serviceWorkerPath"].includes(key))) {
        throw httpError(400, "Provide only name, origin and serviceWorkerPath");
    }
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) {
        throw httpError(400, "Site name must be between 1 and 120 characters");
    }
    let url;
    try { url = new URL(body.origin); } catch { throw httpError(400, "Enter a valid HTTPS origin"); }
    if (url.protocol !== "https:" || url.origin === "null" || url.username || url.password
        || url.pathname !== "/" || url.search || url.hash) {
        throw httpError(400, "Enter an HTTPS origin without credentials, path, query or fragment");
    }
    const path = body.serviceWorkerPath;
    if (typeof path !== "string" || !/^\/(?!\/)[a-zA-Z0-9._~/-]+\.js$/.test(path)
        || path.split("/").some((part) => part === "." || part === "..")) {
        throw httpError(400, "Service Worker path must be an absolute same-origin JavaScript path");
    }
    return { name: body.name.trim(), origin: url.origin, serviceWorkerPath: path };
};
const send = (res, data, status = 200) => res.status(status).json({ status: "success", data });
const found = (site) => {
    if (!site) throw httpError(404, "Site not found");
    return site;
};
const save = async (operation) => {
    try { return await operation(); }
    catch (error) {
        if (error.code === 11000) throw httpError(409, "This origin is already registered");
        throw error;
    }
};

router.route("/")
    .get(...read, async (req, res) => send(res, await siteModel.find({ workspace: req.origin }).sort({ createdAt: 1 }).lean()))
    .post(...read, async (req, res) => {
        const filter = req.body ?? {};
        if (typeof filter !== "object" || Array.isArray(filter)
            || Object.entries(filter).some(([key, value]) =>
                !["name", "origin", "serviceWorkerPath"].includes(key) || typeof value !== "string")) {
            throw httpError(400, "Site filters must contain only name, origin or serviceWorkerPath text values");
        }
        return send(res, await siteModel.find({ ...filter, workspace: req.origin }).sort({ createdAt: 1 }).lean());
    })
    .put(...edit, async (req, res) => send(res, await save(() => siteModel.create({ ...fields(req.body), workspace: req.origin })), 201));
router.route("/:id")
    .get(...read, async (req, res) => send(res, found(await siteModel.findOne(idFilter(req)).lean())))
    .put(...edit, async (req, res) => send(res, found(await save(() => siteModel.findOneAndUpdate(
        idFilter(req), { $set: fields(req.body) }, { returnDocument: "after", runValidators: true }
    )))))
    .delete(...edit, async (req, res) => send(res, found(await siteModel.findOneAndDelete(idFilter(req)))))
    .patch(...edit, unavailable);

export default router;
