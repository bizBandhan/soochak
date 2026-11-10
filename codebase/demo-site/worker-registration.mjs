export async function registerDemoWorker(serviceWorker, pageUrl) {
  const directory = new URL('./', pageUrl);
  const script = new URL('soochak-worker.js', directory);
  const registrations = await serviceWorker.getRegistrations();
  const overlapping = registrations.find((registration) =>
    registration.scope === directory.href || pageUrl.href.startsWith(registration.scope));
  if (overlapping) {
    const worker = overlapping.active || overlapping.waiting || overlapping.installing;
    if (overlapping.scope !== directory.href || !worker || worker.scriptURL !== script.href) {
      throw new Error('An existing Service Worker covers this page or scope. Integrate the Soochak handler into it; it will not be replaced.');
    }
    return overlapping;
  }
  return serviceWorker.register(script.href, { scope: directory.pathname });
}
