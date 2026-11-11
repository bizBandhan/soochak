# Soochak Sequence Diagrams

These diagrams describe current prototype behavior and target product flows. Dotted arrows and notes identify behavior that is planned or incomplete. The current API contract is documented in `codebase/backend/public/api-docs/openapi.yml`.

## Current prototype workspace registration

The configured platform signup hostname accepts registration. The organization slug determines the user's personal workspace hostname under `HOSTED_DOMAIN`. Registration creates the organization, owner, role, and initial permissions synchronously under that hostname; on success it returns the workspace URL without setting a session cookie on the shared signup host. The owner signs in on the returned hostname.

```mermaid
sequenceDiagram
    autonumber
    actor Owner
    participant Signup as Platform signup host
    participant API as Registration API
    participant DB as MongoDB
    participant Workspace as Slug-derived workspace host

    Owner->>Signup: Submit organization slug and owner details
    Signup->>API: PUT /auth/organization
    API->>API: Validate signup host and derive workspace hostname
    API->>DB: Create organization under workspace hostname
    API->>DB: Provision owner, role, and permission grants
    alt Provisioning succeeds
        API-->>Signup: Return workspaceHost and workspaceUrl
        Signup-->>Owner: Link to assigned workspace sign-in
        Owner->>Workspace: Sign in with registered credentials
        Workspace-->>Owner: Set host-scoped session cookie
    else Provisioning fails
        API->>DB: Roll back organization record
        API-->>Signup: Return registration error
    end
```

## Planned public self-service registration and review

**Prototype tenancy decision:** each user is assigned one unique Soochak dashboard/API hostname, and that hostname alone identifies and scopes the prototype workspace. There is no separate tenant entity or tenant ID during the prototype. The customer's website origin is collected separately for Web Push setup. Keep this hostname-only model through market validation; any later separate tenant concept requires an explicit migration plan. Submission creates a pending organization and owner account without workspace dashboard/API access; operator approval and successful provisioning are both required before access is enabled. Email notifications use the submitted contact address, but email ownership verification is deferred.

```mermaid
sequenceDiagram
    autonumber
    actor Owner
    participant Signup as Public signup
    participant API as Registration API
    participant DB as MongoDB
    participant Provision as Owner/access provisioning
    participant Mail as Email service
    participant Mgmt as Protected operator portal
    participant Operator
    participant Workspace as User's Soochak dashboard/API

    Owner->>Signup: Submit organization, customer website origin, owner details/password
    Signup--)API: Submit registration for operator review (planned)
    API->>DB: Create pending organization and owner account without workspace access
    API--)Provision: Create owner role and initial permission grants
    Provision-->>API: Report provisioning result
    API-->>Signup: Registration received; workspace access remains locked
    Signup-->>Owner: Show pending-review status
    API--)Mail: Send receipt/status email to submitted contact address

    Operator->>Mgmt: Open protected management portal
    Mgmt->>API: Load pending registration queue
    API->>DB: Read pending organization and provisioning state
    DB-->>API: Registration details/status
    API-->>Mgmt: Show review request
    alt Approve
        Operator->>Mgmt: Approve registration
        Mgmt->>API: Record approval
        API->>DB: Activate only if required provisioning succeeded
        API--)Mail: Send approval status
        Owner->>Workspace: Sign in at assigned Soochak hostname
        Workspace-->>Owner: Grant access to hostname-scoped workspace
    else Request changes
        Operator->>Mgmt: Request changes
        Mgmt->>API: Record requested changes and reason
        API--)Mail: Send status notice
        Owner->>Signup: Sign in with signup password
        Signup-->>Owner: Restricted registration area; no workspace access
        Owner->>Signup: Edit and resubmit registration
        Signup->>API: Save changes; return to pending review
    else Reject
        Operator->>Mgmt: Reject with reason
        Mgmt->>API: Record rejection and reason
        API--)Mail: Send rejection status
        Note over Owner,Signup: A rejected applicant must submit a new registration.
    end
```

## Direct organization creation by platform operator

This flow skips applicant review. The operator supplies an initial owner password outside the system; the owner must change it on first login. The initial password must never appear in application logs, URLs, or documentation.

