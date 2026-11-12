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
| `/register` | Organization registration | Prototype registration creates the organization and sole owner under `<slug>.<HOSTED_DOMAIN>`, then links to the workspace sign-in page. It does not set a cookie on the shared signup hostname. Operator review and status emails remain unimplemented. |
| `/landing/coaching` | Coaching and tuition landing page | Public page linking to registration with `vertical=coaching`. |
| `/landing/creators` | Creators and publishers landing page | Public page linking to registration with `vertical=creators`. |
| `/landing/retailers` | Local businesses and retailers landing page | Public page linking to registration with `vertical=retailers`. |
| `/landing/jobs` | Job portals and recruiters landing page | Public page linking to registration with `vertical=jobs`. |
| `/landing/events` | Event organizers landing page | Public page linking to registration with `vertical=events`. |
| `/landing/schools` | Schools and colleges landing page | Public page linking to registration with `vertical=schools`. |
| `/landing/saas` | SaaS products and communities landing page | Public page linking to registration with `vertical=saas`. |
| `/` | Home or dashboard | Signed-out visitors see the public introduction, audience use cases, and links to landing pages, login, and registration. Signed-in workspace users see their dashboard overview. |
| `/notifications` | Notification history | Reads persisted notification records and provider outcome counts; device display and click tracking are planned for the next version. |
| `/notifications/compose` | Compose and send | UI calls `PUT /api/v1/web-push/notify`; backend records attempts and starts in-process dispatch without confirming device delivery. |
| `/subscribers` | Push subscribers | UI and adapters call subscriber list/query/create/delete endpoints. |
| `/sites` | Sites and resources | Register/remove exact HTTPS website origins per workspace and download a client module and Service Worker handler. Origin ownership is not verified. |
| `/config` | Push configuration | UI calls `GET /api/v1/web-push/config` for the workspace's public VAPID key, creating a pair if missing. Private keys are not displayed. |
| `/administration` | Users, roles, and permissions | Dashboard administration is unavailable; no sample records are displayed. Vendor administration is not implemented. |
| `/settings` | Organization settings | UI calls organization list/read/update/delete routes. DNS/hostname verification is not available. |
| `/profile` | Profile and security | UI calls the mounted `/api/v1/me` routes for profile reads/updates, password changes, and logout. |

Authenticated pages are nested under the application layout with a responsive sidebar/navbar. Shared components include notification preview, status badges, endpoint masking, confirmation modal, offline indicator, code snippets, and PWA install control.

Landing-page registration links include a `vertical` query parameter; the current registration form does not use or save it.

The frontend serves [`robots.txt`](../codebase/frontend/public/robots.txt) and [`sitemap.xml`](../codebase/frontend/public/sitemap.xml) at the site root. The sitemap lists the public pages on the documented live hostname `https://soochak.bizbandhan.com`; update both files when that hostname or the public route inventory changes. Development and workspace hosts serve the same files and point crawlers to the live sitemap. Robots directives are crawler guidance, not access control.

## API integration

`src/services/apiClient.ts` centralizes the API base URL, cookie-session requests, and legacy bearer token handling. `src/services/apiAdapters.ts` contains auth, organization, Web Push, site, and administration adapters.

The dashboard uses live API responses and surfaces request failures rather than replacing them with simulated results. Simulation controls and fabricated test subscriptions have been removed. Organization settings and administration are unavailable until their UI is aligned with backend behavior. Provider acceptance does not prove device delivery or display; display and click tracking are planned for the next version.

Known contract gaps to resolve before live use:

- Registration uses the organization slug to assign the personal workspace hostname; owner login happens on that host so the host-scoped httpOnly cookie is set in the correct workspace.
- Owner profile sex values are lowercase in frontend types, while the backend user model accepts `Male`, `Female`, or `Other`.
- The target signup flow requires pending-review status emails, approve/request-changes/reject outcomes, a restricted registration area for applicants asked to make changes, and activation only after successful provisioning. These are not implemented.
- The target operator console is protected and uses `mgmt.bizbandhan.duckdns.org` in local development and `mgmt.soochak.bizbandhan.com` in production. During the prototype, each user has one unique Soochak dashboard/API hostname (`<slug>.bizbandhan.duckdns.org` locally, `<slug>.soochak.bizbandhan.com` in production), and that hostname identifies the personal workspace. The customer's website origin is separate. A separate tenant entity/ID is deferred until after market validation. The backend binds sessions and scopes user data by the request host, and enforces one user per hostname.
- Direct operator-created organizations skip applicant review; the operator supplies the owner's initial password outside the system and the owner must change it at first login. Operator provisioning must gate activation.
- Email verification, hostname ownership checks, custom dashboard domains, plan payment, and synchronized updates/configuration for self-hosted deployments are deferred.
- Site origins are stored per workspace; per-site subscriber counts, quotas, and domain ownership verification are not implemented. The client kit uses the workspace API hostname and never includes credentials or private VAPID keys. Existing workers and subscriptions are not replaced automatically.
- User/role/permission dashboard screens are unavailable; vendor has no backend model.
- Device display/click outcomes and tag-based audience targeting are not implemented. Provider outcome tracking uses an in-process dispatcher and does not automatically retry uncertain sends or remove expired subscriptions.

The backend and the attached OpenAPI files remain the contract authority. Do not add fake writes as a substitute for missing APIs; label demo data and unavailable operations in the UI.

## Planned frontend work

The page inventory and remaining integration tasks are tracked in [`../tasks/frontend.todo`](../tasks/frontend.todo). The AI Studio generation brief is in [`../tasks/google-ai-studio-prompt.md`](../tasks/google-ai-studio-prompt.md).
