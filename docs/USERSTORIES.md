# User Stories

**Product:** Soochak by BizBandhan  
**Status:** Draft backlog; priorities are proposed for MVP planning.

The current prototype is limited to internal organizations and test devices. One organization maps to one canonical hostname used as its tenancy origin; users belong to one organization in the current model. Roles group users, while permissions may be granted to a user or role. Verification is manual; automated tests are planned after the prototype.

## US-00 — Register an organization and owner (Must)
As a prospective organization owner, I want to register my organization with its hostname so that I can initialize Soochak for my team.

**Acceptance criteria**
- Registration requires organization name, slug, expected hostname, and owner account details.
- Hostnames are canonicalized and unique; a hostname already assigned to another organization is rejected.
- The system creates the organization and owner, seeds default roles and permissions, assigns the owner role, and sends a welcome note.
- A pending organization cannot use protected organization APIs until its hostname verification passes.
- Registration responses never include the submitted password or password hash.

## US-00a — Initialize a self-hosted instance (Should)
As a self-hosted instance operator, I want a first-run setup page so that I can create the initial organization and owner.

**Acceptance criteria**
- Setup displays the current hostname and allows confirmation of the canonical host.
- Hostnames such as DuckDNS names may resolve to a private LAN address when accessed over valid HTTPS.
- Completing setup disables the initial bootstrap flow.

## MVP: Integration and First Delivery

### US-01 — Configure a resource (Must)
As an authorized organization user, I want to register website resources so that each site's subscriptions and subscriber limit are kept separate.

**Acceptance criteria**
- I can create and view resources scoped to my organization.
- Invalid origins and missing required configuration are rejected with a clear message.
- Each resource has a stable ID, allowed origins, a public SDK identifier, a VAPID public key, and a subscriber limit.
- Separate site ownership verification is not required for the internal prototype.

### US-02 — Integrate with an existing worker (Must)
As a website developer, I want clear SDK and Service Worker instructions so that I can enable push without breaking caching or PWA behavior.

**Acceptance criteria**
- Instructions cover the supported native worker pattern and identify tested Workbox/Vite PWA patterns.
- The SDK does not silently replace an existing Service Worker.
- I can diagnose unsupported configuration and permission states.

### US-03 — Register a visitor subscription (Must)
As a website visitor, I want to opt in to push notifications so that I can receive useful updates from the site.

**Acceptance criteria**
- Permission is requested after an explicit site action.
- Granted permission creates or refreshes a subscription associated with the correct resource.
- Unsubscribe immediately deletes the subscription record; a definitive expired endpoint does the same.
- Name and email fields may exist in the data model but are not collected or used initially.

### US-04 — Send a test notification (Must)
As a developer, I want to send a test notification to an eligible subscription so that I can verify my integration.

**Acceptance criteria**
- The test uses the configured site and VAPID credentials.
- The result distinguishes accepted, failed, and not-attempted states.
- The UI does not claim that provider acceptance proves display.

## MVP: Campaign Operations

### US-05 — Create and send a campaign (Must)
As a campaign operator, I want to create a message and send it to a site's active subscribers so that I can communicate an update.

**Acceptance criteria**
- Title, message, destination, and target site are validated.
- I can review the audience/site before sending.
- The system records campaign progress and outcomes.

### US-06 — Schedule a campaign (Should)
As a campaign operator, I want to schedule a campaign for a future time so that it is sent when intended.

**Acceptance criteria**
- Past or invalid schedule times are rejected.
- A campaign is not eligible before its scheduled time.
- The schedule and timezone interpretation are visible and documented.

### US-07 — Review delivery outcomes (Must)
As a campaign operator, I want to see accepted, failed, and clicked counts so that I can understand processing results.

**Acceptance criteria**
- Counts are scoped to my account and selected resource.
- Provider acceptance is not labeled as display or read.
- Failures include actionable categories without exposing secrets.

### US-08 — Clean invalid subscriptions (Must)
As a platform operator, I want expired subscriber records deleted so that repeated sends do not waste capacity.

**Acceptance criteria**
- Definitive expired/unregistered endpoint errors delete the subscriber immediately.
- Transient failures follow bounded retry policy and remain separately reported.

## Platform and Security

### US-09 — Enforce organization and permission access (Must)
As an organization user, I want data limited to my organization and assigned permissions so that subscriber and campaign data stays private.

**Acceptance criteria**
- API authorization applies to every organization-scoped resource.
- Direct requests with another organization's origin/resource ID are denied.
- Manual prototype checks cover read and write access paths; automated security tests are deferred until after the prototype.

### US-10 — Group users and grant permissions (Must)
As an organization owner, I want to assign users to roles and grant permissions to a user or role so that collaborators receive the access they need.

**Acceptance criteria**
- Roles group users; permission grants determine allowed actions.
- Direct-user and role grants are resolved consistently in the API.
- Users and roles from a different organization origin cannot be assigned or used.

### US-11 — Discover API contracts in Swagger (Must)
As a frontend or SDK developer, I want browsable API documentation so that I can integrate against the same route and payload contract as the backend.

**Acceptance criteria**
- Swagger UI is available at `/api-docs/` and loads the OpenAPI document and shared schemas from the same directory.
- Documentation covers current-user authentication/profile operations, generated user/role/permission/vendor CRUD routes, and Web Push endpoints.
- The spec identifies endpoints that are planned or under development and reflects actual status codes and security middleware.

### US-12 — Manage Soochak through the dashboard (Must)
As an organization owner or operator, I want a dashboard for notifications, subscribers, sites, and account administration so that I can operate Soochak without direct API calls.

**Acceptance criteria**
- The dashboard provides overview, notifications, compose/send, subscribers, sites/resources, push configuration, administration, organization settings, and profile/security pages.
- Pages clearly distinguish connected data from seeded/demo data and unavailable API operations.
- The UI does not report a notification as delivered based only on event emission or provider acceptance.
- Authentication, tenant scoping, and permission decisions are enforced by the backend, not only by frontend route guards.

## Future Candidates

Subscriber segmentation, campaign duplication/cancellation, advanced analytics, exports, plan limits, audit log UI, and localization need prioritization after MVP learning. Story priorities are provisional and should be refined with pilot users.
