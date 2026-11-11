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
- **Prototype decision:** assign one unique Soochak dashboard/API hostname to each user. That hostname alone identifies the user's prototype workspace and is the scope key for its data; do not introduce a separate tenant entity or tenant ID during prototype development.
- Use `<slug>.bizbandhan.duckdns.org` in local development and `<slug>.soochak.bizbandhan.com` in production. The organization slug determines the user's workspace hostname. The customer's website origin is collected separately for Web Push setup and is not the Soochak hostname or prototype scope key.
- Revisit this model only after market validation. At that point, the product may introduce a tenant concept distinct from users and hostnames, with an explicit migration plan. Do not treat this future possibility as a prototype prerequisite.
- Roles, permissions, and resources are scoped within the hostname-identified prototype workspace. A user has one Soochak hostname during the prototype.
- Roles group organization users; permissions may be granted to a user or a role.
- Public self-service signup and platform-operator-created organizations are planned. Self-service organizations require operator approval before activation.
- Prototype plans (`free`, `growth`, `scale`) have server-defined subscriber and daily notification quotas; new subscriptions and notification requests are rejected when their workspace limit is reached. Billing and commercial plan terms are not yet selected.

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

The backend contains an Express/Mongoose bootstrap, static serving configured for `codebase/backend/public/`, cookie-based login and current-user routes, hostname-scoped organization/user APIs, Web Push subscriber/config routes, and an in-progress one-off notification route. Organization signup synchronously provisions its owner, role, and grants, then returns the slug-derived personal workspace URL; the owner signs in on that hostname. Reviewed onboarding, activation recovery, complete authorization, and verified end-to-end notification delivery remain unfinished. Email and customer website/dashboard hostname ownership verification are deferred. The dashboard page inventory and known integration gaps are documented in [`docs/FRONTEND.md`](docs/FRONTEND.md); target user and delivery sequences are in [`docs/sequence.md`](docs/sequence.md).

### API Conventions

CRUD resources use one method mapping: `GET /` reads all records, `POST /` reads all records filtered by body parameters, `PUT /` creates a record, `GET /:id` reads one, `PUT /:id` updates one, `DELETE /:id` deletes one, and `PATCH /:id` reorders one (`{ "action": "move-up" | "move-down" }`; disabled with 405 where ordering is meaningless). Exception: prototype `/api/v1/auth/user` collection `PUT` returns 405 because each hostname is a personal workspace for one user; organization registration provisions that user. Details are in [`docs/FRD.md`](docs/FRD.md) and the OpenAPI spec at `codebase/backend/public/api-docs/openapi.yml`.

### Organization and Host Tenancy

**Agreed prototype model:** each user has one unique Soochak dashboard/API hostname derived from the organization slug, and the incoming hostname is the sole prototype workspace identifier and data-scope key. Local development uses `<slug>.bizbandhan.duckdns.org`; production uses `<slug>.soochak.bizbandhan.com`. There is no separate tenant entity or tenant ID in the prototype. The backend must resolve the request hostname to its assigned user/workspace and enforce that scope on protected APIs; it must not confuse this Soochak hostname with the customer's website origin.

The customer's primary website origin is separate data used for Web Push configuration. The protected operator management hosts are `mgmt.bizbandhan.duckdns.org` for local development and `mgmt.soochak.bizbandhan.com` for production. Keep the prototype hostname-based approach through market validation. Only after market validation should the team consider introducing a separate tenant concept and plan the required data/auth migration; that future design is not a blocker for prototype work.

The eventual public onboarding flow is planned to collect organization details, a canonical customer website origin, owner details, and an owner-chosen password, then require review at the protected management host. The current prototype registration instead creates the organization and sole owner immediately, scopes their workspace to `<slug>.<HOSTED_DOMAIN>`, and returns a workspace URL. Registration does not set an auth cookie on the shared signup host; the owner must sign in on their assigned hostname.

Platform operators may also create organizations directly. This path skips applicant review and activates the tenant after owner and access-record provisioning succeeds. For these operator-created accounts, the operator supplies an initial password to the owner outside the system, and the owner must change it at first login. Secrets must not be included in logs, URLs, or documentation.

Email verification, customer website/dashboard hostname ownership verification, custom dashboard domains, and payment collection for plans are later-stage work, not gates in the initial registration flow. Hosted prototype workspaces use the organization slug as the subdomain under `HOSTED_DOMAIN`. Self-hosted deployments remain a separate installation option and may use their own hostname; synchronized configuration and updates from the management portal are a later-stage capability.

