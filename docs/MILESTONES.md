# Product Milestones

**Product:** Soochak by BizBandhan  
**Status:** Proposed sequence; dates and owners are not assigned.  
**Planning basis:** The prototype decisions and current code layout documented in `README.md` and `tasks/prototype.todo`.

## M0 — Product and Technical Foundations

**Outcome:** Keep the agreed prototype decisions and runnable foundation documented before browser integration work.

- Prototype decisions are recorded: current use is internal users/devices; target onboarding has self-service review and direct operator creation; hosted tenant dashboard/API host is separate from customer website origin; one organization per user for now; roles as user groups; direct or role permission grants; email/hostname ownership checks and payment deferred; explicit browser opt-in; immediate deletion on unsubscribe/definitive expiry; and manual testing.
- The initial directory layout, Compose stack, project-named gateway and external `publicweb` network are in place; environment configuration exists for the backend.
- Remaining foundation work includes configuration validation/examples, health/readiness, safe logging, and a documented startup workflow.

**Exit criteria:** Current infrastructure can be started reproducibly after the documented network/build prerequisites are met; unresolved production decisions are listed separately.

## M0.5 — Organization Bootstrap and Auth

**Outcome:** Organizations can be registered through a reviewed self-service flow or created directly by a platform operator, with tenant access gated on successful provisioning.

- Implement public self-service registration with organization name/slug, canonical customer website origin, owner details, and owner-chosen password. Create a pending organization and owner account without tenant dashboard/API access.
- Build a protected platform-operator review portal at `mgmt.soochak.optiwari.duckdns.org` for local development and `mgmt.soochak.bizbandhan.com` for production, with approve, request-changes, and reject-with-reason actions.
- Send status emails to the submitted contact address. Let applicants with requested changes use password sign-in to a restricted registration area; do not grant tenant dashboard access before approval.
- On approval, activate only after owner, owner role, and permission grants have provisioned successfully. Keep registration/provisioning states and recovery observable.
- Support direct operator-created organizations without applicant review. Require successful owner/access-record provisioning before activation; operator-supplied initial passwords must be changed at first login.
- Use `[tenant].soochak.optiwari.duckdns.org` for local development and `[tenant].soochak.bizbandhan.com` for production hosted SaaS; keep the customer's website origin as a separate field. Adapt tenant scoping, currently inferred from request host, to the tenant-host model. Users belong to one organization for now; Membership is deferred.
- Seed default roles and permissions; assign the owner role.
- Defer email verification, hostname ownership verification, custom dashboard domains, and plan payment collection to a later milestone. Self-hosted deployment is a separate path; centralized config/update synchronization is later-stage.
- Publish and maintain the OpenAPI/Swagger contract for current-user auth, generated user/role/permission/vendor CRUD, and Web Push routes; align documented security with implemented middleware.
- Add a one-time self-host setup flow. Support DNS hostnames such as DuckDNS that resolve to a private LAN address when accessed over valid HTTPS.

**Exit criteria:** Self-service organizations remain inaccessible until operator approval and successful provisioning; operators can request changes or reject with a reason; direct operator-created organizations activate after provisioning; tenant APIs enforce organization scope and authorization.

Swagger UI is served from `/api-docs/`; its OpenAPI contract and reusable schemas live in `codebase/backend/public/api-docs/`. The documented auth and administration routes remain a design contract until implemented and verified.

## M1 — Browser Integration Proof

**Outcome:** A developer can receive a real test notification on a supported HTTPS test site.

- Build framework-independent SDK and subscription lifecycle endpoints.
- Implement VAPID configuration and secure handling.
- Document and validate existing Service Worker integration.
- Verify a native worker flow; test Workbox and Vite PWA patterns.

Prototype checks are manual; automated tests and CI are deferred until afterward.

**Exit criteria:** Opt-in, registration, notification receipt, click navigation, unsubscribe, and clear failure behavior are demonstrated without breaking the host worker.

## M2 — Reliable Delivery Core

**Outcome:** Accepted work survives service restarts and endpoint failures are handled.

- Persist subscriptions/campaign state in MongoDB.
- Add NATS JetStream, scheduler, and delivery workers.
- Add bounded concurrency, retry classification, idempotency strategy, and invalid endpoint cleanup.
- Add structured logs, health checks, and operational metrics.

**Exit criteria:** Manual prototype checks demonstrate retry/recovery and permanent failure cleanup; automated coverage follows after the prototype.

## M3 — Pilot Dashboard and Campaigns

**Outcome:** A user can manage resources and send/schedule campaigns. A standalone React/Vite dashboard scaffold and its primary page routes now exist; live integration remains partial.

- Build organization/user administration, resource management, and server-side origin/permission enforcement.
- Replace seeded/demo auth and static/simulated resource/admin data with backend-backed flows as APIs become available; align frontend payloads with OpenAPI.
- Build campaign composer, confirmation, scheduling, history, and outcome views.
- Add site-scoped subscriber totals, role controls, and usage limits as decisions permit.

**Exit criteria:** Manual checks cover organization/account/resource setup, immediate and scheduled campaigns, reports, and cross-organization access denial.

## M4 — Pilot Readiness

**Outcome:** The system is supportable with a limited pilot workload.

- Load test the README's target of up to 10,000 subscriptions and tune backpressure/concurrency.
- Define retention/deletion, backup/restore, incident response, alerting, and key rotation.
- Review accessibility, privacy, abuse controls, security, and documentation.
- Prepare deployment, onboarding, and support runbooks.

**Exit criteria:** Numeric performance and recovery objectives are agreed and measured; no unresolved critical security or data isolation issues; pilot acceptance criteria are signed off.

## Sequencing and Dependencies

M0 decisions and runnable environments precede implementation. M1 validates browser and Service Worker assumptions before campaign-scale work. M2 supplies durable delivery foundations for M3. M4 depends on integrated system behavior and measured pilot evidence. Dates, staffing, external dependencies, and scope tradeoffs remain to be estimated by the team.
