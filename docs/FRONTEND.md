# Frontend Status and Route Guide

**Product:** Soochak by BizBandhan  
**Status:** Prototype dashboard; UI pages exist, and API integration is partial. Updated 2026-10-29.

## Application

The standalone dashboard is under `codebase/frontend/`. It uses React 19, TypeScript, Vite, Tailwind CSS, and React Router. It is not currently a service in `docker-compose.yml`; run it separately from the backend.

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
| `/register-org` | Organization registration | UI and adapter call `PUT /api/v1/auth/organization`; owner provisioning is asynchronous. Hostname verification is unavailable. |
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
- Sites are local simulation data; there is no resource API contract yet.
- User/role/permission screens use static seed records; the documented routes are not mounted. Vendor has no backend model.
- Subscriber/notification fields in demo records (such as tags and delivery stats) exceed the current backend schemas.
- The API client persists JWTs in `localStorage`; choose and implement the production token/cookie and CSRF model before deployment.

The backend and the attached OpenAPI files remain the contract authority. Do not add fake writes as a substitute for missing APIs; label demo data and unavailable operations in the UI.

## Planned frontend work

The page inventory and remaining integration tasks are tracked in [`../tasks/frontend.todo`](../tasks/frontend.todo). The AI Studio generation brief is in [`../tasks/google-ai-studio-prompt.md`](../tasks/google-ai-studio-prompt.md).
