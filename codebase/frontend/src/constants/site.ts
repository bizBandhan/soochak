export const PUBLIC_SITE_URL = 'https://soochak.bizbandhan.com';

const publicSiteHostnames = new Set([
  new URL(PUBLIC_SITE_URL).hostname,
  'bizbandhan.duckdns.org',
  'localhost',
]);

export function isPublicSiteHostname(hostname: string): boolean {
  return publicSiteHostnames.has(hostname.toLowerCase());
}

export function shouldHydrateApp(hostname: string, pathname: string, hasCanonical: boolean): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return !(
    isPublicSiteHostname(hostname)
    && hasCanonical
    && normalizedPath !== '/register'
  );
}
