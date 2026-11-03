import { CrudController, HttpError, eventStream } from "express-web-tools";
import organizationModel from "./model.js";
import { DEFAULT_PLAN, PLAN_IDS, limitsForPlan } from "./plans.js";
import "./events.js";

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

const isValidTimezone = (timezone) => {
    try {
        new Intl.DateTimeFormat("en", { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
};

const capitalize = (value) => typeof value === "string" && value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : value;

// Normalises owner input from the dashboard (lowercase sex, blank optionals) and validates phone/timezone.
const normalizeOwner = (owner) => {
    const normalized = { ...owner, sex: capitalize(owner.sex) };

    if (normalized.phone === undefined || normalized.phone === null || String(normalized.phone).trim() === "") {
        delete normalized.phone;
    } else {
        normalized.phone = String(normalized.phone).replace(/[\s()-]/g, "");
        if (!E164_PATTERN.test(normalized.phone)) {
            throw new HttpError(400, "Phone number must be in international format, e.g. +919876543210");
        }
    }

    if (!normalized.timezone) {
        delete normalized.timezone;
    } else if (!isValidTimezone(normalized.timezone)) {
        throw new HttpError(400, "Timezone must be a valid IANA timezone, e.g. Asia/Kolkata");
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
            throw new HttpError(400, "Organization owner details are required");
        }

        const selectedPlan = plan ?? DEFAULT_PLAN;
        if (!PLAN_IDS.includes(selectedPlan)) {
            throw new HttpError(400, `Plan must be one of: ${PLAN_IDS.join(", ")}`);
        }

        const origin = this.request?.origin;
        if (!origin) {
            throw new HttpError(400, "Organization origin is required");
        }

        const normalizedOwner = normalizeOwner(owner);

        // Quotas come from the plan only; client-supplied limits are ignored.
        const organization = await super.create({
            ...organizationData,
            plan: selectedPlan,
            limits: limitsForPlan(selectedPlan)
        });

        // The event provisions the first owner and the default owner role/grants.
        // Keep owner credentials inside the process and never include them in the API response.
        eventStream.emitEvent("organization-created", {
            origin,
            organizationId: organization._id,
            owner: normalizedOwner
        });

        return organization;
    }
}

const organizationController=new OrganizationController(organizationModel);
export default organizationController;
