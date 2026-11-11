# Use Cases

**Product:** Soochak by BizBandhan  
**Status:** Draft; system behavior is planned. Updated 2026-10-30. A standalone dashboard scaffold exists; integration states are tracked in `docs/FRONTEND.md`.

## Actors

- **Organization owner:** submits an organization for review or receives access to an operator-created organization, then manages its users, roles, permissions, and resources.
- **Platform operator:** reviews self-service organization registrations or creates organizations directly using the protected management portal.
- **Organization user:** works under one organization hostname and uses assigned roles/direct permissions.
- **Website developer:** installs SDK and integrates the Service Worker.
- **Campaign operator:** prepares and monitors messages.
- **Website visitor:** grants/revokes browser notification permission.
- **Soochak services:** gateway, API, and database for the prototype; scheduler, queue, delivery worker, and click handler are planned components.
- **Browser push service:** accepts Web Push requests and routes them to browsers.

## UC-00: Submit and review a self-service organization

**Goal:** Create an organization and its first owner account, then activate tenant access only after operator approval and successful provisioning.
**Preconditions:** The hosted SaaS signup page is available. The customer website origin is collected separately from the user's Soochak dashboard/API hostname, which identifies the prototype workspace.
**Trigger:** Prospective owner submits the public organization registration form.

1. Owner submits organization name/slug, canonical customer website origin, owner details, contact email, and an owner-chosen password.
2. System creates a pending-review organization and an owner account that is locked out of workspace dashboard/API access; it hashes the password and starts owner/role/permission provisioning.
3. System reports a pending state and emails status updates to the submitted contact address. The address is not treated as verified identity.
4. Platform operator reviews the request from the protected management portal (`mgmt.bizbandhan.duckdns.org` locally, `mgmt.soochak.bizbandhan.com` in production).
5. On approval, the system activates workspace access only after required provisioning succeeds and assigns the user's unique Soochak hostname from the organization slug (`<slug>.bizbandhan.duckdns.org` locally, `<slug>.soochak.bizbandhan.com` in production).
6. On request-changes, the system emails the reason; owner signs in with the chosen password to a restricted registration area, edits the request, and resubmits. This does not grant workspace access.
7. On rejection, the system emails the reason; owner must submit a new registration.
8. The response and email never expose the submitted password or password hash.

**Alternate flows:** Invalid organization/owner data returns actionable field errors. Provisioning failure leaves the organization inactive and visible for operator recovery. Status-email delivery failure must not activate a workspace; retry/notification recovery behavior remains to be defined. Email ownership verification, customer website/dashboard hostname verification, custom dashboard domains, and plan payments are deferred.
**Postconditions:** The organization is active only after operator approval and successful provisioning, or remains pending/changes-requested/rejected with a visible status and safe next step.

## UC-00b: Create an organization directly as a platform operator

**Goal:** Provision an organization without the applicant-review step.
**Preconditions:** Operator is authenticated and authorized in the protected management portal.
**Trigger:** Operator submits organization, customer website origin, and owner details.

1. Operator enters organization and owner details, including an initial owner password.
2. System creates the organization and starts owner/role/permission provisioning without applicant review.
3. System keeps workspace access disabled until provisioning succeeds, then assigns the owner's unique Soochak hostname from the organization slug (`<slug>.bizbandhan.duckdns.org` locally, `<slug>.soochak.bizbandhan.com` in production) and activates it.
4. Operator communicates the initial password to the owner outside the system.
5. Owner changes the initial password at first login.

**Alternate flows:** Provisioning failure leaves the organization inactive and exposes recovery actions to the operator. Credentials are never logged or placed in URLs or documentation.
**Postconditions:** Workspace access is active after successful provisioning, or remains disabled with an actionable operator-visible failure state.

## UC-00a: Complete First-Run Self-Hosted Setup

**Goal:** Initialize a self-hosted Soochak instance for its operator.  
**Preconditions:** The instance has a configured hostname and valid HTTPS for browser push.  
**Trigger:** Operator opens the setup page before initial configuration is complete.

1. Setup page detects/displays the current hostname and lets the operator confirm the canonical host.
2. Operator creates the initial organization and owner account, then configures any required hostname/DNS verification.
3. System seeds default roles and permissions and marks initial setup complete.
4. Setup page is no longer available for another initial bootstrap.

**Alternate flows:** A DuckDNS hostname may resolve to a private LAN address and still be used when accessed over valid HTTPS; raw remote HTTP by private IP is not a supported Web Push context.  
**Postconditions:** The self-hosted instance has one initial organization and owner.

## UC-01: Set Up a Website

**Goal:** Prepare a site for Web Push integration.  
**Preconditions:** User is authenticated and has permission to create resources in the active organization. Per-resource site ownership verification is deferred.  
**Trigger:** User selects “Add resource.”

