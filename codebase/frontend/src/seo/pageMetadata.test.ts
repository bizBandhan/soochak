import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPageStructuredData,
  getPageMetadata,
  privatePageMetadata,
  publicPageMetadata,
  serializeStructuredData,
} from './pageMetadata';
import { isPublicSiteHostname, shouldHydrateApp } from '../constants/site';

test('public routes have unique, indexable metadata and structured data', () => {
  const paths = publicPageMetadata.map((page) => page.path);
  assert.equal(new Set(paths).size, paths.length);

  for (const page of publicPageMetadata) {
    assert.ok(page.title.length > 0, `${page.path} needs a title`);
    assert.ok(page.description.length > 0, `${page.path} needs a description`);
    assert.ok(page.keywords.length > 0, `${page.path} needs keywords`);
    assert.equal(createPageStructuredData(page, `https://soochak.bizbandhan.com${page.path}`)['@context'], 'https://schema.org');
  }

  for (const page of privatePageMetadata) {
    assert.ok(page.title.length > 0, `${page.path} needs a title`);
    assert.ok(page.description.length > 0, `${page.path} needs a description`);
    assert.ok(page.keywords.length > 0, `${page.path} needs keywords`);
    assert.equal(createPageStructuredData(page, `https://workspace.example${page.path}`)['@context'], 'https://schema.org');
  }
});

test('login remains noindex and is excluded from the sitemap inventory', () => {
  const login = getPageMetadata('/login', false);
  assert.equal(login.indexable, false);
  assert.equal(publicPageMetadata.some((page) => page.path === '/login' && page.indexable), false);
});

test('authenticated root and workspace routes use noindex metadata', () => {
  assert.equal(getPageMetadata('/', true).title, 'Workspace Overview | Soochak');
  assert.equal(getPageMetadata('/notifications/compose/', true).indexable, false);
  assert.equal(privatePageMetadata.every((page) => !page.indexable), true);
  assert.equal(new Set(privatePageMetadata.map((page) => page.path)).size, privatePageMetadata.length);
});

test('public base hostnames skip workspace session restoration without matching workspace subdomains', () => {
  assert.equal(isPublicSiteHostname('soochak.bizbandhan.com'), true);
  assert.equal(isPublicSiteHostname('bizbandhan.duckdns.org'), true);
  assert.equal(isPublicSiteHostname('localhost'), true);
  assert.equal(isPublicSiteHostname('biz-bandhan.soochak.bizbandhan.com'), false);
  assert.equal(isPublicSiteHostname('biz-bandhan.bizbandhan.duckdns.org'), false);
});

test('only canonical prerendered public pages skip app hydration', () => {
  assert.equal(shouldHydrateApp('bizbandhan.duckdns.org', '/', true), false);
  assert.equal(shouldHydrateApp('soochak.bizbandhan.com', '/landing/coaching/', true), false);
  assert.equal(shouldHydrateApp('bizbandhan.duckdns.org', '/register', true), true);
  assert.equal(shouldHydrateApp('bizbandhan.duckdns.org', '/login', false), true);
  assert.equal(shouldHydrateApp('acme.bizbandhan.duckdns.org', '/', true), true);
  assert.equal(shouldHydrateApp('bizbandhan.duckdns.org', '/unknown', false), true);
});

test('homepage structured data describes the product and publisher', () => {
  const home = getPageMetadata('/', false);
  const structuredData = createPageStructuredData(home, 'https://soochak.bizbandhan.com/');
  const graph = structuredData['@graph'];
  if (!Array.isArray(graph)) throw new Error('Homepage structured data must contain an @graph.');
  assert.deepEqual(
    graph.map((entry: { '@type': string }) => entry['@type']),
    ['Organization', 'WebSite', 'SoftwareApplication', 'WebPage'],
  );
  assert.doesNotThrow(() => JSON.parse(serializeStructuredData(home, 'https://soochak.bizbandhan.com/')));
});