Roles are organization-scoped labels for grouping users. Permissions are explicit grants addressed to a user or a role (for example, `user:<id>` or `role:<id>`); the authorization policy must define how direct-user and role grants combine. Default role names and permission codes will be specified with the endpoint implementation. Organization `name` and `slug` are required; usage-limit fields remain experimental until limit types are decided.

For self-hosted instances, the dashboard/API host may be a dynamic DNS name such as `bizbandhan.duckdns.org`. It can resolve to a private LAN address and still support push when the browser accesses that hostname over valid HTTPS. A raw remote `http://<private-ip>` URL is not the supported push setup. Setup guidance should distinguish hostname resolution from HTTPS certificate provisioning. Formal hostname ownership verification is deferred from initial activation.

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
- [x] Implement prototype signup on the configured platform hostname: validate the organization slug, derive the workspace hostname from `HOSTED_DOMAIN`, create the organization, and provision its owner/role/permissions with rollback on failure.
- [x] Return the assigned `workspaceHost` and `workspaceUrl` without setting a session cookie on the shared signup hostname; link the owner to sign in on the personal workspace.
- [x] Enforce one personal-workspace owner per hostname, reject additional user creation, validate `HOSTED_DOMAIN` at startup, and align the registration UI and OpenAPI contract.
- [x] Verify signup, owner login, and cross-host session rejection against local MongoDB through the gateway; public NGINX Proxy Manager ingress was not exercised in this smoke test.
- [ ] Implement the later public self-service review workflow: pending organization, locked dashboard/API access, protected operator approval, and activation only after approval and provisioning.
- [ ] Add approve, request-changes, and reject-with-reason review outcomes, status emails, and a restricted registration area for applicants asked to make changes.
- [ ] Gate workspace access on both operator approval and successful owner/role/permission provisioning.
- [ ] Add direct operator organization creation without applicant review; require successful provisioning and force initial password change at first login.
- [x] Derive one unique Soochak dashboard/API hostname per user from the organization slug and use it as the sole prototype workspace identifier; keep the customer website origin separate.
- [x] Route nested development workspace hostnames to the development frontend/API stack; other hosts continue to use production routing.
- [x] Configure wildcard DNS and TLS coverage for slug-based workspace hostnames via NGINX Proxy Manager on the external `publicweb` network (managed outside this repository).
- [x] Scope prototype signup provisioning and user records by the hostname-derived workspace; defer a separate tenant entity/ID until after market validation.
- [ ] Complete and verify authorization and data isolation across all protected APIs using the hostname-resolved workspace.
- [ ] Add the protected operator portal at `mgmt.bizbandhan.duckdns.org` locally and `mgmt.soochak.bizbandhan.com` in production.
- [ ] Add a first-run setup page for self-hosted deployments.
- [ ] Defer email verification, website/dashboard hostname ownership verification, custom dashboard domains, and plan payment until a later phase.

### Phase 1 — Browser Integration
- [ ] Implement the initial JavaScript SDK.
- [ ] Use one standards-based SDK across supported browsers, with capability checks and browser-specific handling only where required.
- [ ] Register and integrate a Service Worker.
- [ ] Handle browser permission and subscription flows.
- [x] Generate per-organization VAPID keys and encrypt private keys at rest.
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
| Development | `https://bizbandhan.duckdns.org` |
| Live | `https://soochak.bizbandhan.com` |

These are platform environment base origins. Routing policy:

| Environment | Management host | User dashboard/API host (prototype) |
|---|---|---|
| Local development | `mgmt.bizbandhan.duckdns.org` | `<slug>.bizbandhan.duckdns.org` |
| Production | `mgmt.soochak.bizbandhan.com` | `<slug>.soochak.bizbandhan.com` |

`<slug>` is the organization slug and unique subdomain label assigned to one user. During the prototype, this hostname alone identifies and scopes that user's workspace; the customer's website origin is a separate setting and is not used as the dashboard/API host. A distinct tenant entity is deferred until after market validation.

Set backend `HOSTED_DOMAIN` to `bizbandhan.duckdns.org` for development or `soochak.bizbandhan.com` for production. Registration is accepted only at that exact signup hostname; it assigns `<slug>.<HOSTED_DOMAIN>` and returns its HTTPS URL. The gateway routes `bizbandhan.duckdns.org` and `*.bizbandhan.duckdns.org` to the development frontend/API stack; other hostnames use production routing. DNS and trusted TLS certificates for the signup and workspace hostnames are managed separately in NGINX Proxy Manager on the external `publicweb` Docker network and are not configured in this repository.

Use HTTPS for both signup and the workspace dashboard: state-changing cookie-authenticated API requests reject HTTP origins. Changing the gateway or `HOSTED_DOMAIN` does not migrate existing hostname-scoped workspace data. Preserve or deliberately reset development data separately, and recreate the backend after editing its environment file:

