import { CrudController } from "express-web-tools";
import organizationModel from "./model.js";
import { DEFAULT_PLAN, PLAN_IDS, limitsForPlan } from "./plans.js";
import { provisionOrganizationOwner } from "./provisioning.js";
import { httpError, capitalize, normalizePhone, assertTimezone } from "../user/validation.js";
import { normalizeHostedDomain, workspaceHostForSlug } from "./hostname.js";
import { deleteVapidKeys, ensureVapidKeys } from "../../web-push/vapid.js";

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

        const hostedDomain = normalizeHostedDomain(process.env.HOSTED_DOMAIN);
        const requestHostname = String(this.request?.hostname ?? "").toLowerCase();
        if (requestHostname !== hostedDomain) {
            throw httpError(403, "Organization registration is available only on the platform signup hostname");
        }

        const slug = typeof organizationData.slug === "string"
            ? organizationData.slug.trim().toLowerCase()
            : "";
        const workspaceHost = workspaceHostForSlug(slug, hostedDomain);
        organizationData.slug = slug;
        const workspaceUrl = `https://${workspaceHost}`;

        const normalizedOwner = normalizeOwner(owner);

        // Scope all workspace records to the slug-derived hostname, not the shared signup host.
        const requestOrigin = this.request.origin;
        this.request.origin = workspaceHost;

        let organization;
        try {
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

            try {
                await ensureVapidKeys(organization._id);
                await provisionOrganizationOwner({ origin: workspaceHost, owner: normalizedOwner });
            } catch (error) {
                // Roll back so the slug is not left reserved by an organization without an owner.
                await deleteVapidKeys(organization._id);
                await organizationModel.collection.deleteOne({ _id: organization._id });
                if (error.code === "OWNER_EXISTS" || error.code === "HOST_ALREADY_ASSIGNED") {
                    throw httpError(409, error.message);
                }
                throw error;
            }
        } finally {
            this.request.origin = requestOrigin;
        }

        const record = typeof organization.toObject === "function"
            ? organization.toObject()
            : { ...organization };
        return { ...record, workspaceHost, workspaceUrl };
    }
}

const organizationController=new OrganizationController(organizationModel);
export default organizationController;
