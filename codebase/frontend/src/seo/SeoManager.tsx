import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPageMetadata,
  PUBLIC_SITE_URL,
  serializeStructuredData,
} from './pageMetadata';

function setMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    const newElement = document.createElement('meta');
    Object.entries(attributes).forEach(([name, value]) => newElement.setAttribute(name, value));
    document.head.append(newElement);
    element = newElement;
  }
  element.content = content;
}

export function SeoManager() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const metadata = useMemo(
    () => getPageMetadata(pathname, isAuthenticated),
    [pathname, isAuthenticated],
  );

  useEffect(() => {
    document.title = metadata.title;
    setMeta('meta[name="description"]', { name: 'description' }, metadata.description);
    setMeta('meta[name="keywords"]', { name: 'keywords' }, metadata.keywords.join(', '));
    setMeta(
      'meta[name="robots"]',
      { name: 'robots' },
      metadata.indexable ? 'index, follow' : 'noindex, nofollow',
    );
    setMeta('meta[property="og:title"]', { property: 'og:title' }, metadata.title);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, metadata.description);
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, metadata.title);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, metadata.description);

    const pageUrl = metadata.indexable
      ? new URL(metadata.path, PUBLIC_SITE_URL).href
      : new URL(pathname, window.location.origin).href;
    setMeta('meta[property="og:url"]', { property: 'og:url' }, pageUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (metadata.indexable) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = pageUrl;
    } else {
      canonical?.remove();
    }

    let structuredData = document.head.querySelector<HTMLScriptElement>('#page-json-ld');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'page-json-ld';
      structuredData.type = 'application/ld+json';
      document.head.append(structuredData);
    }
    structuredData.textContent = serializeStructuredData(metadata, pageUrl);
  }, [metadata, pathname]);

  return null;
}