```bash
docker compose up -d --no-deps backend
```

For a fresh database, register at `https://bizbandhan.duckdns.org`, then sign in at the workspace URL returned by registration. A database reset removes accounts, subscribers, and VAPID keys; existing demo clients and browser subscriptions must be set up again as described in the [demo instructions](codebase/demo-site/README.md).

The browser SDK is intended to use the same standards-based implementation across browsers that support Web Push. Browser and operating-system combinations are test targets, not separate SDK builds; capability detection and narrowly scoped compatibility handling may be needed where platform behavior differs. Pilot support should be documented for combinations actually tested, including Service Worker registration, permission and subscription creation, backend registration, notification receipt, and click-through behavior. The initial pilot browser and operating-system matrix is to be selected from the intended pilot users' devices.

### Configuration

Copy `.env.example` to `.env` for Compose settings and `environment/backend.env.example` to `environment/backend.env` for backend runtime settings. Replace the example JWT secret with a generated secret of at least 32 characters (for example, `openssl rand -base64 48`), set `VAPID_ENCRYPTION_KEY` to a separate random 32-byte key encoded as 64 hex characters (generate with `openssl rand -hex 32`), and use `HOSTED_DOMAIN=soochak.bizbandhan.com` in production. Back up the VAPID encryption key securely: replacing or losing it makes existing private keys unreadable. The backend validates these values, `PORT`, the MongoDB URL, and the hosted domain before connecting. Compose's `BUILD_TARGET` must select a Dockerfile target (`development` or `production`). Development and live origins are configured as documented above; there is no staging origin. NATS settings are later-stage. Never commit the generated secrets or the local environment files.

The backend exposes `/api/v1/health/live` for process liveness and `/api/v1/health/ready` for MongoDB readiness; readiness returns HTTP 503 when MongoDB is disconnected. Docker Compose uses the readiness endpoint for the backend health status.

Run VAPID generation and route integration tests against the configured MongoDB service with `docker compose exec -T backend node --test core/vapid.test.js core/vapid-routes.test.js`. The tests use a separate `soochak_vapid_tests` database and clean up their own records.

Run downloaded integration-kit tests with `docker compose exec -T frontend node --import tsx --test src/services/integrationKit.test.ts`. Under Sites & Allowed Origins, register each exact HTTPS website origin, then download the client module and worker handler. Host both on the customer's website; merge or import the handler into an existing worker instead of replacing it. The client uses the workspace API without cookies and prompts for permission only when its subscribe function is called from a user action. Site-origin CORS is limited to public config and subscription endpoints and does not establish domain ownership or protect them against non-browser clients. Removing an origin blocks future cross-origin browser calls but does not delete subscribers.

Run frontend HTTP error handling tests with `docker compose exec -T frontend node --import tsx --test src/services/httpApi.test.ts` and provider status tests with `docker compose exec -T backend node --test core/notification-status.test.js`. The dashboard does not substitute simulated success when API requests fail. Notification history shows queued, in-progress, provider-accepted, provider-rejected, expired, and unknown counts. Provider acceptance is not device delivery; device display and click tracking are planned for the next version. Notifications created before status tracking show status unavailable.

Dispatch runs in-process, not in a durable queue. On a lost dispatcher heartbeat, queued or in-progress attempts become unknown after two minutes; uncertain sends are not automatically resent. Network errors also produce unknown outcomes. HTTP 404/410 provider responses are reported as expired, but subscriptions are not automatically removed. A saved notification or provider acceptance does not confirm display.

The frontend image excludes host `node_modules` and `dist`; Vite keeps its development dependency cache in `node_modules/.vite-soochak` inside the container.

For real-browser testing, `codebase/demo-site/` contains a framework-free static demo. Follow its [hosting and integration instructions](codebase/demo-site/README.md) to deploy it on a separate HTTPS site and use workspace-generated client and worker downloads.

**Never commit production credentials, VAPID private keys, or encryption secrets to version control.**

### Prototype Accounts and Resource Access

The planned onboarding flow creates an organization and its first owner account together. For the prototype, each user has one unique Soochak dashboard/API hostname, which is the sole workspace lookup and data-scope key; there is no separate tenant entity or ID. The customer's canonical website origin is stored separately for Web Push setup. Roles, permissions, resources, and subscribers are scoped within the hostname-identified workspace. Reconsider a separate tenant concept only after market validation, with an explicit migration plan. Every management API must enforce the resolved hostname scope and the caller's authorization.

The initial data model is:

```text
Organization
  id
  name (required)
  slug (required)
  websiteOrigin (required, canonical customer website origin; ownership checks deferred)
  limits (server-derived maxSubscribers and maxNotificationsPerDay)

User
  id
  origin (one unique Soochak dashboard/API hostname per user; prototype workspace scope key)
  username/email
  password (secure hash only; never plaintext)
  role (workspace role reference/identifier)

Role
  id
  origin (assigned Soochak hostname)
  name
  description

Permission
  id
  origin (assigned Soochak hostname)
  authorization (user or role principal)
  resource
  actions

Resource
  id (site/resource ID generated by Soochak)
  origin (hostname-resolved prototype workspace scope)
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

The current backend uses `origin` for host-based scoping. The prototype implementation should resolve this Soochak request hostname to the assigned user/workspace and keep it distinct from `websiteOrigin`; introducing a separate tenant ID/model is explicitly deferred until after market validation.

Subscriber records belong to a resource and should be uniquely identified by their push endpoint within that resource. Re-registering an endpoint updates its existing subscription record. The browser SDK may use a public resource key to identify the resource; browser-delivered code cannot keep a secret API key. Any server-to-server secret must be handled separately and stored as a hash.

### Prototype Subscriber Data and Consent

The running prototype is for internal users and devices managed by the project team. The target product includes public self-service registration with operator review, but this flow is not implemented yet. The browser's native notification permission prompt is still required, and the SDK requests permission only following an explicit user action. Prototype opt-in UI copy may be placeholder text. Notifications should use test content and internal test recipients.

Subscriber `name` and `email` fields are part of the planned schema for future personalization, but the prototype will not collect or use them. Delete a subscriber record immediately when the user unsubscribes. Also delete it when a push send receives a definitive expired/unregistered endpoint response (such as HTTP 404 or 410). Do not delete records for transient delivery errors such as timeouts or provider outages.

Each organization has its own VAPID key pair, shared by its resources within that environment. Keys are generated at registration or, for older organizations without keys, on successful login or first public configuration request. The public config endpoint resolves the organization by request hostname. The private key is encrypted with AES-256-GCM in the database and decrypted only for signing push requests; the encryption key is separate backend secret configuration. Never send or log private keys or the encryption key. The former shared prototype key is no longer used: any subscription created with it must be recreated using the organization's public key. Key rotation remains to be decided.

The registration endpoint accepts requests only on the configured platform signup hostname, creates the organization under the slug-derived workspace hostname, and synchronously provisions its owner, role, and initial permission grants. It rolls back the organization if provisioning fails and returns workspaceHost and workspaceUrl without issuing a session cookie on the shared signup hostname; the owner must sign in at the returned workspace URL. Pending-review states, operator decisions, and status emails remain unimplemented. Email and hostname ownership verification, payment collection, custom dashboard domains, and formal customer website resource verification remain deferred.

### Current Prototype Scope and Target Registration

The running implementation remains an internal prototype for project-team organizations and test devices. Slug-based self-service registration and cookie-session login are implemented. Hostname-scoped authentication and permission checks are wired on the current protected APIs; role, permission, and vendor APIs and authorization verification remain unfinished. The target product's platform-operator review workflow and separate direct operator-created organization path are not yet implemented. Formal customer website/dashboard hostname ownership verification, email verification, plan payments, custom dashboard domains, formal per-resource website ownership verification, a staging environment, and collection/use of subscriber names and email addresses remain deferred. Browser notification permission and explicit opt-in remain required.

Production readiness work remains outside the prototype decision scope and is tracked for later planning: public onboarding and abuse controls, formal site verification, privacy and consent requirements for external subscribers, VAPID key rotation, backup/restore and operational monitoring, load validation, and customer deployment/onboarding procedures. No VAPID rotation procedure has been selected yet.

### Local Development

The development Compose command uses the external `publicweb` network and local environment files:

```bash
git clone <repository-url>
cd soochak
cp .env.example .env
cp environment/backend.env.example environment/backend.env
# Replace JWT_SECRET in environment/backend.env with a generated secret.
BUILD_TARGET=development docker compose up --build
```

The `publicweb` Docker network must already exist. Use `BUILD_TARGET=production` for the production Dockerfile stage. Stop the stack with `docker compose down`. These commands describe the current Compose setup; an end-to-end notification workflow is not implemented yet. To run the dashboard separately, see [`docs/FRONTEND.md`](docs/FRONTEND.md).

## Security and Privacy

Soochak is intended to follow these principles:

- Enforce hostname-resolved workspace scoping and caller permission checks for resources and subscriber data.
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
- `<slug>.soochak.bizbandhan.com` — Production prototype user dashboard and API host.
- `cdn.soochak.bizbandhan.com` — SDK and static assets.

Local development equivalents use `mgmt.bizbandhan.duckdns.org` and `<slug>.bizbandhan.duckdns.org`.

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
