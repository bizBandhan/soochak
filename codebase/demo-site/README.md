# Soochak Push Demo

This is a static HTML, CSS, and JavaScript test site. It has no framework, build step, backend, or package dependencies.

## Host and connect

1. Copy `index.html`, `style.css`, `app.mjs`, and `worker-registration.mjs` to a static host on a dedicated HTTPS domain or subdomain. For example, host them at `https://push-test.example.com/`. The host must serve `.mjs` and `.js` with a JavaScript MIME type and allow the Service Worker script to be fetched without login.
2. Open the hosted page and copy the exact origin shown in step 1. Sign in to your Soochak **workspace hostname**, open **Sites & Allowed Origins**, and add this origin. If hosting at the domain root, use `/soochak-worker.js` as the worker path.
3. Select that site and download **client JavaScript** and **worker handler**. Upload them to the same directory as the page as `soochak-client.js` and `soochak-worker.js`, then reload the page. These files contain the workspace API URL and public VAPID key, not the private key. Do not edit the generated client.
4. Click **Register demo worker**, then **Subscribe**, and allow notifications. The client calls the workspace API without dashboard cookies. It will not replace a push subscription using another VAPID key.
5. In Soochak, send a test notification with a destination URL on the demo site's origin. The send targets the workspace's subscribers, so use a test workspace or check the audience first. An accepted send is not proof of delivery: confirm the notification actually appears, then click it.
6. Click **Unsubscribe** to remove the backend record and browser subscription. Leave the site origin registered until unsubscribe is complete; the client stores the subscriber ID in this browser's local storage.

For a subdirectory deployment, register the site's origin without the path (for example `https://push-test.example.com`) and set the worker path in Soochak to the actual hosted path (for example `/demo/soochak-worker.js`). The worker controls only its directory and descendants. Notification click URLs must remain on the demo origin.

The demo refuses to replace an existing Service Worker covering the page. To test against an existing worker, add the downloaded handler to that worker (or merge its push and click handlers if it already handles those events), deploy the updated existing worker, and use **Subscribe** without registering the demo worker. This demo cannot verify that an existing worker actually contains the handler.

## After a workspace hostname change or database reset

Sign in to the new workspace over HTTPS, add the demo's exact origin again if it is not registered, and download and deploy a fresh client and worker handler. The client embeds the workspace API URL and VAPID public key, so an old download cannot be reused after a reset creates a new key.

A browser may still have the old push subscription. The client will refuse to replace a subscription using another VAPID key. On a dedicated demo site where the existing worker and subscription are yours to remove, use the browser's developer tools to unregister that demo Service Worker, close and reopen the demo page, then register the worker and subscribe again. This removes the old browser subscription; do not unregister an unrelated or shared Service Worker. For an existing application worker, manage the old subscription through that application's own unsubscribe process instead. If the old backend has been reset, its subscriber record is already gone.

If the client cannot load, check that the files were uploaded with the names above and served as JavaScript. If the subscription request fails, verify the workspace URL embedded in the downloaded client, the exact allowed origin, HTTPS access, the browser permission, and the workspace plan limit. For iOS/iPadOS, test Web Push in a supported browser and installation context. Do not share subscription endpoints or private keys in test reports.

## Tests

Run `node --test codebase/demo-site/worker-registration.test.mjs` from the repository root. This checks registration scope and existing-worker protection; actual browser push delivery still requires the hosted HTTPS test.
