# Use Cases

**Product:** Soochak by BizBandhan  
**Status:** Draft; system behavior is planned. Updated 2026-10-29. A standalone dashboard scaffold exists; integration states are tracked in `docs/FRONTEND.md`.

## Actors

- **Organization owner:** registers an organization and manages its users, roles, permissions, and resources.
- **Organization user:** works under one organization hostname and uses assigned roles/direct permissions.
- **Website developer:** installs SDK and integrates the Service Worker.
- **Campaign operator:** prepares and monitors messages.
- **Website visitor:** grants/revokes browser notification permission.
- **Soochak services:** gateway, API, and database for the prototype; scheduler, queue, delivery worker, and click handler are planned components.
- **Browser push service:** accepts Web Push requests and routes them to browsers.

## UC-00: Register an Organization

**Goal:** Create an organization and its first owner account, scoped to a unique hostname.  
**Preconditions:** The hostname is available and suitable for the deployment's host-based tenancy model.  
**Trigger:** Visitor submits the organization registration form to `PUT /api/v1/auth/organization`.

1. Visitor submits required organization name, slug, expected hostname, and owner details (username, name, sex, date of birth, email, optional phone/timezone, and password).
2. API canonicalizes the hostname and rejects it if already assigned.
3. API temporarily uses the expected hostname as the request origin for organization-scoped writes, even if the registration request arrived via a shared platform host.
4. API creates the organization and owner, seeds default roles and permissions, and assigns the owner role.
5. Organization remains pending until the configured DNS verification succeeds.
6. After activation, the system sends a welcome note. The response excludes the submitted password and other secrets.

**Alternate flows:** Invalid fields return field-level errors; duplicate hostnames are rejected; DNS propagation delay leaves verification retryable; welcome-message failure does not undo the created organization. The exact DNS verification method (A-record routing check, TXT ownership proof, or both) remains open.  
**Postconditions:** An active organization, owner, default roles, and permissions exist under one canonical hostname, or the caller receives a safe actionable error.

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
2. System validates the site origin and creates a resource record scoped to the active organization origin.
3. System provides a resource identifier, allowed origins, public configuration, subscriber limit, and VAPID public key.
4. Developer installs the SDK and follows the documented integration pattern for the site's existing worker.
5. Developer verifies configuration with a test subscription.

**Alternate flows:** Invalid origin or missing configuration returns field-level errors. No separate domain ownership challenge is performed in the prototype. Unsupported worker arrangements provide diagnostic guidance; the system does not replace the site's worker automatically.  
**Postconditions:** Resource is associated with its organization and its subscribers are isolated from other organization origins.

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
