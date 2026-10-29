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

The longer-term product includes an SDK and Service Worker integration, REST API, dashboard, MongoDB persistence, NATS JetStream job processing, and delivery workers. A standalone React/Vite dashboard now exists in `codebase/frontend/`; it is not part of the current Compose topology, which defines `backend`, `db` (MongoDB), and `soochak` (project-named NGINX gateway). The dashboard includes auth/onboarding, overview, notification, site, subscriber, administration, settings, and profile screens. Several pages still use seeded or simulated data because their backend APIs are missing or incomplete. Login, authorization, hostname verification, and verified end-to-end notification delivery remain unfinished. NATS and separate workers remain later-stage components. An OpenAPI/Swagger draft is maintained in `codebase/backend/public/api-docs/`.

The current API design uses `GET /api/v1/auth` and `GET /api/v1/me` as alternative paths for current authentication status and user details; `POST` changes the signed-in user's password, `PUT` logs in and generates a token, `PATCH` updates profile details, and `DELETE` logs out. Planned user, role, permission, and vendor administration CRUD routes are under `/api/v1/auth/{user,role,permission,vendor}`. Web Push endpoints are under `/api/v1/web-push`; the OpenAPI spec records implemented handlers and notification handlers still returning 502 as under development. These docs are a contract draft, not proof that all routes or auth middleware are implemented.

The prototype is for internal organizations/accounts and test devices; open public self-service signup is not part of the current scope. One organization maps to one canonical hostname used as the tenancy origin. Users belong to one organization origin for now; no Membership model is planned unless multi-organization users become a real use case. Roles group organization users, while permissions may grant actions to a user or a role. Organization `PUT` currently creates the organization and emits an in-process event for owner/role/permission provisioning; hostname verification, event recovery, and welcome email remain open. The expected hostname must be unique; DNS verification is planned, with the exact challenge method still open. Unsubscribe and definitively expired endpoints are deleted immediately; transient delivery failures do not trigger deletion. Testing is manual during the prototype.

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
