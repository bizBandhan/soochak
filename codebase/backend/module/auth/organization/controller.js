import { CrudController, HttpError, eventStream } from "express-web-tools";
import organizationModel from "./model.js";
import "./events.js";


class OrganizationController extends CrudController {
    async create(data) {
        const { owner, ...organizationData } = data ?? {};
        const hasOwnerDetails = owner
            && owner.user
            && owner.name?.first
            && owner.name?.last
            && owner.sex
            && owner.dob
            && owner.email
            && owner.password;

        if (!hasOwnerDetails) {
            throw new HttpError(400, "Organization owner details are required");
        }

        const origin = this.request?.origin;
        if (!origin) {
            throw new HttpError(400, "Organization origin is required");
        }

        const organization = await super.create(organizationData);

        // The event provisions the first owner and the default owner role/grants.
        // Keep owner credentials inside the process and never include them in the API response.
        eventStream.emitEvent("organization-created", {
            origin,
            organizationId: organization._id,
            owner
        });

        return organization;
    }
}

const organizationController=new OrganizationController(organizationModel);
export default organizationController;
