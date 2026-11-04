# Soochak by BizBandhan

**A developer-first Web Push Notification Platform.**

Deliver the right message, at the right moment.

Soochak is a multi-tenant Web Push notification management platform designed to help businesses connect with website visitors through timely, relevant browser notifications.

Built with a focus on developer experience, reliable delivery, and compatibility with existing website infrastructure, Soochak aims to make Web Push integration straightforward without forcing developers to replace their existing Service Worker implementations.

> **Status:** Early-stage prototype — APIs, SDK interfaces, and architecture are subject to change.

## Vision

Make Web Push notifications accessible to businesses and developers through a simple integration, reliable delivery infrastructure, and an easy-to-use management platform.

Soochak is being designed to work with existing web applications, including websites that already use Service Workers for caching, offline functionality, or Progressive Web App (PWA) features.

## Key Features

### Web Push Notifications
- Browser-based push notification delivery using standard Web Push APIs.
- VAPID-based application server authentication.
- Notification titles, messages, icons, images, and destination URLs.
- Notification click handling and destination navigation.

### Developer-First SDK
- Lightweight, framework-independent JavaScript SDK.
- Simple website integration.
- Subscription registration and lifecycle management.
- A documented integration model for existing Service Workers.
- Compatibility paths for Workbox, Vite PWA, and custom Service Worker implementations.

### Campaign Management
- Create and manage notification campaigns.
- Send notifications immediately or schedule them.
- Target active subscribers associated with a website.
- Track campaign status and available delivery outcomes.

### Delivery Infrastructure
- MongoDB-backed application state.
- NATS JetStream for asynchronous job processing.
- Background workers for notification delivery.
- Retry handling, expired-subscription cleanup, and duplicate-job prevention.

### Multi-Tenant SaaS
- Each hosted organization gets a tenant-specific Soochak dashboard/API hostname, using `[tenant].soochak.optiwari.duckdns.org` in local development and `[tenant].soochak.bizbandhan.com` in production.
- The customer's primary website origin is collected separately for Web Push setup; it is not the dashboard/API hostname.
- Users, roles, permissions, and resources are scoped to the tenant organization. Users belong to one organization for now.
- Roles group organization users; permissions may be granted to a user or a role.
- Public self-service signup and platform-operator-created organizations are planned. Self-service organizations require operator approval before activation.
- Usage limits and paid plans are planned; billing flow and plan definitions are not yet selected.

### Analytics and Observability
- Campaign processing status.
- Provider-accepted notifications and delivery failures.
- Notification click tracking.
- Subscriber statistics and usage reporting.

*Features listed above describe the intended product direction; availability depends on implementation progress.*

## Architecture

The Compose topology defines `frontend`, `backend`, `db`, and `soochak` (the project-named NGINX gateway). The gateway joins the pre-existing external `publicweb` network so the server's NGINX Proxy Manager can route traffic to it. It also joins the stack's private network with the frontend, backend, and database; the backend addresses MongoDB by the service hostname `db`. By default, the gateway sends requests to `frontend:3000` in development or `frontend:80` in production. Requests whose URI starts with `/api` go to `backend:3000` in both environments. The gateway and database use the project-maintained `optiwariindia/gateway` and `optiwariindia/mongodb` images.

```yaml
services:
  soochak: # NGINX gateway; attached to publicweb and the stack network
  frontend: # React/Vite dashboard; selected by BUILD_TARGET
  backend: # Express API; attached to the stack network
  db:      # MongoDB; attached to the stack network
networks:
  soochak:     # Private network for this stack
  publicweb:   # Existing external network managed by the server environment
```

The prototype page at `codebase/backend/public/index.html` registers `/sw.js`, offers browser subscription controls, and has a test-notification form. The worker handles push display and notification clicks; customer integrations must account for existing customer Service Workers and must not replace them silently. The one-off send and auth flows are still being completed and have not yet passed an end-to-end check.

