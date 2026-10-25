# Product Requirements Document (PRD)

**Product:** Soochak by BizBandhan  
**Status:** Draft for prototype implementation  
**Last updated:** 2026-10-24

## 1. Summary

Soochak is a developer-first, multi-tenant Web Push notification platform. It helps a business connect a website to browser push subscriptions, create campaigns, and understand processing outcomes. The product must integrate with a site's existing Service Worker rather than silently replacing it.

This document describes intended direction and the agreed prototype scope. The repository has a Compose/backend/gateway scaffold, but the notification product flow is not implemented yet. Billing, roles, browser matrix, and service targets remain future decisions.

## 2. Problem and Opportunity

Businesses need a dependable way to ask website visitors for push permission and later send relevant updates. Building subscription management, secure delivery, scheduling, and reporting separately creates operational overhead. Existing Service Workers and PWA behavior also make integration risky when a provider assumes it can own the worker.

Soochak should make a first notification straightforward for developers while giving business operators a safe way to manage campaigns and audiences.

## 3. Goals

- Provide a lightweight, framework-independent JavaScript integration.
- Register, update, and remove browser subscriptions safely.
- Send immediate and scheduled campaigns to a website's active subscribers.
- Report accepted, failed, and clicked outcomes without claiming provider acceptance means display.
- Let one registered user manage multiple website resources, with each resource's subscriber data isolated.
- Preserve host-site Service Worker functionality.

## 4. Non-goals for Initial Prototype

- Native mobile push, SMS, email, or social messaging.
- Guaranteed delivery, display, or read receipts.
- Advanced behavioral segmentation, journeys, or experimentation.
- A finalized subscription billing system or public SLA.

## 5. Users

- **Website developer:** integrates the SDK, configures a site, and troubleshoots subscriptions.
- **Campaign operator:** drafts, schedules, sends, and reviews campaigns.
- **Resource owner:** registers and manages multiple website resources.
- **Platform operator:** monitors queue health, abuse, and service reliability.
- **Website visitor/test user:** opts in to browser notifications.

## 6. Product Scope

The longer-term product includes an SDK and Service Worker integration, REST API, dashboard, MongoDB persistence, NATS JetStream job processing, and delivery workers. The current Compose topology defines `backend`, `db` (MongoDB), and `soochak` (project-named NGINX gateway). The gateway joins the server's pre-existing external `publicweb` network and the stack's private network. A separate frontend service is deferred. The backend has an Express/Mongoose bootstrap, an empty router, and static serving configured for `codebase/backend/public/`; the minimal page registers the prototype push/click worker and reports its status. Permission and subscription UI, the SDK, VAPID flow, and subscription/notification APIs are still to be implemented. The prototype should prioritize one internal test notification; NATS and separate workers are later-stage components.

The prototype is for internal accounts and test devices, with no public self-service registration and no separate site ownership verification. A user owns resources; each resource owns its subscribers and subscriber limit. `name` and `email` remain schema candidates but will not be collected or used initially. Unsubscribe and definitively expired endpoints are deleted immediately; transient delivery failures do not trigger deletion. Testing is manual during the prototype.

## 7. Success Measures

Instrument and review: time from SDK install to first test notification; successful subscription registration rate; campaign enqueue-to-terminal processing time; provider acceptance and failure rates; invalid-subscription cleanup rate; campaign click events; and cross-user resource access incidents (target: zero). Set numeric targets after pilot baselines and capacity testing.

## 8. Product Principles and Constraints

- Service Worker integration must be explicit and documented for native, Workbox, and Vite PWA setups.
- HTTPS is required for production browser integration; browser permission remains under visitor control.
- Protect subscription endpoints and private keys; validate user-controlled content and URLs.
- Separate queued/processed/provider outcomes from display and click outcomes.
- Prototype architecture: Node.js 24, Express, MongoDB, NGINX, and Docker Compose; React/Vite dashboard and NATS JetStream are later-stage components.

## 9. Open Decisions

Prototype decisions are recorded in the root README. Before public MVP access, revisit site ownership verification, account recovery, team roles, consent and privacy requirements for external subscribers, abuse controls, VAPID key rotation, usage plans, and numeric performance/availability targets.