```mermaid
sequenceDiagram
    autonumber
    actor Operator
    participant Mgmt as Protected operator portal
    participant API as Management API
    participant DB as MongoDB
    participant Provision as Owner/access provisioning
    participant Owner
    participant Workspace as User's Soochak dashboard/API

    Operator->>Mgmt: Enter organization, customer website origin, owner details, initial password
    Mgmt->>API: Create organization directly (no applicant review)
    API->>DB: Create pending-provisioning organization and owner
    API--)Provision: Create owner role and initial permission grants
    Provision->>DB: Store hashed credentials and access records
    Provision-->>API: Provisioning result
    alt Provisioning succeeds
        API->>DB: Activate organization and assign user's unique dashboard/API hostname
        API-->>Mgmt: Organization active
        Operator-->>Owner: Communicate initial password outside the system
        Owner->>Workspace: Sign in at assigned Soochak hostname
        Workspace-->>Owner: Require password change at first login
    else Provisioning fails
        API->>DB: Keep organization inactive and record provisioning failure
        API-->>Mgmt: Show failure; allow operator intervention/retry
    end
```

The operator portal is hosted at `mgmt.bizbandhan.duckdns.org` in local development and `mgmt.soochak.bizbandhan.com` in production. Each prototype user receives one unique dashboard/API hostname derived from the organization slug: `<slug>.bizbandhan.duckdns.org` locally and `<slug>.soochak.bizbandhan.com` in production. Custom dashboard domains, email/hostname ownership verification, and plan payments are deferred. Self-hosted installations are a separate deployment path; central configuration/update synchronization is later-stage.

## Website subscription lifecycle

The browser-side SDK and consent UX are planned. The backend currently exposes subscriber CRUD routes under `/api/v1/web-push/subscriber`; the customer website must integrate with its own Service Worker, preserving existing worker behavior.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor
    participant Site as Customer website
    participant SW as Customer Service Worker
    participant Browser
    participant API as Soochak API
    participant DB as MongoDB

    Visitor->>Site: Choose to enable notifications
    Note over Site,Browser: Planned SDK requests permission after explicit user action
    Site->>Browser: Request notification permission
    Browser-->>Site: Permission granted
    Site->>SW: Register or integrate push handlers without replacing existing worker
    Site->>Browser: Subscribe using public VAPID key
    Browser-->>Site: PushSubscription (endpoint and keys)
    Site->>API: PUT /api/v1/web-push/subscriber
    API->>DB: Create tenant-scoped subscriber record
    DB-->>API: Saved subscriber
    API-->>Site: Subscription registration response

    Visitor->>Site: Unsubscribe
    Site->>Browser: Unsubscribe browser subscription
    Site->>API: DELETE /api/v1/web-push/subscriber/{id} (id returned by the earlier PUT)
    API->>DB: Delete subscriber record
    API-->>Site: Delete response
```

## Notification send and browser display

`PUT /api/v1/web-push/notify` currently lists subscribers, emits an in-process delivery event, creates a notification record, and returns. Delivery is not durable or tracked: NATS/workers, notification history/outcome APIs, and confirmed display/click analytics are future work. A successful API response means accepted by the current prototype flow, not delivered or displayed.

```mermaid
sequenceDiagram
    autonumber
    actor Operator
    participant Dashboard
    participant API as Express API
    participant Subscribers as Subscriber controller
    participant DB as MongoDB
    participant Events as In-process event stream
    participant Sender as Web Push sender
    participant Push as Browser push service
    participant SW as Customer Service Worker
    participant Browser

    Operator->>Dashboard: Compose and confirm notification
    Dashboard->>API: PUT /api/v1/web-push/notify (title, body, url, tag)
    API->>Subscribers: List subscribers in request-origin scope
    Subscribers->>DB: Query subscriber records
    DB-->>Subscribers: Matching subscribers
    Subscribers-->>API: Subscriber list
    API--)Events: Emit notify-web-push with payload, VAPID config, subscribers
    API->>DB: Create notification record
    DB-->>API: Created notification
    API-->>Dashboard: Accepted response
    Dashboard-->>Operator: Show accepted, not delivered

    Events--)Sender: Process delivery event
    loop Each subscriber
        Sender->>Push: Send Web Push payload
        Push-->>SW: Deliver push event when browser is reachable
        SW->>Browser: Display notification
        Browser-->>SW: User clicks notification (optional)
        SW->>Browser: Open configured destination (optional)
    end
    Note over Sender,Push: Current sender uses an in-process event and Promise.all; durable queueing, per-recipient outcomes, retries, and history are not implemented.
```

## Current boundaries

- For the prototype, each user has one unique Soochak hostname, and request-host resolution identifies the user's workspace scope. Keep this separate from the customer's website origin; do not add a separate tenant entity/ID until after market validation.
- Login, complete authorization, and provisioning-status/recovery are not complete. Email and hostname ownership verification are deferred from initial activation.
- Subscriber routes exist, but the SDK/consent lifecycle and end-to-end subscription flow still need implementation and verification.
- NATS JetStream and separate workers are planned architecture, not part of the current deployment.
- The dashboard's PWA Service Worker is for the dashboard origin; it is not the Service Worker used by customer websites.
