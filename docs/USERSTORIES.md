# User Stories

**Product:** Soochak by BizBandhan  
**Status:** Draft backlog; priorities are proposed for MVP planning.

The current prototype is limited to internal accounts and test devices. The prototype's access model is one user owning multiple resources, without organization membership or team roles. Verification is manual; automated tests are planned after the prototype.

## MVP: Integration and First Delivery

### US-01 — Configure a resource (Must)
As a registered user, I want to register multiple website resources so that each site's subscriptions and subscriber limit are kept separate.

**Acceptance criteria**
- I can create and view resources owned by my account.
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

### US-09 — Enforce user/resource access (Must)
As a registered user, I want resource data limited to resources I own so that subscriber and campaign data stays private.

**Acceptance criteria**
- API authorization applies to every user-owned resource.
- Direct requests with another user's resource ID are denied.
- Manual prototype checks cover read and write access paths; automated security tests are deferred until after the prototype.

### US-10 — Manage team roles (Future)
As an account owner, I want to invite team members and assign roles so that collaborators receive only the access they need.

**Acceptance criteria**
- Role capabilities are documented and applied consistently in UI and API.
- Removing a member revokes access promptly.

## Future Candidates

Subscriber segmentation, campaign duplication/cancellation, advanced analytics, exports, plan limits, audit log UI, and localization need prioritization after MVP learning. Story priorities are provisional and should be refined with pilot users.