The backend contains an Express/Mongoose bootstrap, static serving configured for `codebase/backend/public/`, Web Push subscriber/config routes, an in-progress one-off notification route, and an organization CRUD route that emits asynchronous owner/role/permission provisioning. Login, reviewed onboarding, activation recovery, authorization policy, and verified end-to-end notification delivery remain unfinished. Email and customer website/dashboard hostname ownership verification are deferred from initial activation. The dashboard page inventory and known integration gaps are documented in [`docs/FRONTEND.md`](docs/FRONTEND.md); target user and delivery sequences are in [`docs/sequence.md`](docs/sequence.md).

### API Conventions

All CRUD resources use one method mapping: `GET /` reads all records, `POST /` reads all records filtered by body parameters, `PUT /` creates a record, `GET /:id` reads one, `PUT /:id` updates one, `DELETE /:id` deletes one, and `PATCH /:id` reorders one (`{ "action": "move-up" | "move-down" }`; disabled with 405 where ordering is meaningless). Details are in [`docs/FRD.md`](docs/FRD.md) and the OpenAPI spec at `codebase/backend/public/api-docs/openapi.yml`.

### Organization and Host Tenancy

The target hosted-SaaS model gives each organization a tenant-specific Soochak dashboard/API hostname. Local development uses `[tenant].soochak.optiwari.duckdns.org`; production uses `[tenant].soochak.bizbandhan.com`. The protected operator management hosts are `mgmt.soochak.optiwari.duckdns.org` for local development and `mgmt.soochak.bizbandhan.com` for production. The customer's primary website origin is separate data used for Web Push configuration. A user's tenant scope is tied to one organization; multi-organization Membership is deferred. The current backend instead derives `req.origin` from the incoming request host, so the data model and authorization middleware must be adapted to distinguish tenant host from customer website origin.

The planned public registration flow collects organization details, a canonical customer website origin, owner details, and an owner-chosen password. It creates the organization and an owner account that is blocked from tenant dashboard/API access while pending review. A platform operator reviews the request from the protected management host for the active environment. The operator can approve, request changes, or reject with a reason. Approval activates the tenant only after required owner/role/permission provisioning succeeds. Requested changes are sent to the submitted contact email; the owner can sign in to a restricted registration area to edit and resubmit, but cannot access the tenant dashboard before approval. The system also sends status emails; the address is a contact channel, not a verified identity in this phase.

Platform operators may also create organizations directly. This path skips applicant review and activates the tenant after owner and access-record provisioning succeeds. For these operator-created accounts, the operator supplies an initial password to the owner outside the system, and the owner must change it at first login. Secrets must not be included in logs, URLs, or documentation.

Email verification, customer website/dashboard hostname ownership verification, custom dashboard domains, and payment collection for plans are later-stage work, not gates in the initial registration flow. Hosted SaaS uses a Soochak tenant subdomain initially. Self-hosted deployments remain a separate installation option and may use their own hostname; synchronized configuration and updates from the management portal are a later-stage capability.

Roles are organization-scoped labels for grouping users. Permissions are explicit grants addressed to a user or a role (for example, `user:<id>` or `role:<id>`); the authorization policy must define how direct-user and role grants combine. Default role names and permission codes will be specified with the endpoint implementation. Organization `name` and `slug` are required; usage-limit fields remain experimental until limit types are decided.

For self-hosted instances, the dashboard/API host may be a dynamic DNS name such as `soochak.optiwari.duckdns.org`. It can resolve to a private LAN address and still support push when the browser accesses that hostname over valid HTTPS; the LAN test at `https://soochak.optiwari.duckdns.org` resolving to `192.168.0.145` has worked. A raw remote `http://<private-ip>` URL is not the supported push setup. Setup guidance should distinguish hostname resolution from HTTPS certificate provisioning. Formal hostname ownership verification is deferred from initial activation.

The longer-term platform is planned to add a browser SDK, campaign scheduling, and durable asynchronous delivery. NATS JetStream and separate workers are future architecture components, not required services in the initial Compose topology.

The planned end-to-end notification flow is:

```text
Customer Website
       |
       v
Soochak JavaScript SDK
       |
       v
Browser Push Subscription
       |
       v
Soochak backend (Express API)
       |
       +-----------> MongoDB
       |
       v
NATS JetStream (later milestone)
       |
       v
Notification Workers
       |
       v
Browser Push Service
       |
       v
Customer's Service Worker
       |
       v
Browser Notification
```

