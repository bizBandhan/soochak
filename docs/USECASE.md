# Use Cases

**Product:** Soochak by BizBandhan  
**Status:** Draft; system behavior is planned.

## Actors

- **Registered user/resource owner:** manages multiple website resources.
- **Website developer:** installs SDK and integrates the Service Worker.
- **Campaign operator:** prepares and monitors messages.
- **Website visitor:** grants/revokes browser notification permission.
- **Soochak services:** gateway, API, and database for the prototype; scheduler, queue, delivery worker, and click handler are planned components.
- **Browser push service:** accepts Web Push requests and routes them to browsers.

## UC-01: Set Up a Website

**Goal:** Prepare a site for Web Push integration.  
**Preconditions:** User is authenticated. Site ownership verification is not required during the internal prototype.  
**Trigger:** User selects “Add resource.”

1. User submits a resource name and site origin.
2. System validates the origin and creates a user-owned resource record.
3. System provides a resource identifier, allowed origins, public configuration, subscriber limit, and VAPID public key.
4. Developer installs the SDK and follows the documented integration pattern for the site's existing worker.
5. Developer verifies configuration with a test subscription.

**Alternate flows:** Invalid origin or missing configuration returns field-level errors. No separate domain ownership challenge is performed in the prototype. Unsupported worker arrangements provide diagnostic guidance; the system does not replace the site's worker automatically.  
**Postconditions:** Resource is associated with its owning user.

## UC-02: Subscribe a Visitor

**Goal:** Register a visitor's browser endpoint with the correct site.  
**Preconditions:** Resource is configured and served in a browser context supporting push; prototype testers use the development HTTPS origin.  
**Trigger:** Internal test user activates the site's notification opt-in control.

1. SDK requests permission in response to that action.
2. If granted, browser creates a push subscription and SDK submits it to the API with resource context.
3. API validates and stores or refreshes the subscription.
4. SDK reports success to the host site.

**Alternate flows:** Denied permission is reported without another prompt; unsupported browser reports a useful limitation; registration errors can be retried safely; unsubscribe or definitive endpoint expiry deletes the record immediately. Transient send failures do not delete it.  
**Postconditions:** Subscription is active and resource-scoped, or its failure state is communicated.

## UC-03: Send an Immediate Campaign

**Goal:** Deliver a campaign to a site's eligible active subscribers.  
**Preconditions:** Authorized user owns the resource; its VAPID configuration is valid.  
**Trigger:** Operator confirms a reviewed campaign.

1. User selects a resource and enters title, message, optional media, and destination URL.
2. UI validates fields and shows the target resource/audience estimate.
3. API validates resource ownership and persists the campaign.
4. System enqueues durable delivery work; workers send within configured concurrency limits.
5. Worker records provider response, retries transient failures within bounded policy, and immediately deletes subscriber records for definitively expired endpoints.
6. Dashboard displays campaign processing outcomes and later observed clicks.

**Alternate flows:** Invalid content, insufficient permission, or configuration errors prevent enqueueing. Queue or provider outages leave work in a visible retryable/failed state. Duplicate requests should not create duplicate sends where idempotency is available.  
**Postconditions:** Campaign and per-endpoint outcomes are auditable; provider acceptance is not treated as proof of display.

## UC-04: Schedule a Campaign

**Goal:** Send a reviewed campaign at a future time.  
**Preconditions:** User owns the resource and content is valid.  
**Trigger:** Operator chooses a future send time.

1. Dashboard displays the schedule time and timezone interpretation.
2. API validates and persists the scheduled campaign.
3. Scheduler makes it eligible at the scheduled time and publishes durable delivery work.
4. Delivery proceeds as in UC-03.

**Alternate flows:** Past or ambiguous times are rejected or clarified; repeated scheduler execution must not enqueue duplicate campaign work.  
**Postconditions:** Campaign moves from scheduled to processing and then a terminal/partially failed state.

## UC-05: Review Campaign Outcomes

**Goal:** Understand campaign processing and engagement.  
**Preconditions:** User owns the resource.  
**Trigger:** User opens a campaign report.

1. API returns user/resource-scoped campaign totals and relevant delivery statuses.
2. Dashboard distinguishes queued, attempted, provider accepted, failed, and observed clicks.
3. User drills into useful failure categories without seeing secrets or another user's data.

**Postconditions:** User can assess processing and clicks; no display or read receipt is implied.
