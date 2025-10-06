// generateSitemap.js
const fs = require('fs');
const pages = [
  'https://ytmovieshub.website/',
  'https://ytmovieshub.website/latest',
  'https://ytmovieshub.website/trending'
  // Add all dynamic movie URLs
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`).join('')}
</urlset>`;

fs.writeFileSync('./public/sitemap.xml', sitemap);
