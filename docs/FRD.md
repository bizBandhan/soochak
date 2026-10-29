# Functional Requirements Document (FRD)

**Product:** Soochak by BizBandhan  
**Status:** Draft; requirements are planned, not implemented unless marked in the root README. Updated 2026-10-29.

## 1. Scope

This document translates the PRD into observable behavior for the planned Web Push platform. The current code includes auth model scaffolds and prototype push flows. Organization CRUD routes are now published; the complete organization-owner bootstrap and login flows are still unfinished.

## 2. Functional Requirements

### User and resource access
- **FR-01:** A user can be created with an organization and log in to that organization.
- **FR-02:** Each organization maps to exactly one canonical hostname. The canonical hostname is the tenancy origin used to scope organization, user, role, permission, resource, and subscriber records. The application does not use a separate organization ID or Membership model in the current design.
- **FR-03:** Organization registration accepts required organization `name`, `slug`, and expected hostname, plus owner account details. The owner details include username, name, sex, date of birth, email, optional phone/timezone, and password. Passwords are stored as secure hashes only.
- **FR-04:** `PUT /api/v1/auth/organization` creates the organization and owner, seeds default roles and permissions, assigns the owner role, and sends a welcome note. The origin must be canonicalized and unique. Registration must be implemented as a bootstrap flow because the request host may differ from the expected organization hostname.
- **FR-05:** Roles group users within an organization. Permissions grant explicit actions to a user or role. The authorization policy defines how direct-user grants combine with role grants. Default role names and permission codes are implementation decisions.
- **FR-06:** Organization admins can manage users and assign roles; all management operations are scoped to the request's organization origin and checked against the caller's effective permissions.
- **FR-07:** A resource represents a website integration and owns its subscribers and subscriber limit. All resource, subscriber, campaign, and report operations verify organization scope and authorization on the server.
- **FR-08:** A self-hosted organization may use a hostname such as a DuckDNS name that resolves to a private LAN IP, provided the browser accesses it over valid HTTPS. Raw remote HTTP access by private IP is not a supported push context.
- **FR-09:** The expected organization hostname cannot already be assigned. DNS verification is required before activation; whether verification uses a DNS routing check, TXT challenge, or both remains open.

### Website setup and SDK
- **FR-10:** An authenticated user with permission can create a resource with a name, site origin, allowed origins, public identifier, VAPID public key, and subscriber limit.
- **FR-11:** The UI/API provides resource-specific public SDK configuration and integration instructions.
- **FR-12:** The SDK can request permission only in response to a site-controlled user action, create a browser push subscription, and register or refresh it with the API.
- **FR-13:** The integration can coexist with an existing Service Worker. Setup instructions explain the necessary worker changes for supported patterns; no worker is silently replaced.
- **FR-14:** Delete a subscription immediately after unsubscribe or a definitive expired/unregistered endpoint response; transient send errors do not delete it.
- **FR-15:** Subscriber name and email fields may exist in the schema but are not collected or used during the prototype.

### Campaigns and delivery
- **FR-16:** An authorized operator can draft a campaign with title, message, optional icon/image, destination URL, and target website.
- **FR-17:** The operator can send immediately or schedule a campaign for a future time. Invalid content, unauthorized sites, and unsupported schedule values are rejected with actionable errors.
- **FR-18:** The system records campaign state and creates durable delivery work for eligible active subscriptions.
- **FR-19:** Workers send using Web Push and configured VAPID credentials, apply bounded retries for transient failures, and avoid duplicate work where supported by idempotency keys.
- **FR-20:** Delete a subscriber on a definitive expired/unregistered endpoint response; transient failures remain distinguishable and do not delete the record.
- **FR-21:** Operators can inspect campaign totals and per-campaign processing outcomes: queued, attempted, provider accepted, failed, and clicked where observed.

### Reporting and operations
- **FR-22:** Notification click handling records a click event and opens the configured destination safely.
- **FR-23:** Dashboard views show active subscriber totals and campaign history scoped to the user's organization and selected resource.
- **FR-24:** Operators can distinguish provider acceptance from actual notification display; no read/display claim is inferred from acceptance.
- **FR-25:** Platform services emit structured logs and health information sufficient to investigate API, scheduler, and worker failures.

## 3. Core Data Records

Planned entities: Organization, User, Role, Permission, Resource, Subscriber, EnvironmentVapidKey, Campaign, DeliveryAttempt, and ClickEvent. Organization tenancy is keyed by one unique canonical hostname stored as `origin`; records use the same origin for scoping. User-to-organization Membership is deferred. Organization name and slug are required; usage-limit shape remains open. Each environment has one shared VAPID key pair; each resource stores the public key, while the environment-level private key is encrypted in the database. The AES key is kept outside the database in backend secret configuration. Exact schemas and indexes remain implementation work. Development and live use separate key pairs.

## 4. External Interfaces

