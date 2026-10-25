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
- User accounts that can manage multiple website resources.
- Resource-scoped subscriber data and usage limits.
- Team roles and organization controls are future-stage features.
- Configurable usage limits and subscription plans.

### Analytics and Observability
- Campaign processing status.
- Provider-accepted notifications and delivery failures.
- Notification click tracking.
- Subscriber statistics and usage reporting.

*Features listed above describe the intended product direction; availability depends on implementation progress.*

## Architecture

The prototype Compose topology defines three services: `backend`, `db`, and `soochak` (the project-named NGINX gateway). The gateway joins the pre-existing external `publicweb` network so the server's NGINX Proxy Manager can route traffic to it. It also joins the stack's private network with `backend` and `db`; the backend addresses MongoDB by the service hostname `db`. A separate frontend service is deferred. The gateway and database use the project-maintained `optiwariindia/gateway` and `optiwariindia/mongodb` images.

```yaml
services:
  soochak: # NGINX gateway; attached to publicweb and the stack network
  backend: # Express API; attached to the stack network
  db:      # MongoDB; attached to the stack network
  # frontend: # Separate UI, planned for a later stage
networks:
  soochak:     # Private network for this stack
  publicweb:   # Existing external network managed by the server environment
```

The minimal prototype page at `codebase/backend/public/index.html` registers `/sw.js` on page load and reports registration status. It does not request notification permission or create a push subscription yet. The worker handles push display and notification clicks for the prototype; customer integrations must account for existing customer Service Workers and must not replace them silently.

The current backend contains an Express/Mongoose bootstrap, an empty route module, and static serving configured for `codebase/backend/public/`. Authentication, resource APIs, SDK, VAPID provisioning, subscription handling, and notification sending are not implemented. The project has not yet completed an end-to-end notification verification.

The longer-term platform is planned to add a browser SDK, campaign scheduling, durable asynchronous delivery, and a dedicated dashboard. NATS JetStream and separate workers are future architecture components, not required services in the initial Compose topology.

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
| Prototype UI | `codebase/backend/public/index.html` |
| Future dashboard | React, Vite, Tailwind CSS (planned) |
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

The current repository follows the Compose services. The gateway configuration scaffold is present; its project-specific route map will evolve with the application. A separate frontend application is deferred. Prototype checks are manual, so an automated test layout is not required yet.

```text
soochak/
├── codebase/
│   ├── backend/
│   │   ├── core/
│   │   │   └── server.js
│   │   ├── module/
│   │   │   └── index.js    # currently empty Express router
│   │   ├── public/
│   │   │   ├── index.html # minimal page registering the Service Worker
│   │   │   └── sw.js      # prototype push/click handlers
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── package-lock.json
│   ├── frontend/           # Dockerfile placeholder; service deferred
│   ├── gateway/
│   │   ├── config/         # NGINX gateway configuration scaffold
│   │   └── logs/
│   └── db/
│       ├── store/
│       ├── config/
│       └── backup/
├── environment/
│   └── backend.env         # local DB and port settings; do not commit secrets
├── docker-compose.yml      # soochak gateway, backend, db
└── README.md
```

The Compose service keys are `soochak` (gateway, named for the project so Proxy Manager can address it), `backend`, and `db` (MongoDB hostname used by the backend). The gateway connects to the pre-created external `publicweb` network and the stack's private network; backend and database connect only to the private network. MongoDB data, config, and backup directories are bind-mounted under `codebase/db/`. The separate frontend service and automated test layout are deferred.

## Development Roadmap

### Prototype Testing Approach

Prototype behavior will be checked manually using internal accounts and test devices. Automated unit, integration, and end-to-end tests, along with CI test checks, are deferred until after the prototype. Keep a repeatable manual checklist for permission outcomes, subscription lifecycle, notification receipt, click behavior, and failure cases.

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
- [ ] Add user registration and login, with each user able to manage multiple resources.
- [ ] Implement resource registration; formal site ownership verification is deferred until public self-service MVP.
- [ ] Build the campaign composer and campaign history.
- [ ] Add scheduling and basic analytics.
- [ ] Enforce user/resource ownership and implement usage limits.

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

| Environment | Origin |
|---|---|
| Development | `https://soochak.optiwari.duckdns.org` |
| Live | `https://soochak.bizbandhan.com` |

The development hostname is covered by the available `*.optiwari.duckdns.org` TLS certificate. The live hostname is outside that wildcard domain and must have a valid certificate covering `soochak.bizbandhan.com` before it serves browser integrations.