1. User submits a resource name and site origin.
2. System validates the site origin and creates a resource record scoped to the active tenant organization.
3. System provides a resource identifier, allowed origins, public configuration, subscriber limit, and VAPID public key.
4. Developer installs the SDK and follows the documented integration pattern for the site's existing worker.
5. Developer verifies configuration with a test subscription.

**Alternate flows:** Invalid origin or missing configuration returns field-level errors. No separate domain ownership challenge is performed in the prototype. Unsupported worker arrangements provide diagnostic guidance; the system does not replace the site's worker automatically.  
**Postconditions:** Resource is associated with its organization and its subscribers are isolated from other tenant organizations.

## UC-02: Subscribe a Visitor

**Goal:** Register a visitor's browser endpoint with the correct site.  
**Preconditions:** Resource is configured and served in a browser context supporting push; prototype testers use the development HTTPS origin.  
**Trigger:** Internal test user activates the site's notification opt-in control.

1. SDK requests permission in response to that action.
2. If granted, browser creates a push subscription and SDK submits it to the API with resource context.
3. API validates and stores or refreshes the subscription.
4. SDK reports success to the host site.

**Alternate flows:** Denied permission is reported without another prompt; unsupported browser reports a useful limitation; registration errors can be retried safely; unsubscribe or definitive endpoint expiry deletes the record immediately. Transient send failures do not delete it.  
**Postconditions:** Subscription is active and resource-scoped, or its failure state is communicated.

## UC-03: Send an Immediate Campaign

**Goal:** Deliver a campaign to a site's eligible active subscribers.  
**Preconditions:** Authorized user can manage the resource in the active organization; its VAPID configuration is valid.  
**Trigger:** Operator confirms a reviewed campaign.

1. User selects a resource and enters title, message, optional media, and destination URL.
2. UI validates fields and shows the target resource/audience estimate.
3. API validates resource ownership and persists the campaign.
4. System enqueues durable delivery work; workers send within configured concurrency limits.
5. Worker records provider response, retries transient failures within bounded policy, and immediately deletes subscriber records for definitively expired endpoints.
6. Dashboard displays campaign processing outcomes and later observed clicks.

**Alternate flows:** Invalid content, insufficient permission, or configuration errors prevent enqueueing. Queue or provider outages leave work in a visible retryable/failed state. Duplicate requests should not create duplicate sends where idempotency is available.  
**Postconditions:** Campaign and per-endpoint outcomes are auditable; provider acceptance is not treated as proof of display.

## UC-04: Schedule a Campaign

**Goal:** Send a reviewed campaign at a future time.  
**Preconditions:** User is authorized for the resource in the active organization and content is valid.  
**Trigger:** Operator chooses a future send time.

1. Dashboard displays the schedule time and timezone interpretation.
2. API validates and persists the scheduled campaign.
3. Scheduler makes it eligible at the scheduled time and publishes durable delivery work.
4. Delivery proceeds as in UC-03.

**Alternate flows:** Past or ambiguous times are rejected or clarified; repeated scheduler execution must not enqueue duplicate campaign work.  
**Postconditions:** Campaign moves from scheduled to processing and then a terminal/partially failed state.

## UC-05: Review Campaign Outcomes

**Goal:** Understand campaign processing and engagement.  
**Preconditions:** User is authorized to review the resource in the active organization.  
**Trigger:** User opens a campaign report.

1. API returns user/resource-scoped campaign totals and relevant delivery statuses.
2. Dashboard distinguishes queued, attempted, provider accepted, failed, and observed clicks.
3. User drills into useful failure categories without seeing secrets or another user's data.

**Postconditions:** User can assess processing and clicks; no display or read receipt is implied.

## UC-06: Assign Roles and Permissions

**Goal:** Organize users and grant the actions they need within their organization.  
**Preconditions:** Caller is authorized within the organization identified by the request host.  
**Trigger:** Organization admin edits a user's role or an explicit permission grant.

1. Admin assigns a user to an organization role; roles are labels for grouping users.
2. Admin or authorized operator grants actions to a user or role principal.
3. On each protected API operation, backend resolves the user's direct grants and role grants under the same origin and checks the required action.

**Alternate flows:** User/role from a different origin is rejected; unknown permission actions are rejected; conflict behavior between direct and role grants follows the configured authorization policy.  
**Postconditions:** The user can perform only the actions authorized for their organization context.

## UC-07: Use the API Documentation

**Goal:** Let frontend and integration developers discover the API contract.  
**Preconditions:** The backend static public directory is served.  
**Trigger:** Developer opens `/api-docs/`.

1. Swagger UI loads `openapi.yml` from the same directory.
2. The OpenAPI file loads shared request and response schemas from `schemas.yml`.
3. Developer browses current-user routes, generated user/role/permission/vendor CRUD routes, and Web Push routes, including handlers marked under development.

**Postconditions:** Developers can inspect the documented methods and payload shapes; documentation does not imply that planned routes or security checks are implemented.
