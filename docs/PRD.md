# Product Requirements Document (PRD)

**Product:** Soochak by BizBandhan  
**Status:** Draft for prototype implementation  
**Last updated:** 2026-10-29

## 1. Summary

Soochak is a developer-first, multi-tenant Web Push notification platform. It helps a business connect a website to browser push subscriptions, create campaigns, and understand processing outcomes. The product must integrate with a site's existing Service Worker rather than silently replacing it.

This document describes intended direction and agreed prototype decisions. The repository has a Compose/backend/gateway scaffold and an in-progress browser push flow. Organization onboarding and auth are the next planned implementation slice. Billing, exact role/permission catalogs, browser matrix, and service targets remain future decisions.

## 2. Problem and Opportunity

Businesses need a dependable way to ask website visitors for push permission and later send relevant updates. Building subscription management, secure delivery, scheduling, and reporting separately creates operational overhead. Existing Service Workers and PWA behavior also make integration risky when a provider assumes it can own the worker.

Soochak should make a first notification straightforward for developers while giving business operators a safe way to manage campaigns and audiences.

## 3. Goals

- Provide a lightweight, framework-independent JavaScript integration.
- Register, update, and remove browser subscriptions safely.
- Send immediate and scheduled campaigns to a website's active subscribers.
- Report accepted, failed, and clicked outcomes without claiming provider acceptance means display.
- Let an organization manage its website resources with organization-scoped users and data.
- Preserve host-site Service Worker functionality.

## 4. Non-goals for Initial Prototype

- Native mobile push, SMS, email, or social messaging.
- Guaranteed delivery, display, or read receipts.
- Advanced behavioral segmentation, journeys, or experimentation.
- A finalized subscription billing system or public SLA.

## 5. Users

- **Website developer:** integrates the SDK, configures a site, and troubleshoots subscriptions.
- **Campaign operator:** drafts, schedules, sends, and reviews campaigns.
- **Organization owner:** provisions an organization and manages its users, roles, permissions, and website resources.
- **Organization user:** uses assigned roles and direct permission grants within one organization.
- **Platform operator:** monitors queue health, abuse, and service reliability.
- **Website visitor/test user:** opts in to browser notifications.

## 6. Product Scope

The longer-term product includes an SDK and Service Worker integration, REST API, dashboard, MongoDB persistence, NATS JetStream job processing, and delivery workers. The React/Vite dashboard in `codebase/frontend/` is included in Compose alongside the `backend`, `db` (MongoDB), and `soochak` (project-named NGINX gateway) services. The gateway routes default paths to the frontend (`frontend:3000` in development, `frontend:80` in production) and `/api...` paths to `backend:3000`. The dashboard includes auth/onboarding, overview, notification, site, subscriber, administration, settings, and profile screens. Several pages still use seeded or simulated data because their backend APIs are missing or incomplete. Login, reviewed onboarding, authorization, and verified end-to-end notification delivery remain unfinished. Email and hostname ownership verification are deferred beyond the initial registration flow. NATS and separate workers remain later-stage components. An OpenAPI/Swagger draft is maintained in `codebase/backend/public/api-docs/`.

The current API design uses `GET /api/v1/auth` and `GET /api/v1/me` as alternative paths for current authentication status and user details; `POST` changes the signed-in user's password, `PUT` logs in and generates a token, `PATCH` updates profile details, and `DELETE` logs out. Planned user, role, permission, and vendor administration CRUD routes are under `/api/v1/auth/{user,role,permission,vendor}`. Web Push endpoints are under `/api/v1/web-push`; the OpenAPI spec records implemented handlers and notification handlers still returning 502 as under development. These docs are a contract draft, not proof that all routes or auth middleware are implemented.

The target onboarding model supports both public self-service registration and direct organization creation by a platform operator. Self-service collects organization details, a canonical customer website origin, and owner details/password; it creates a pending organization and owner account without dashboard/API access. The protected operator management portal is hosted at `mgmt.soochak.optiwari.duckdns.org` in local development and `mgmt.soochak.bizbandhan.com` in production. It can approve, request changes, or reject with a reason. Status messages are sent to the submitted contact address, but email ownership is not verified in this phase. Applicants with requested changes can sign in to a restricted registration area using their chosen password; they cannot access their Soochak workspace before approval. Approval enables workspace access only after required owner/role/permission provisioning succeeds.

Operator-created organizations skip applicant review and become active after owner/access-record provisioning succeeds. The operator supplies an initial owner password outside the system, and the owner must change it at first login. During the prototype, each user has one unique Soochak dashboard/API hostname derived from the organization slug: `<slug>.soochak.optiwari.duckdns.org` locally and `<slug>.soochak.bizbandhan.com` in production. The customer's website origin is separate from that hostname. Custom dashboard domains, email verification, hostname ownership checks, and payment collection for plans are deferred. Self-hosted deployment is a separate option; synchronizing configuration and updates from the management portal to self-hosted installations is later-stage work.

**Prototype tenancy decision:** assign one unique Soochak dashboard/API hostname to each user and use the incoming hostname as the sole workspace identifier and data-scope key. Do not add a separate tenant entity or tenant ID during the prototype. The customer's website origin is separate Web Push configuration, never the Soochak workspace identifier. Keep this hostname-only model through market validation; only afterward may the team decide to introduce a separate tenant concept, with an explicit data/auth migration plan. The current backend scopes data by request hostname, and implementation must resolve that Soochak hostname separately from the customer website origin. The existing `PUT /api/v1/auth/organization` implementation creates an organization and emits an in-process event for owner/role/permission provisioning, but it does not implement the review states, tenant-access lock, operator portal, status emails, or complete activation gating described above. Unsubscribe and definitively expired endpoints are deleted immediately; transient delivery failures do not trigger deletion. Testing is manual during the prototype.

## 7. Success Measures

Instrument and review: time from SDK install to first test notification; successful subscription registration rate; campaign enqueue-to-terminal processing time; provider acceptance and failure rates; invalid-subscription cleanup rate; campaign click events; and cross-organization access incidents (target: zero). Set numeric targets after pilot baselines and capacity testing.

## 8. Product Principles and Constraints

- Service Worker integration must be explicit and documented for native, Workbox, and Vite PWA setups.
- HTTPS is required for production browser integration; browser permission remains under visitor control.
- Protect subscription endpoints and private keys; validate user-controlled content and URLs.
- Separate queued/processed/provider outcomes from display and click outcomes.
- Prototype architecture: Node.js 24, Express, MongoDB, NGINX, and Docker Compose, with a separate React/Vite dashboard. NATS JetStream remains a later-stage component.

## 9. Open Decisions

Prototype decisions are recorded in the root README. Before public MVP access, finalize domain verification (including whether to use TXT ownership proof), account recovery, default/custom role and permission behavior, consent and privacy requirements for external subscribers, abuse controls, VAPID key rotation, usage plans, and numeric performance/availability targets.
