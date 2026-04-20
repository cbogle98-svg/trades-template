// Postbuild: write dist/sitemap.xml using client.json's siteUrl.
// Single-page Astro site — only one URL to list.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const client = JSON.parse(readFileSync('src/data/client.json', 'utf8'));
const siteUrl = client.siteUrl;

if (!siteUrl) {
  console.log('  (no client.siteUrl set — skipping sitemap.xml)');
  process.exit(0);
}

if (!existsSync('dist')) {
  console.log('  (no dist/ — skipping sitemap.xml)');
  process.exit(0);
}

const today = new Date().toISOString().split('T')[0];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

writeFileSync('dist/sitemap.xml', xml);
console.log(`  ✓ Wrote dist/sitemap.xml (${siteUrl})`);