- A standalone React/Vite dashboard lives in `codebase/frontend/`; it has routes for login, organization registration, dashboard, notifications, sites/resources, subscribers, push config, administration, settings, and profile/security. It is separate from the Compose services and currently combines live API adapters with seeded/simulated data. See `docs/FRONTEND.md` for the page-by-page integration status.
- Browser SDK uses HTTPS APIs and standard Push API/Service Worker capabilities.
- OpenAPI documentation and Swagger UI are provided in `codebase/backend/public/api-docs/`; `openapi.yml` references reusable schemas in `schemas.yml`.
- Current-user contract: `/api/v1/auth` and `/api/v1/me` are alternative paths. `GET` returns auth status and user details; `POST` changes the current user's password; `PUT` logs in and generates a token; `PATCH` updates profile details; `DELETE` logs out.
- Organization CRUD is published at `/api/v1/auth/organization` using `CrudRoutes`: collection `GET` lists, `POST` queries, and `PUT` creates; `/{id}` supports `GET` read, `PUT` update, and `DELETE`; `PATCH` is rejected with 405. Collection creation is public for registration; list/query/read/update/delete require `isAuthenticated` and remain scoped to the request origin.
- Organization collection `PUT` accepts organization fields plus owner details. After the organization record is created, the controller emits `organization-created` through `eventStream` from `express-web-tools`. Its listener creates the owner user with a hashed password, creates the `owner` role, and seeds owner grants for the supported auth and Web Push resource names. This listener runs asynchronously; the HTTP response does not guarantee provisioning finished, and a listener failure does not roll back the organization.
- The current bootstrap still does not validate an expected hostname or perform DNS verification. Default role/grant policy is an initial owner-only seed and should be reviewed before broader use.
- Planned CRUD contracts use `/api/v1/auth/user`, `/role`, `/permission`, and `/vendor`. `CrudRoutes.publish()` provides collection `GET` (list), `POST` (query), `PUT` (create), and `/{id}` `GET` (read), `PUT` (update), `PATCH` (reorder), and `DELETE` (delete). The user/role/permission route publication is not wired in the inspected module router; vendor fields/model are not defined yet.
- Web Push routes: `GET /api/v1/web-push/config`; collection methods on `/subscriber` (`GET` list, `POST` query, `PUT` create, `PATCH` update by endpoint, `DELETE` delete by endpoint); `PUT /notify` persists a notification and emits a delivery event. `GET`, `POST`, `PATCH`, and `DELETE /notify` currently return 502 as under development.
- The OpenAPI contract shows bearer authentication on auth/user-management operations, but the inspected Web Push handlers do not show auth middleware. Security enforcement must be implemented and the spec kept aligned before external use.
- `isAuthenticated` accepts an `authorization` cookie or `Authorization: Bearer <JWT>` header, verifies the token with `Token.verify()`, requires a user ID and request origin, and rejects a token whose origin differs from the request origin. The cookie value must currently use the `Bearer <JWT>` format.
- After token and origin checks, the guard sets the request on `userController` and loads the active user with `userController.list({ _id: user._id })`. The controller applies the request-origin scope; the resulting user record is attached to `req.user`.
- Protected operations also need `isAuthorized(resource, action)` (or an equivalent policy middleware) to resolve the user's direct grants and role grants from organization-scoped permission records. Define how grants combine and what `own`, `organization`, and `all` scopes mean before relying on them.
- The guard is wired to organization list/query/read/update/delete routes, but other protected APIs are not yet covered by complete authentication/authorization. Its token-mismatch response includes decoded token data, and the installed `Token.verify()` helper logs invalid token strings; remove these disclosures before relying on it. Cookie token extraction also assumes the `Bearer <JWT>` format and should reject malformed schemes consistently.
- Frontend login currently submits `{ user, password }` while the OpenAPI login schema specifies `{ email, password }`. The frontend user model sends lowercase sex values while the backend enum accepts `Male`, `Female`, or `Other`. Resolve these contract mismatches before live integration.
- MongoDB stores application state. NATS JetStream and a separate delivery worker are later-stage components, not part of the initial Compose stack.
- Browser push services receive Web Push requests authenticated with VAPID.

## 5. Acceptance Scenarios

1. Organization registration creates one organization and its owner, default roles, and permissions for a unique expected hostname; secrets are never returned.
2. An unverified/duplicate hostname cannot activate an organization; successful DNS verification permits activation.
3. A developer installs the SDK on a supported HTTPS test site, integrates with its existing worker, subscribes with user permission, and sees the endpoint registered to the correct organization/resource.
4. An operator sends a test campaign; processing states appear and provider failures are visible.
5. A permanently invalid endpoint is deleted and excluded from subsequent sends.
6. A user cannot read or alter another organization's resource, subscribers, campaigns, or reports by changing an ID or host value in an API request.
7. A scheduled campaign is not sent before its scheduled time and is processed after that time.

## 6. Validation and Error Behavior

Validate authentication, resource ownership, required fields, URL scheme, content bounds, schedule time, subscription shape, and request rate. Return stable machine-readable error codes with safe, useful messages. Never expose private keys or raw secrets in API responses or logs. Prototype verification is manual; automated tests are deferred until after the prototype.

## 7. Deferred Decisions

Account recovery, exact default/custom roles and permission semantics, DNS challenge method, API versioning, campaign editing/cancel semantics, timezone behavior, segmentation, export, public-user retention/consent rules, VAPID key rotation, and delivery concurrency limits require later product and technical decisions.