The longer-term architecture separates subscription management, campaign orchestration, and asynchronous delivery so that each component can evolve independently.

MongoDB is the persistent source of truth. NATS JetStream is proposed for a later milestone to transport durable notification jobs.

## Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 24 |
| Backend | Express.js |
| Database | MongoDB |
| Message streaming | NATS JetStream (planned later) |
| Prototype website integration page | `codebase/backend/public/index.html` |
| Dashboard | React, TypeScript, Vite, Tailwind CSS (`codebase/frontend/`) |
| Browser integration | JavaScript, Web Push API, Service Workers |
| Push authentication | VAPID |
| Prototype gateway | NGINX |
| Deployment | Docker Compose |

## Service Worker Compatibility

Many websites already use Service Workers for caching, offline support, application updates, or PWA functionality.

Soochak is designed to integrate with existing Service Worker implementations rather than silently replace them.

Planned integration targets include:

- Native JavaScript Service Workers.
- Workbox-based applications.
- Vite applications using `vite-plugin-pwa`.
- Custom PWA and offline-first implementations.

The integration approach will depend on the customer's existing worker configuration. Some setups may require importing a Soochak integration module or making a small change to the existing worker.

Soochak will not assume that registering a second Service Worker automatically provides whole-site notification support.

### Prototype Push Worker

`codebase/backend/public/sw.js` displays push payloads and handles notification clicks. It accepts JSON fields `title`, `body` (or `message`), `url` (or `data.url`/`data.clickUrl`), and optional `icon`, `image`, `badge`, and `tag`; plain-text payloads are shown as the body. Click and image destinations are limited to HTTP(S) URLs. The worker has no fetch handler and does not call `skipWaiting()` or `clients.claim()`.

This file is served from Soochak's own origin for prototype testing. A Service Worker script must be served from the same origin it controls. For a customer site, host the worker script on that site or merge these `push` and `notificationclick` handlers into its existing Service Worker; do not register this Soochak-hosted URL as a cross-origin worker or silently replace an existing worker.

## Project Structure

The repository contains Compose services for the frontend dashboard, backend, database, and gateway. The gateway route map sends non-API paths to the frontend, with `/api...` routed to the backend. Prototype checks are manual, so an automated test layout is not required yet.

```text
soochak/
├── codebase/
│   ├── backend/
│   │   ├── core/
│   │   │   └── server.js
│   │   ├── module/
│   │   │   └── index.js    # mounts organization and Web Push routes
│   │   ├── public/
│   │   │   ├── index.html # minimal page registering the Service Worker
│   │   │   └── sw.js      # prototype push/click handlers
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── package-lock.json
│   ├── frontend/           # React/Vite dashboard Compose service
│   ├── gateway/
│   │   ├── config/         # NGINX gateway configuration scaffold
│   │   └── logs/
│   └── db/
│       ├── store/
│       ├── config/
│       └── backup/
├── environment/
│   └── backend.env         # local DB and port settings; do not commit secrets
├── docker-compose.yml      # soochak gateway, frontend, backend, db
└── README.md
```

The Compose service keys are `soochak` (gateway, named for the project so Proxy Manager can address it), `frontend`, `backend`, and `db` (MongoDB hostname used by the backend). The gateway connects to the pre-created external `publicweb` network and the stack's private network; frontend, backend, and database connect only to the private network. MongoDB data, config, and backup directories are bind-mounted under `codebase/db/`.

## Development Roadmap

### Prototype Testing Approach

Prototype behavior will be checked manually using internal accounts and test devices. Automated unit, integration, and end-to-end tests, along with CI test checks, are deferred until after the prototype. Keep a repeatable manual checklist for permission outcomes, subscription lifecycle, notification receipt, click behavior, and failure cases.

