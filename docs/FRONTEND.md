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

Set `VITE_API_BASE_URL` to the API base URL when needed; the default is `/api/v1`. The backend `HOSTED_DOMAIN` must match the platform signup host. Wildcard DNS/TLS are managed externally through NGINX Proxy Manager on the `publicweb` network. `npm run build` creates a production build and `npm run lint` runs TypeScript checking (`tsc --noEmit`).

## Routes and pages

| Frontend route | Page | Current state |
|---|---|---|
| `/login` | Login | UI and API adapter call the implemented cookie-session login endpoint; sign-in must happen on the user's assigned hostname. |
| `/register-org` | Organization registration | Prototype registration creates the organization and sole owner under `<slug>.<HOSTED_DOMAIN>`, then links to the workspace sign-in page. It does not set a cookie on the shared signup hostname. Operator review and status emails remain unimplemented. |
| `/` | Dashboard overview | Dashboard shell exists; metrics use seeded/demo data where APIs are unavailable. |
| `/notifications` | Notification history | UI exists; backend `GET /web-push/notify` is under development and the adapter returns simulated history on errors. |
| `/notifications/compose` | Compose and send | UI calls `PUT /api/v1/web-push/notify`; current backend emits an asynchronous event but does not confirm provider delivery. |
| `/subscribers` | Push subscribers | UI and adapters call subscriber list/query/create/delete endpoints. |
| `/sites` | Sites and resources | Register/remove exact HTTPS website origins per workspace and download a client module and Service Worker handler. Origin ownership is not verified. |
| `/config` | Push configuration | UI calls `GET /api/v1/web-push/config` for the workspace's public VAPID key, creating a pair if missing. Private keys are not displayed. |
| `/administration` | Users, roles, and permissions | One user is assigned per hostname; additional user creation is unsupported. Role/permission UI remains read-only seeded data because those CRUD routes are not mounted. Vendor administration is not implemented. |
| `/settings` | Organization settings | UI calls organization list/read/update/delete routes. DNS/hostname verification is not available. |
| `/profile` | Profile and security | UI calls the mounted `/api/v1/me` routes for profile reads/updates, password changes, and logout. |

Authenticated pages are nested under the application layout with a responsive sidebar/navbar. Shared components include notification preview, status badges, endpoint masking, confirmation modal, offline indicator, code snippets, and PWA install control.

## API integration and simulation

`src/services/apiClient.ts` centralizes the API base URL, cookie-session requests, and legacy bearer token handling. `src/services/apiAdapters.ts` contains auth, organization, Web Push, site, and administration adapters.

The frontend supports seeded in-memory simulation data. Several adapters also fall back to simulated data when a network request fails, while notification history currently falls back on any request error. The VAPID configuration adapter uses seed data only in explicitly selected simulation mode and reports failures in live mode. The auth context checks the backend session and does not create a demo login when no session exists. Treat the dashboard as a prototype/demo; a successful-looking UI action may be simulated and must not be interpreted as a backend result.

Known contract gaps to resolve before live use:

- Registration uses the organization slug to assign the personal workspace hostname; owner login happens on that host so the host-scoped httpOnly cookie is set in the correct workspace.
- Owner profile sex values are lowercase in frontend types, while the backend user model accepts `Male`, `Female`, or `Other`.
- The target signup flow requires pending-review status emails, approve/request-changes/reject outcomes, a restricted registration area for applicants asked to make changes, and activation only after successful provisioning. These are not implemented.
- The target operator console is protected and uses `mgmt.soochak.optiwari.duckdns.org` in local development and `mgmt.soochak.bizbandhan.com` in production. During the prototype, each user has one unique Soochak dashboard/API hostname (`<slug>.soochak.optiwari.duckdns.org` locally, `<slug>.soochak.bizbandhan.com` in production), and that hostname identifies the personal workspace. The customer's website origin is separate. A separate tenant entity/ID is deferred until after market validation. The backend binds sessions and scopes user data by the request host, and enforces one user per hostname.
- Direct operator-created organizations skip applicant review; the operator supplies the owner's initial password outside the system and the owner must change it at first login. Operator provisioning must gate activation.
- Email verification, hostname ownership checks, custom dashboard domains, plan payment, and synchronized updates/configuration for self-hosted deployments are deferred.
- Site origins are stored per workspace; per-site subscriber counts, quotas, and domain ownership verification are not implemented. The client kit uses the workspace API hostname and never includes credentials or private VAPID keys. Existing workers and subscriptions are not replaced automatically.
- User/role/permission screens use static seed records; the documented routes are not mounted. Vendor has no backend model.
- Subscriber/notification fields in demo records (such as tags and delivery stats) exceed the current backend schemas.
- The API client still has legacy bearer-token persistence in `localStorage`, while current login uses an httpOnly cookie. Remove or explicitly retain the legacy path and define Secure/SameSite and CSRF protections before deployment.

The backend and the attached OpenAPI files remain the contract authority. Do not add fake writes as a substitute for missing APIs; label demo data and unavailable operations in the UI.

## Planned frontend work

The page inventory and remaining integration tasks are tracked in [`../tasks/frontend.todo`](../tasks/frontend.todo). The AI Studio generation brief is in [`../tasks/google-ai-studio-prompt.md`](../tasks/google-ai-studio-prompt.md).
