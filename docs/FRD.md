# Functional Requirements Document (FRD)

**Product:** Soochak by BizBandhan  
**Status:** Draft; requirements are planned, not implemented unless marked in the root README. Updated 2026-10-29.

## 1. Scope

This document translates the PRD into observable behavior for the planned Web Push platform. The current code includes auth model scaffolds and prototype push flows. Organization CRUD routes are published; the target reviewed registration, operator management portal, complete owner bootstrap, and login flows are not yet implemented.

## 2. Functional Requirements

### User and resource access
- **FR-01:** A user can be created with an organization and log in to that organization only after the organization is active.
- **FR-02 (prototype):** Each user is assigned one unique Soochak dashboard/API hostname. The incoming hostname alone identifies the user's prototype workspace and is the data-scope key; no separate tenant entity or tenant ID is introduced during the prototype. The customer's website origin is separate Web Push configuration and is not the Soochak hostname or scope key. After market validation, the team may decide to introduce a separate tenant concept; that decision requires an explicit migration plan and is not a prototype prerequisite.
- **FR-03:** Public self-service registration accepts organization `name`, `slug`, canonical customer website origin, and owner account details (username, name, sex, date of birth, contact email, optional phone/timezone, and password). Store passwords only as secure hashes.
- **FR-04:** Self-service submission creates a pending organization and owner account without tenant dashboard/API access, then provisions the owner role and initial grants. The organization remains inactive until a platform operator approves it and required provisioning succeeds.
- **FR-05:** A protected platform-operator portal is hosted at `mgmt.soochak.optiwari.duckdns.org` in local development and `mgmt.soochak.bizbandhan.com` in production. It supports approval, request-changes, and rejection with a reason. Notify applicants by email at the submitted contact address; in this phase, that address is not treated as verified identity.
- **FR-06:** An applicant whose request needs changes can sign in with the chosen password to a restricted registration area and edit/resubmit. This access must not grant tenant dashboard/API access. Rejected applicants must submit a new registration.
- **FR-07:** Platform operators can create organizations directly without applicant review. Such organizations activate only after owner and authorization-record provisioning succeeds. Operator-supplied initial owner passwords are communicated outside the system and must be changed at first login.
- **FR-08:** Email verification, customer website/dashboard hostname ownership verification, custom dashboard domains, and payment collection for plans are deferred. Self-hosted installations are a separate deployment path; central configuration/update synchronization is future work.
- **FR-09:** Roles group users within an organization. Permissions grant explicit actions to a user or role. The authorization policy defines how direct-user grants combine with role grants.
- **FR-10:** Organization admins can manage users and assign roles; during the prototype, management operations are scoped to the workspace resolved from the user's unique Soochak hostname and checked against the caller's effective permissions.
- **FR-11:** A resource represents a website integration and owns its subscribers and subscriber limit. During the prototype, resource, subscriber, campaign, and report operations verify the hostname-resolved workspace scope and authorization on the server.
- **FR-12:** A self-hosted organization may use a hostname such as a DuckDNS name that resolves to a private LAN IP, provided the browser accesses it over valid HTTPS. Raw remote HTTP access by private IP is not a supported push context.
- **FR-13:** A customer's website origin must be canonicalized and unique. Formal ownership verification is deferred from the initial registration gate.

### Website setup and SDK
- **FR-14:** An authenticated user with permission can create a resource with a name, site origin, allowed origins, public identifier, VAPID public key, and subscriber limit.
- **FR-15:** The UI/API provides resource-specific public SDK configuration and integration instructions.
- **FR-16:** The SDK can request permission only in response to a site-controlled user action, create a browser push subscription, and register or refresh it with the API.
- **FR-17:** The integration can coexist with an existing Service Worker. Setup instructions explain the necessary worker changes for supported patterns; no worker is silently replaced.
- **FR-18:** Delete a subscription immediately after unsubscribe or a definitive expired/unregistered endpoint response; transient send errors do not delete it.
- **FR-19:** Subscriber name and email fields may exist in the schema but are not collected or used during the prototype.

### Campaigns and delivery
- **FR-20:** An authorized operator can draft a campaign with title, message, optional icon/image, destination URL, and target website.
- **FR-21:** The operator can send immediately or schedule a campaign for a future time. Invalid content, unauthorized sites, and unsupported schedule values are rejected with actionable errors.
- **FR-22:** The system records campaign state and creates durable delivery work for eligible active subscriptions.
- **FR-23:** Workers send using Web Push and configured VAPID credentials, apply bounded retries for transient failures, and avoid duplicate work where supported by idempotency keys.
- **FR-24:** Delete a subscriber on a definitive expired/unregistered endpoint response; transient failures remain distinguishable and do not delete the record.
- **FR-25:** Operators can inspect campaign totals and per-campaign processing outcomes: queued, attempted, provider accepted, failed, and clicked where observed.