### Phase 0 — Organization Bootstrap
- [ ] Implement public self-service registration that creates a pending organization and owner account without tenant access, then requires protected platform-operator approval.
- [ ] Add approve, request-changes, and reject-with-reason review outcomes, status emails, and a restricted registration area for applicants asked to make changes.
- [ ] Gate tenant activation on both operator approval and successful owner/role/permission provisioning.
- [ ] Add direct operator organization creation without applicant review; require successful provisioning and force initial password change at first login.
- [ ] Store the customer website origin separately from the hosted tenant dashboard/API hostname; assign a Soochak tenant subdomain by default.
- [ ] Add tenant-host authorization and login; defer Membership unless users need multiple organizations.
- [ ] Add the protected operator portal at `mgmt.soochak.optiwari.duckdns.org` locally and `mgmt.soochak.bizbandhan.com` in production.
- [ ] Add a first-run setup page for self-hosted deployments.
- [ ] Defer email verification, website/dashboard hostname ownership verification, custom dashboard domains, and plan payment until a later phase.

### Phase 1 — Browser Integration
- [ ] Implement the initial JavaScript SDK.
- [ ] Use one standards-based SDK across supported browsers, with capability checks and browser-specific handling only where required.
- [ ] Register and integrate a Service Worker.
- [ ] Handle browser permission and subscription flows.
- [ ] Generate and configure VAPID keys.
- [ ] Receive a real test notification in a browser.

### Phase 2 — Core Delivery Engine
- [ ] Implement subscription registration APIs.
- [ ] Persist subscriptions in MongoDB.
- [ ] Send notifications through Web Push.
- [ ] Handle expired subscriptions and provider errors.
- [ ] Add NATS JetStream and background workers.
- [ ] Implement bounded concurrency and retry handling.

### Phase 3 — Management Platform
- [ ] Build organization/user administration UI and custom role grouping with direct-user/role permission grants.
- [ ] Implement resource registration under an organization; formal verification of each customer website resource remains deferred.
- [ ] Build the campaign composer and campaign history.
- [ ] Add scheduling and basic analytics.
- [ ] Enforce tenant-organization authorization and implement usage limits.

### Phase 4 — Pilot Readiness
- [ ] Verify the integration in the pilot browser and operating-system combinations selected for customer use.
- [ ] Test Service Worker integration with Workbox and Vite PWA.
- [ ] Add automated integration and end-to-end tests (deferred until after the prototype).
- [ ] Test processing of up to 10,000 subscriptions.
- [ ] Add production logging, monitoring, and backup procedures.
- [ ] Prepare deployment and customer onboarding documentation.

## Getting Started

Soochak is under active development. Setup instructions will be finalized as the first working prototype becomes available.

### Prerequisites

- Node.js 24 or a compatible Docker environment.
- Docker Compose.
- Docker access to the configured MongoDB service.
- A browser supporting the Web Push APIs.
- HTTPS for development and live website integration.

### Environments and Browser Support

Soochak has two planned environments and no staging environment:

| Environment | Platform base origin |
|---|---|
| Development | `https://soochak.optiwari.duckdns.org` (tested on LAN with the hostname resolving to `192.168.0.145`) |
| Live | `https://soochak.bizbandhan.com` |

These are platform environment base origins. Routing policy:

| Environment | Management host | Tenant dashboard/API host |
|---|---|---|
| Local development | `mgmt.soochak.optiwari.duckdns.org` | `[tenant].soochak.optiwari.duckdns.org` |
| Production | `mgmt.soochak.bizbandhan.com` | `[tenant].soochak.bizbandhan.com` |

`[tenant]` is the tenant's assigned subdomain label. The customer website origin is a separate setting and is not used as the dashboard/API host.

The development hostname is covered by the available `*.optiwari.duckdns.org` TLS certificate. The live hostname is outside that wildcard domain and must have a valid certificate covering `soochak.bizbandhan.com` before it serves browser integrations.

The browser SDK is intended to use the same standards-based implementation across browsers that support Web Push. Browser and operating-system combinations are test targets, not separate SDK builds; capability detection and narrowly scoped compatibility handling may be needed where platform behavior differs. Pilot support should be documented for combinations actually tested, including Service Worker registration, permission and subscription creation, backend registration, notification receipt, and click-through behavior. The initial pilot browser and operating-system matrix is to be selected from the intended pilot users' devices.