The browser SDK is intended to use the same standards-based implementation across browsers that support Web Push. Browser and operating-system combinations are test targets, not separate SDK builds; capability detection and narrowly scoped compatibility handling may be needed where platform behavior differs. Pilot support should be documented for combinations actually tested, including Service Worker registration, permission and subscription creation, backend registration, notification receipt, and click-through behavior. The initial pilot browser and operating-system matrix is to be selected from the intended pilot users' devices.

### Configuration

The local `environment/backend.env` file currently supplies `DB` and `PORT` to the backend. Compose variable interpolation such as `BUILD_TARGET` is configured separately through the shell or a project `.env` file; it must select a Dockerfile target (`development` or `production`). Configuration will later include the active environment's site/API origin, authentication secrets, and VAPID key handling. Development and live origins are configured as documented above; there is no staging origin. NATS settings are later-stage. Keep secret-bearing files out of version control and add a safe example template as secrets are introduced.

**Never commit production credentials, VAPID private keys, or encryption secrets to version control.**

### Prototype Accounts and Resource Access

The prototype authentication model uses user registration and login. One user may own multiple resources; each resource represents a website integration and owns its subscribers and subscriber limit. The initial access rule is that an authenticated user can access only resources they own. API operations involving a resource must verify this ownership on the backend.

The initial data model is:

```text
User
  id
  username or email (unique)
  password (secure hash only; never plaintext)

Resource
  id (site/resource ID generated by Soochak)
  userId (owner)
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

Subscriber records belong to a resource and should be uniquely identified by their push endpoint within that resource. Re-registering an endpoint updates its existing subscription record. The browser SDK may use a public resource key to identify the resource; browser-delivered code cannot keep a secret API key. Any server-to-server secret must be handled separately and stored as a hash.

### Prototype Subscriber Data and Consent

The prototype is for internal users and devices managed by the project team; it is not an open public signup. The browser's native notification permission prompt is still required, and the SDK requests permission only following an explicit user action. Prototype opt-in UI copy may be placeholder text. Notifications should use test content and internal test recipients.

Subscriber `name` and `email` fields are part of the planned schema for future personalization, but the prototype will not collect or use them. Delete a subscriber record immediately when the user unsubscribes. Also delete it when a push send receives a definitive expired/unregistered endpoint response (such as HTTP 404 or 410). Do not delete records for transient delivery errors such as timeouts or provider outages.

VAPID keys are shared by resources within an environment: development and live each use their own key pair. Each resource stores its VAPID public key in the database and supplies it to the SDK. Store each environment's shared VAPID key pair in an environment-level database record, with the private key encrypted using authenticated encryption (for example, AES-GCM). Decrypt it in the backend only when needed for signing push requests. Keep the encryption key separate from the database in backend secret configuration, never send either private key or encryption key to browsers, and never log plaintext key material. The process for rotating VAPID keys remains to be decided.

The prototype will not require a separate site ownership verification step. Resource setup and SDK/Service Worker integration are expected to be performed by the user configuring that website. Reassess formal ownership verification before opening MVP registration to self-service users; installing a Service Worker by itself is not a backend-verified ownership check.

### Prototype Scope and Deferred Production Work

The decisions above define an internal prototype for project-team accounts and test devices. The prototype does not include public self-service onboarding, formal site ownership verification, a staging environment, or collection/use of subscriber names and email addresses. Browser notification permission and explicit opt-in remain required. These assumptions must be revisited before accepting external customer traffic.

Production readiness work remains outside the prototype decision scope and is tracked for later planning: public onboarding and abuse controls, formal site verification, privacy and consent requirements for external subscribers, VAPID key rotation, backup/restore and operational monitoring, load validation, and customer deployment/onboarding procedures. No VAPID rotation procedure has been selected yet.

### Local Development

The intended development Compose command uses the external `publicweb` network and the configured local backend environment file. The full application startup has not yet been verified:

```bash
git clone <repository-url>
cd soochak
BUILD_TARGET=development docker compose up --build
```

The `publicweb` Docker network must already exist. Use `BUILD_TARGET=production` for the production Dockerfile stage. These commands describe the current Compose setup; an end-to-end notification workflow is not implemented yet.

## Security and Privacy

Soochak is intended to follow these principles:

- Enforce user ownership checks for resources and resource-scoped subscriber data.
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

Proposed product hostnames:

- `soochak.bizbandhan.com` — Product website.
- `app.soochak.bizbandhan.com` — Management dashboard.
- `api.soochak.bizbandhan.com` — REST API.
- `cdn.soochak.bizbandhan.com` — SDK and static assets.

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