### Reporting and operations
- **FR-26:** Notification click handling records a click event and opens the configured destination safely.
- **FR-27:** Dashboard views show active subscriber totals and campaign history scoped to the user's organization and selected resource.
- **FR-28:** Operators can distinguish provider acceptance from actual notification display; no read/display claim is inferred from acceptance.
- **FR-29:** Platform services emit structured logs and health information sufficient to investigate API, scheduler, and worker failures.

## 3. Core Data Records

Planned entities: Organization, registration/review state, User, Role, Permission, Resource, Subscriber, EnvironmentVapidKey, Campaign, DeliveryAttempt, and ClickEvent. During the prototype, each User has one unique Soochak dashboard/API hostname, and that hostname—not a separate tenant entity or ID—is the authorization/data-scope key. Store the customer's website origin separately as Web Push configuration. Reconsider a distinct tenant model only after market validation and plan its migration explicitly. Organization name and slug are required; usage-limit shape remains open. Each environment has one shared VAPID key pair; each resource stores the public key, while the environment-level private key is encrypted in the database. The AES key is kept outside the database in backend secret configuration. Exact schemas and indexes remain implementation work. Development and live use separate key pairs.

## 4. External Interfaces

- A standalone React/Vite dashboard lives in `codebase/frontend/`; it has routes for login, organization registration, dashboard, notifications, sites/resources, subscribers, push config, administration, settings, and profile/security. It is separate from the Compose services and currently combines live API adapters with seeded/simulated data. See `docs/FRONTEND.md` for the page-by-page integration status.
- Browser SDK uses HTTPS APIs and standard Push API/Service Worker capabilities.
- OpenAPI documentation and Swagger UI are provided in `codebase/backend/public/api-docs/`; `openapi.yml` references reusable schemas in `schemas.yml`.
- Current-user contract: `/api/v1/auth` and `/api/v1/me` are alternative paths. `GET` returns auth status and user details; `POST` changes the current user's password; `PUT` logs in and starts an httpOnly cookie session (the token is never returned in the body); `PATCH` updates profile details; `DELETE` clears the session cookie. These are special routes implemented outside `CrudRoutes` and do not follow the CRUD method policy.
- CRUD API policy: resources use the same method mapping. Collection `GET /` reads all records; collection `POST /` reads all records filtered by body parameters (a query, not a create); collection `PUT /` creates a record; `GET /{id}` reads one record; `PUT /{id}` updates it; `DELETE /{id}` deletes it; `PATCH /{id}` reorders it with body `{ "action": "move-up" | "move-down" }`. Resources where ordering is not meaningful disable `PATCH` (organizations return 405). Exception: `PUT /api/v1/auth/user` returns 405 in the prototype because each hostname is a personal workspace for exactly one user; organization registration provisions that user.
- Organization CRUD is published at `/api/v1/auth/organization` using `CrudRoutes` and follows the CRUD API policy above; `PATCH` is rejected with 405. Creation accepts an optional `plan` (`free`, `growth` or `scale`, default `free`); the server derives `limits` from the plan and ignores client-supplied limits. Owner `sex` is accepted in lowercase and normalised, `phone` must be E.164 when present, and `timezone` must be a valid IANA zone. Collection creation is available only on the configured platform signup hostname; list/query/read/update/delete require `isAuthenticated` and remain scoped to request origin. This endpoint is not yet an operator-review workflow.
- The current organization collection `PUT` derives the personal workspace hostname from the organization slug and configured `HOSTED_DOMAIN`, creates the organization under that hostname, and synchronously provisions the sole owner plus role/permission records. It returns `workspaceHost` and `workspaceUrl` but does not set a session cookie on the shared signup hostname; the owner signs in at the returned workspace. The organization is rolled back on provisioning failure; an occupied hostname or conflicting owner record returns 409. This endpoint does not create review states, lock an owner pending approval, expose a protected operator review portal, send status emails, or support changes/rejection.
- During the prototype, the bootstrap must scope workspace data by the user's unique Soochak dashboard/API hostname, not by the customer's website origin. A separate tenant entity/ID is deferred until after market validation. Email/hostname ownership checks and plan payments are later-phase gates, not initial activation requirements.
- The default role/grant policy is an initial owner-only seed and should be reviewed before broader use.
- Planned CRUD contracts use `/api/v1/auth/user`, `/role`, `/permission`, and `/vendor`. `CrudRoutes.publish()` provides the policy methods. During the prototype, a hostname is assigned to exactly one user, so collection `PUT /auth/user` returns 405; organization registration provisions the sole workspace owner. Other available user operations require a session and the corresponding `auth:user` permission grant. Role, permission and vendor routes are not wired yet; vendor fields/model are not defined yet.
- Web Push routes: `GET /api/v1/web-push/config`; `/subscriber` follows the CRUD API policy: collection `GET` list, `POST` query, `PUT` create; `/{id}` `GET` read, `PUT` update, `DELETE` delete; `PATCH` returns 405 (subscribers are not ordered). `PUT /` (create, requires an https endpoint and `p256dh`/`auth` keys, upserts by endpoint) and `DELETE /{id}` are public for the browser SDK, which stores the returned id; all other subscriber operations require authentication. `PUT /notify` persists a notification and emits a delivery event. `GET`, `POST`, `PATCH`, and `DELETE /notify` currently return 502 as under development.
- The OpenAPI contract shows bearer authentication on auth/user-management operations, but the inspected Web Push handlers do not show auth middleware. Security enforcement must be implemented and the spec kept aligned before external use.
- `isAuthenticated` accepts an `authorization` cookie or `Authorization: Bearer <JWT>` header, verifies the token with `Token.verify()`, requires a user ID and request origin, and rejects a token whose origin differs from the request origin. The cookie value must currently use the `Bearer <JWT>` format.
- After token and origin checks, the guard sets the request on `userController` and loads the active user with `userController.list({ _id: user._id })`. The controller applies the request-origin scope; the resulting user record is attached to `req.user`.
- Protected operations also need `isAuthorized(resource, action)` (or an equivalent policy middleware) to resolve the user's direct grants and role grants from organization-scoped permission records. Define how grants combine and what `own`, `organization`, and `all` scopes mean before relying on them.
- The guard is wired to organization list/query/read/update/delete routes, but other protected APIs are not yet covered by complete authentication/authorization. Its token-mismatch response includes decoded token data, and the installed `Token.verify()` helper logs invalid token strings; remove these disclosures before relying on it. Cookie token extraction also assumes the `Bearer <JWT>` format and should reject malformed schemes consistently.
- Login now submits `{ user, password }` end to end. The backend returns user details with `Male`/`Female`/`Other`; the dashboard lower-cases them when reading the user.
- MongoDB stores application state. NATS JetStream and a separate delivery worker are later-stage components, not part of the initial Compose stack.
- Browser push services receive Web Push requests authenticated with VAPID.

