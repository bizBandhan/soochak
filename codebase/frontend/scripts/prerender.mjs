import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const distDirectory = path.resolve('dist');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const server = await createServer({
  configFile: path.resolve('vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const [{ AuthProvider }, { HomePage }, { LoginPage }, { RegisterOrgPage },
    { CoachingLandingPage }, { CreatorsLandingPage }, { IndustryLandingPage },
    { industryLandingPages }, seo] = await Promise.all([
    server.ssrLoadModule('/src/context/AuthContext.tsx'),
    server.ssrLoadModule('/src/pages/HomePage.tsx'),
    server.ssrLoadModule('/src/pages/LoginPage.tsx'),
    server.ssrLoadModule('/src/pages/RegisterOrgPage.tsx'),
    server.ssrLoadModule('/src/pages/CoachingLandingPage.tsx'),
    server.ssrLoadModule('/src/pages/CreatorsLandingPage.tsx'),
    server.ssrLoadModule('/src/components/marketing/IndustryLandingPage.tsx'),
    server.ssrLoadModule('/src/pages/IndustryLandingPages.tsx'),
    server.ssrLoadModule('/src/seo/pageMetadata.ts'),
  ]);

  const pages = [
    {
      path: '/',
      render: () => React.createElement(HomePage),
    },
    {
      path: '/login',
      render: () => React.createElement(LoginPage),
    },
    {
      path: '/register',
      render: () => React.createElement(RegisterOrgPage),
    },
    {
      path: '/landing/coaching',
      render: () => React.createElement(CoachingLandingPage),
    },
    {
      path: '/landing/creators',
      render: () => React.createElement(CreatorsLandingPage),
    },
    ...industryLandingPages.map((config) => ({
      path: `/landing/${config.vertical}`,
      render: () => React.createElement(IndustryLandingPage, { config }),
    })),
  ];

  const renderedPaths = new Set(pages.map((page) => page.path));
  const missingPublicPages = seo.publicPageMetadata.filter((page) => !renderedPaths.has(page.path));
  if (missingPublicPages.length) {
    throw new Error(`Missing prerender renderers: ${missingPublicPages.map((page) => page.path).join(', ')}`);
  }

  const template = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
  await writeFile(path.join(distDirectory, 'app-shell.html'), template);

  for (const page of pages) {
    const metadata = seo.getPageMetadata(page.path, false);
    const markup = renderToString(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(MemoryRouter, { initialEntries: [page.path] }, page.render()),
      ),
    );
    const pageUrl = new URL(page.path, seo.PUBLIC_SITE_URL).href;
    const keywords = escapeHtml(metadata.keywords.join(', '));
    const robots = metadata.indexable ? 'index, follow' : 'noindex, nofollow';
    const html = template
      .replace('<div id="root" class="h-full"></div>', `<div id="root" class="h-full">${markup}</div>`)
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${escapeHtml(metadata.description)}" />`)
      .replace(/<meta name="keywords" content=".*?" \/>/,
        `<meta name="keywords" content="${keywords}" />`)
      .replace(/<meta name="robots" content=".*?" \/>/,
        `<meta name="robots" content="${robots}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/,
        `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/,
        `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/,
        `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/,
        `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/,
        `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`)
      .replace(
        '</head>',
        `  ${metadata.indexable ? `<link rel="canonical" href="${escapeHtml(pageUrl)}" />` : ''}\n` +
        `  <script id="page-json-ld" type="application/ld+json">${seo.serializeStructuredData(metadata, pageUrl)}</script>\n  </head>`,
      );
    const outputDirectory = path.join(distDirectory, page.path.slice(1));
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, 'index.html'), html);
  }

  const sitemapUrls = seo.publicPageMetadata
    .filter((page) => page.indexable)
    .map((page) => `  <url><loc>${escapeXml(new URL(page.path, seo.PUBLIC_SITE_URL).href)}</loc></url>`)
    .join('\n');
  await writeFile(
    path.join(distDirectory, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`,
  );
} finally {
  await server.close();
}
