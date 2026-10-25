# Functional Requirements Document (FRD)

**Product:** Soochak by BizBandhan  
**Status:** Draft; requirements are planned, not implemented. Prototype decisions are reflected where settled.

## 1. Scope

This document translates the PRD into observable behavior for the planned Web Push platform. The current code is an early Express/Mongoose bootstrap with an empty router and static serving configured for the public directory; the requirements below are not implemented unless specifically stated in the root README.

## 2. Functional Requirements

### User and resource access
- **FR-01:** A user can register and log in; one user can own multiple resources.
- **FR-02:** A resource represents a website integration and owns its subscribers and subscriber limit.
- **FR-03:** All resource, subscriber, campaign, and report operations verify resource ownership on the server. Team invitations and roles are outside the prototype scope.

### Website setup and SDK
- **FR-04:** An authenticated user can create a resource with a name, site origin, allowed origins, public identifier, VAPID public key, and subscriber limit.
- **FR-05:** The UI/API provides resource-specific public SDK configuration and integration instructions.
- **FR-05a:** The prototype does not require separate site ownership verification; reassess before public self-service registration.
- **FR-06:** The SDK can request permission only in response to a site-controlled user action, create a browser push subscription, and register or refresh it with the API.
- **FR-07:** The integration can coexist with an existing Service Worker. Setup instructions explain the necessary worker changes for supported patterns; no worker is silently replaced.
- **FR-08:** Delete a subscription immediately after unsubscribe or a definitive expired/unregistered endpoint response; transient send errors do not delete it.
- **FR-08a:** Subscriber name and email fields may exist in the schema but are not collected or used during the prototype.

### Campaigns and delivery
- **FR-09:** An authorized operator can draft a campaign with title, message, optional icon/image, destination URL, and target website.
- **FR-10:** The operator can send immediately or schedule a campaign for a future time. Invalid content, unauthorized sites, and unsupported schedule values are rejected with actionable errors.
- **FR-11:** The system records campaign state and creates durable delivery work for eligible active subscriptions.
- **FR-12:** Workers send using Web Push and configured VAPID credentials, apply bounded retries for transient failures, and avoid duplicate work where supported by idempotency keys.
- **FR-13:** Delete a subscriber on a definitive expired/unregistered endpoint response; transient failures remain distinguishable and do not delete the record.
- **FR-14:** Operators can inspect campaign totals and per-campaign processing outcomes: queued, attempted, provider accepted, failed, and clicked where observed.

### Reporting and operations
- **FR-15:** Notification click handling records a click event and opens the configured destination safely.
- **FR-16:** Dashboard views show active subscriber totals and campaign history scoped to the user's selected resource.
- **FR-17:** Operators can distinguish provider acceptance from actual notification display; no read/display claim is inferred from acceptance.
- **FR-18:** Platform services emit structured logs and health information sufficient to investigate API, scheduler, and worker failures.

## 3. Core Data Records

Planned entities: User, Resource, Subscriber, EnvironmentVapidKey, Campaign, DeliveryAttempt, and ClickEvent. A user owns resources; a resource owns subscribers and has its own maximum subscriber count. Each environment has one shared VAPID key pair; each resource stores the public key, while the environment-level private key is encrypted in the database. The AES key is kept outside the database in backend secret configuration. Exact schemas and indexes remain implementation work. Development and live use separate key pairs.

## 4. External Interfaces

- Browser SDK uses HTTPS APIs and standard Push API/Service Worker capabilities.
- REST API serves dashboard and SDK operations; authentication and public-key boundaries must be defined in API design.
- MongoDB stores application state. NATS JetStream and a separate delivery worker are later-stage components, not part of the initial Compose stack.
- Browser push services receive Web Push requests authenticated with VAPID.

## 5. Acceptance Scenarios

1. A developer installs the SDK on a supported HTTPS test site, integrates with its existing worker, subscribes with user permission, and sees the endpoint registered to the correct site.
2. An operator sends a test campaign; processing states appear and provider failures are visible.
3. A permanently invalid endpoint is deleted and excluded from subsequent sends.
4. A user cannot read or alter another user's resource, subscribers, campaigns, or reports by changing an ID in an API request.
5. A scheduled campaign is not sent before its scheduled time and is processed after that time.

## 6. Validation and Error Behavior

Validate authentication, resource ownership, required fields, URL scheme, content bounds, schedule time, subscription shape, and request rate. Return stable machine-readable error codes with safe, useful messages. Never expose private keys or raw secrets in API responses or logs. Prototype verification is manual; automated tests are deferred until after the prototype.

## 7. Deferred Decisions

Account recovery, team roles, API versioning, campaign editing/cancel semantics, timezone behavior, segmentation, export, public-user retention/consent rules, VAPID key rotation, and delivery concurrency limits require later product and technical decisions.