## 5. Acceptance Scenarios

1. Public self-service registration creates an organization with a unique user dashboard hostname separate from the customer website origin, a locked-for-workspace-access owner account, and a pending-review state; secrets are never returned.
2. The operator can approve, request changes, or reject with a reason; the applicant receives status email, and requested changes are made from a restricted registration area without workspace dashboard access.
3. Approval activates an organization only after owner, role, and permission provisioning succeeds. Hostname ownership checks and email verification are not initial activation gates.
4. A direct operator-created organization skips applicant review, activates after provisioning succeeds, and requires the owner to change the operator-supplied initial password at first login.
5. A developer installs the SDK on a supported HTTPS test site, integrates with its existing worker, subscribes with user permission, and sees the endpoint registered to the correct organization/resource.
6. An operator sends a test campaign; processing states appear and provider failures are visible.
7. A permanently invalid endpoint is deleted and excluded from subsequent sends.
8. A user cannot read or alter another organization's resource, subscribers, campaigns, or reports by changing an ID or host value in an API request.
9. A scheduled campaign is not sent before its scheduled time and is processed after that time.

## 6. Validation and Error Behavior

Validate authentication, resource ownership, required fields, URL scheme, content bounds, schedule time, subscription shape, and request rate. Return stable machine-readable error codes with safe, useful messages. Never expose private keys or raw secrets in API responses or logs. Prototype verification is manual; automated tests are deferred until after the prototype.

## 7. Deferred Decisions

Account recovery, exact default/custom roles and permission semantics, DNS challenge method, API versioning, campaign editing/cancel semantics, timezone behavior, segmentation, export, public-user retention/consent rules, VAPID key rotation, and delivery concurrency limits require later product and technical decisions.
