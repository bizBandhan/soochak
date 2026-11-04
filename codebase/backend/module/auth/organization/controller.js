import { CrudController } from "express-web-tools";
import organizationModel from "./model.js";
import { DEFAULT_PLAN, PLAN_IDS, limitsForPlan } from "./plans.js";
import { provisionOrganizationOwner } from "./provisioning.js";
import { startSession } from "../user/session.js";
import { httpError, capitalize, normalizePhone, assertTimezone } from "../user/validation.js";

// Normalises owner input from the dashboard (lowercase sex, blank optionals) and validates phone/timezone.
const normalizeOwner = (owner) => {
    const normalized = { ...owner, sex: capitalize(owner.sex) };

    const phone = normalizePhone(normalized.phone);
    if (phone === undefined) {
        delete normalized.phone;
    } else {
        normalized.phone = phone;
    }

    if (!normalized.timezone) {
        delete normalized.timezone;
    } else {
        assertTimezone(normalized.timezone);
    }

    return normalized;
};

class OrganizationController extends CrudController {
    async create(data) {
        const { owner, plan, limits: _clientLimits, ...organizationData } = data ?? {};
        const hasOwnerDetails = owner
            && owner.user
            && owner.name?.first
            && owner.name?.last
            && owner.sex
            && owner.dob
            && owner.email
            && owner.password;

        if (!hasOwnerDetails) {
            throw httpError(400, "Organization owner details are required");
        }

        const selectedPlan = plan ?? DEFAULT_PLAN;
        if (!PLAN_IDS.includes(selectedPlan)) {
            throw httpError(400, `Plan must be one of: ${PLAN_IDS.join(", ")}`);
        }

        const origin = this.request?.origin;
        if (!origin) {
            throw httpError(400, "Organization origin is required");
        }

        const normalizedOwner = normalizeOwner(owner);

        // Quotas come from the plan only; client-supplied limits are ignored.
        let organization;
        try {
            organization = await super.create({
                ...organizationData,
                plan: selectedPlan,
                limits: limitsForPlan(selectedPlan)
            });
        } catch (error) {
            if (/E11000/.test(error.message)) {
                throw httpError(409, "An organization with this name or slug already exists");
            }
            throw error;
        }

        // Provision the owner before responding so a session can be issued. Credentials
        // stay inside the process and are never returned in the API response.
        let ownerUser;
        try {
            ownerUser = await provisionOrganizationOwner({ origin, owner: normalizedOwner });
        } catch (error) {
            // Roll back so the slug is not left reserved by an organization without an owner.
            await organizationModel.collection.deleteOne({ _id: organization._id });
            if (error.code === "OWNER_EXISTS") {
                throw httpError(409, error.message);
            }
            throw error;
        }

        startSession(this.request, this.request.res, ownerUser);
        return organization;
    }
}

const organizationController=new OrganizationController(organizationModel);
export default organizationController;
