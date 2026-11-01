# Frontend Status and Route Guide

**Product:** Soochak by BizBandhan  
**Status:** Prototype dashboard; UI pages exist, and API integration is partial. Registration decisions below describe the target flow and are not yet implemented. Updated 2026-10-30.

## Application

The dashboard is under `codebase/frontend/`. It uses React 19, TypeScript, Vite, Tailwind CSS, and React Router. It is available as the `frontend` service in `docker-compose.yml`; the gateway routes non-API paths to it and routes `/api...` paths to the backend.

```bash
cd codebase/frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the API base URL when needed; the default is `/api/v1`. `npm run build` creates a production build and `npm run lint` runs TypeScript checking (`tsc --noEmit`).

## Routes and pages

| Frontend route | Page | Current state |
|---|---|---|
| `/login` | Login | UI and API adapter exist; demo fallback/auth behavior remains and backend login route is not mounted. |
| `/register-org` | Organization registration | Target flow collects organization details, customer website origin, and owner credentials; creates a pending organization whose owner cannot access the tenant dashboard/API; and requires platform-operator approval. The existing adapter/backend do not implement these review states. |
| `/` | Dashboard overview | Dashboard shell exists; metrics use seeded/demo data where APIs are unavailable. |
| `/notifications` | Notification history | UI exists; backend `GET /web-push/notify` is under development and the adapter returns simulated history on errors. |
| `/notifications/compose` | Compose and send | UI calls `PUT /api/v1/web-push/notify`; current backend emits an asynchronous event but does not confirm provider delivery. |
| `/subscribers` | Push subscribers | UI and adapters call subscriber list/query/create/delete endpoints. |
| `/sites` | Sites and resources | UI exists; site/resource CRUD currently uses in-memory simulated data because resource endpoints are not implemented. |
| `/config` | Push configuration | UI calls `GET /api/v1/web-push/config` for the public VAPID key. Private keys are not displayed. |
| `/administration` | Users, roles, and permissions | Read-only seeded data; CRUD routes are not mounted and mutations are disabled. Vendor administration is not implemented. |
| `/settings` | Organization settings | UI calls organization list/read/update/delete routes. DNS/hostname verification is not available. |
| `/profile` | Profile and security | UI calls `/api/v1/me` for profile, password, and logout operations; these routes are not mounted. |

Authenticated pages are nested under the application layout with a responsive sidebar/navbar. Shared components include notification preview, status badges, endpoint masking, confirmation modal, offline indicator, code snippets, and PWA install control.

## API integration and simulation

`src/services/apiClient.ts` centralizes the API base URL and bearer token handling. `src/services/apiAdapters.ts` contains auth, organization, Web Push, site, and administration adapters.

The frontend supports seeded in-memory simulation data. Several adapters also fall back to simulated data when a network request fails, while notification history currently falls back on any request error. The auth context creates a seeded demo session when no token is present. Treat the dashboard as a prototype/demo; a successful-looking UI action may be simulated and must not be interpreted as a backend result.

Known contract gaps to resolve before live use:

- Login UI sends `{ user, password }`, while the current OpenAPI login schema says `{ email, password }`; backend login is not implemented.
- `AuthContext` starts a seeded demo session when there is no saved token. Organization registration also assigns a locally generated token instead of a server-issued login token; the context token and API-client token are generated separately and can differ.
- Owner profile sex values are lowercase in frontend types, while the backend user model accepts `Male`, `Female`, or `Other`.
- Organization provisioning status is event-driven; the current API has no status/polling endpoint, so the UI cannot confirm that the owner/role/grants are ready.
- The target signup flow requires pending-review status emails, approve/request-changes/reject outcomes, a restricted registration area for applicants asked to make changes, and activation only after successful provisioning. These are not implemented.
- The target operator console is protected and uses `mgmt.soochak.optiwari.duckdns.org` in local development and `mgmt.soochak.bizbandhan.com` in production. Hosted tenant dashboards/APIs use `[tenant].soochak.optiwari.duckdns.org` locally and `[tenant].soochak.bizbandhan.com` in production. The current backend derives tenant scope from request host and does not yet separate tenant dashboard host from customer website origin.
- Direct operator-created organizations skip applicant review; the operator supplies the owner's initial password outside the system and the owner must change it at first login. Operator provisioning must gate activation.
- Email verification, hostname ownership checks, custom dashboard domains, plan payment, and synchronized updates/configuration for self-hosted deployments are deferred.
- Sites are local simulation data; there is no resource API contract yet.
- User/role/permission screens use static seed records; the documented routes are not mounted. Vendor has no backend model.
- Subscriber/notification fields in demo records (such as tags and delivery stats) exceed the current backend schemas.
- The API client persists JWTs in `localStorage`; choose and implement the production token/cookie and CSRF model before deployment.

The backend and the attached OpenAPI files remain the contract authority. Do not add fake writes as a substitute for missing APIs; label demo data and unavailable operations in the UI.

## Planned frontend work

The page inventory and remaining integration tasks are tracked in [`../tasks/frontend.todo`](../tasks/frontend.todo). The AI Studio generation brief is in [`../tasks/google-ai-studio-prompt.md`](../tasks/google-ai-studio-prompt.md).