### Configuration

The local `environment/backend.env` file currently supplies `DB` and `PORT` to the backend. Compose variable interpolation such as `BUILD_TARGET` is configured separately through the shell or a project `.env` file; it must select a Dockerfile target (`development` or `production`). Configuration will later include the active environment's site/API origin, authentication secrets, and VAPID key handling. Development and live origins are configured as documented above; there is no staging origin. NATS settings are later-stage. Keep secret-bearing files out of version control and add a safe example template as secrets are introduced.

**Never commit production credentials, VAPID private keys, or encryption secrets to version control.**

### Prototype Accounts and Resource Access

The planned onboarding flow creates an organization and its first owner account together. Hosted organizations use a tenant-specific Soochak dashboard/API hostname; the customer's canonical website origin is stored separately for Web Push setup. Users, roles, permissions, resources, and subscribers are scoped to the tenant organization. A separate Membership model is deferred because a user belongs to one organization in the current model. Roles group users; permissions are explicit user- or role-targeted grants. Every management API must enforce tenant scope and the caller's authorization.

The initial data model is:

```text
Organization
  id
  name (required)
  slug (required)
  tenantHost (required, unique hosted dashboard/API hostname)
  websiteOrigin (required, canonical customer website origin; ownership checks deferred)
  limits (experimental; structure TBD)

User
  id
  tenantHost (tenant dashboard/API scope)
  username/email
  password (secure hash only; never plaintext)
  role (organization role reference/identifier)

Role
  id
  tenantHost
  name
  description

Permission
  id
  tenantHost
  authorization (user or role principal)
  resource
  actions

Resource
  id (site/resource ID generated by Soochak)
  tenantHost (tenant organization scope)
  createdBy (user ID)
  name (optional label)
  siteUrl
  allowedOrigins
  publicKey (identifier for browser SDK use)
  vapidPublicKey (public VAPID key supplied to the browser SDK)
  maxSubscribers

EnvironmentVapidKey
  environment (development or live; unique)
  publicKey
  privateKeyEncrypted

Subscriber
  id
  resourceId
  endpoint
  p256dh
  auth
  name (optional)
  email (optional)
```

The current backend uses `origin` for host-based scoping; migrating to explicit tenant-host fields is part of implementing the target hosted SaaS model.

Subscriber records belong to a resource and should be uniquely identified by their push endpoint within that resource. Re-registering an endpoint updates its existing subscription record. The browser SDK may use a public resource key to identify the resource; browser-delivered code cannot keep a secret API key. Any server-to-server secret must be handled separately and stored as a hash.

### Prototype Subscriber Data and Consent

The running prototype is for internal users and devices managed by the project team. The target product includes public self-service registration with operator review, but this flow is not implemented yet. The browser's native notification permission prompt is still required, and the SDK requests permission only following an explicit user action. Prototype opt-in UI copy may be placeholder text. Notifications should use test content and internal test recipients.

Subscriber `name` and `email` fields are part of the planned schema for future personalization, but the prototype will not collect or use them. Delete a subscriber record immediately when the user unsubscribes. Also delete it when a push send receives a definitive expired/unregistered endpoint response (such as HTTP 404 or 410). Do not delete records for transient delivery errors such as timeouts or provider outages.

VAPID keys are shared by resources within an environment: development and live each use their own key pair. Each resource stores its VAPID public key in the database and supplies it to the SDK. Store each environment's shared VAPID key pair in an environment-level database record, with the private key encrypted using authenticated encryption (for example, AES-GCM). Decrypt it in the backend only when needed for signing push requests. Keep the encryption key separate from the database in backend secret configuration, never send either private key or encryption key to browsers, and never log plaintext key material. The process for rotating VAPID keys remains to be decided.

