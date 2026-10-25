# Non-Functional Requirements (NFR)

**Product:** Soochak by BizBandhan  
**Status:** Draft; quantitative service objectives require pilot data.

## 1. Security and Privacy

- Enforce user ownership of resources and authorization on every server-side read and write; check cross-user access paths.
- Serve production SDK, dashboard, and API over HTTPS. Never log credentials, VAPID private keys, or full subscription secrets.
- Use one VAPID key pair per environment. Store the private key encrypted in an environment-level database record; keep its AES encryption key separately in backend secret configuration. Define key rotation and backup procedures before production.
- Validate and constrain notification fields and destination URLs. Protect click redirects against unsafe schemes and open-redirect abuse.
- Apply authentication throttling, API rate limits, payload limits, and usage controls. Provide auditable administrative actions.
- Prototype use is limited to internal accounts and test devices. The browser still requires explicit user-action opt-in. Name/email fields are not collected or used initially.
- Delete subscriber records immediately on unsubscribe and on definitive expired/unregistered endpoint responses (for example, HTTP 404/410); retain them through transient delivery errors.
- Define consent, data retention, deletion, and incident response policies before handling production subscriber data.

## 2. Reliability and Delivery Semantics

- Persist campaign and delivery state so service restarts do not silently lose accepted work.
- Use bounded retries with backoff for transient failures; classify permanent endpoint failures and clean them up.
- Make job handling idempotent where practical and prevent duplicate sends during retry/recovery.
- Expose queue age/depth, worker health, error rates, and dead-letter or exhausted retry counts.
- Report provider acceptance separately from display, read, and click events. Web Push cannot guarantee delivery or display.

## 3. Performance and Capacity

- The README identifies a later pilot target of processing up to 10,000 subscriptions; validate this with representative load tests before claiming readiness. It is outside initial prototype acceptance.
- Use bounded concurrency and backpressure across NATS consumers and push provider calls.
- Establish numeric API latency, campaign completion, throughput, and concurrency objectives from pilot measurements before production launch.
- Paginate campaign history, subscriber totals, and delivery details; avoid unbounded dashboard/API responses.

## 4. Availability and Recovery

- Health checks should distinguish API readiness from MongoDB and NATS dependencies.
- Define MongoDB backup/restore, NATS persistence, recovery point, and recovery time objectives before production.
- On dependency loss, fail safely and preserve retryable work. Document operational recovery and key rotation procedures.

## 5. Compatibility and Usability

- SDK must remain framework-independent and support documented native Service Worker, Workbox, and Vite PWA integration patterns.
- Do not overwrite a site's existing worker without explicit operator/developer configuration.
- Document the tested browser/OS matrix, HTTPS/local development requirements, permission states, and known limitations as they are verified.
- Dashboard and integration errors should give actionable next steps; target WCAG 2.2 AA for dashboard UI as a product quality goal.
- Prototype validation is manual. Automated unit, integration, end-to-end, and CI checks are deferred until after the prototype.

## 6. Maintainability and Observability

- Use structured, correlated logs and metrics across API, scheduler, and workers; redact sensitive data.
- Keep service boundaries, API contracts, environment configuration, and operational runbooks documented.
- Pin and update dependencies through a documented review process; scan dependencies and container images before production.

## 7. Unset Targets

Availability percentage, RPO/RTO, production data retention duration, supported-browser versions, latency percentiles, maximum campaign size, and numeric rate limits are intentionally unset pending architecture review and pilot evidence. Prototype endpoints have the immediate deletion rules above.
