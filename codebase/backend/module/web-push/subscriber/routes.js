import { HttpError, asyncHandler } from "express-web-tools";
import { Router } from "express";
import controller from "./controller.js";

const router = Router()
router
    .route('')
    .get(
        asyncHandler(
            async (req, res) => {
                try {
                    controller.request=req;
                    let data = await controller.list();

                    return res.json({
                        status: "success",
                        message: `Total ${data.length} records found`,
                        data
                    })
                } catch (error) {
                    throw new HttpError(500, error.message)
                }
            }
        )
    )
    .post(
        asyncHandler(
            async (req, res) => {
                try {
                    controller.request=req;
                    let data = await controller.list(req.body);

                    return res.json({
                        status: "success",
                        message: `Total ${data.length} records found`,
                        data
                    })
                } catch (error) {
                    throw new HttpError(500, error.message)
                }
            }
        )
    )
    .put(
        asyncHandler(
            async (req, res) => {
                try {
                    controller.request=req;
                    let data = await controller.create(req.body);

                    return res.status(201).json({
                        status: "success",
                        message: "Created",
                        data
                    })
                } catch (error) {
                    throw new HttpError(500, error.message)
                }
            }
        )
    )
    .patch(
        asyncHandler(
            async (req, res) => {
                try {
                    controller.request=req;
                    let data = await controller.findOne({
                        endpoint:req.body.endpoint
                    });
                    if(!data) throw new HttpError(404,"Invalid request");
                    data=await controller.update(data._id,req.body)
                    return res.json({
                        status: "success",
                        message: `Updated`,
                        data
                    })
                } catch (error) {
                    throw new HttpError(500, error.message)
                }
            }
        )
    )
    .delete(
        asyncHandler(
            async (req, res) => {
                try {
                    controller.request=req;
                    let data = await controller.findOne({
                        endpoint:req.body.endpoint
                    });
                    if(!data) throw new HttpError(404,"Invalid request");
                    data=await controller.delete(data._id)
                    return res.json({
                        status: "success",
                        message: `Deleted`,
                        data
                    })
                } catch (error) {
                    throw new HttpError(500, error.message)
                }
            }
        )

    )
export default router;
