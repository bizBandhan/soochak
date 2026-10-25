# Product Milestones

**Product:** Soochak by BizBandhan  
**Status:** Proposed sequence; dates and owners are not assigned.  
**Planning basis:** The prototype decisions and current code layout documented in `README.md` and `tasks/prototype.todo`.

## M0 — Product and Technical Foundations

**Outcome:** Keep the agreed prototype decisions and runnable foundation documented before browser integration work.

- Prototype decisions are recorded: internal users/devices, one user owning multiple resources, no separate ownership verification, explicit browser opt-in, immediate deletion on unsubscribe/definitive expiry, and manual testing.
- The initial directory layout, Compose stack, project-named gateway and external `publicweb` network are in place; environment configuration exists for the backend.
- Remaining foundation work includes configuration validation/examples, health/readiness, safe logging, and a documented startup workflow.

**Exit criteria:** Current infrastructure can be started reproducibly after the documented network/build prerequisites are met; unresolved production decisions are listed separately.

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

**Outcome:** A user can manage resources and send/schedule campaigns.

- Implement user registration/login, resource management, and server-side user/resource isolation.
- Build campaign composer, confirmation, scheduling, history, and outcome views.
- Add site-scoped subscriber totals, role controls, and usage limits as decisions permit.

**Exit criteria:** Manual checks cover account/resource setup, immediate and scheduled campaigns, reports, and cross-user access denial.

## M4 — Pilot Readiness

**Outcome:** The system is supportable with a limited pilot workload.

- Load test the README's target of up to 10,000 subscriptions and tune backpressure/concurrency.
- Define retention/deletion, backup/restore, incident response, alerting, and key rotation.
- Review accessibility, privacy, abuse controls, security, and documentation.
- Prepare deployment, onboarding, and support runbooks.

**Exit criteria:** Numeric performance and recovery objectives are agreed and measured; no unresolved critical security or data isolation issues; pilot acceptance criteria are signed off.

## Sequencing and Dependencies

M0 decisions and runnable environments precede implementation. M1 validates browser and Service Worker assumptions before campaign-scale work. M2 supplies durable delivery foundations for M3. M4 depends on integrated system behavior and measured pilot evidence. Dates, staffing, external dependencies, and scope tradeoffs remain to be estimated by the team.