The current organization registration endpoint creates an organization record, then synchronously provisions the owner user, owner role and initial permission grants (rolling the organization back if provisioning fails), and signs the owner in by setting an `authorization` httpOnly cookie (`Bearer <JWT>`, 7 days; requires `JWT_SECRET` in `environment/backend.env`). The target public registration flow adds pending-review and locked-owner states, operator decisions, status emails, and activation only after approval and successful provisioning; these are not implemented yet. The initial hosted SaaS target uses a Soochak tenant subdomain, separate from the customer's website origin. Email and hostname ownership verification, payment collection, and custom dashboard domains are deferred. This is distinct from verifying each customer website resource: resource setup and SDK/Service Worker integration are expected to be performed by the organization configuring that website, and formal per-resource ownership verification remains deferred. Installing a Service Worker by itself is not a backend-verified ownership check.

### Current Prototype Scope and Target Registration

The running implementation remains an internal prototype for project-team organizations and test devices. The target product includes public self-service signup with platform-operator approval and a separate direct operator-created organization path; these flows are not yet implemented. Login and authorization remain unfinished. Formal customer website/dashboard hostname ownership verification, email verification, plan payments, custom dashboard domains, formal per-resource website ownership verification, a staging environment, and collection/use of subscriber names and email addresses remain deferred. Browser notification permission and explicit opt-in remain required.

Production readiness work remains outside the prototype decision scope and is tracked for later planning: public onboarding and abuse controls, formal site verification, privacy and consent requirements for external subscribers, VAPID key rotation, backup/restore and operational monitoring, load validation, and customer deployment/onboarding procedures. No VAPID rotation procedure has been selected yet.

### Local Development

The intended development Compose command uses the external `publicweb` network and the configured local backend environment file. The full application startup has not yet been verified:

```bash
git clone <repository-url>
cd soochak
BUILD_TARGET=development docker compose up --build
```

The `publicweb` Docker network must already exist. Use `BUILD_TARGET=production` for the production Dockerfile stage. These commands describe the current Compose setup; an end-to-end notification workflow is not implemented yet. To run the dashboard separately, see [`docs/FRONTEND.md`](docs/FRONTEND.md).

## Security and Privacy

Soochak is intended to follow these principles:

- Enforce tenant-organization scoping and caller permission checks for resources and subscriber data.
- Store only a secure hash in the `password` field; never store plaintext passwords.
- Treat browser SDK resource keys as public identifiers, not secrets.
- Use valid HTTPS for both development and live browser integrations.
- Protect stored subscription endpoints and encryption keys.
- Validate notification URLs and user-supplied content.
- Apply rate limits and configurable usage quotas.
- Respect browser permission and subscription revocation.
- Minimize collection and retention of personal data.

Web Push provider acceptance does not guarantee that a notification was displayed or seen by the recipient. Reporting will distinguish processing outcomes, provider responses, and observed clicks.

## Intended Use Cases

- E-commerce announcements and promotions.
- Content publishing and new-article notifications.
- SaaS product updates and alerts.
- Customer engagement campaigns.
- Website and application event notifications.
- Developer integrations requiring Web Push delivery.

## Product Identity

**Product:** Soochak  
**Hindi:** सूचक  
**Parent brand:** BizBandhan  
**Category:** Web Push Notification Management SaaS

**Product tagline:** The right message, at the right moment.

Product hostnames:

- `soochak.bizbandhan.com` — Product website.
- `mgmt.soochak.bizbandhan.com` — Production platform-operator management portal.
- `[tenant].soochak.bizbandhan.com` — Production tenant dashboard and API host.
- `cdn.soochak.bizbandhan.com` — SDK and static assets.

Local development equivalents use `mgmt.soochak.optiwari.duckdns.org` and `[tenant].soochak.optiwari.duckdns.org`.

These hostnames are proposed and require DNS configuration before deployment.

## Contributing

Soochak is an evolving project. Contributions, technical discussions, bug reports, and suggestions for improving Service Worker compatibility are welcome.

Before submitting changes:

1. Keep integrations framework-independent where possible.
2. Avoid replacing or interfering with existing Service Worker functionality.
3. Add tests for subscription lifecycle and delivery behavior.
4. Document browser compatibility and security implications.
5. Avoid committing secrets or production credentials.

Contribution guidelines will be expanded as the repository matures.

## License

The project license has not yet been specified. Licensing terms will be added before public distribution.

---

**Soochak by BizBandhan**  
Making Web Push notifications easier for developers and businesses.
