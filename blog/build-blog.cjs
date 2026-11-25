// Builds only the two shared page shells and sitemap. Article content loads at runtime.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {posts} = JSON.parse(fs.readFileSync(path.join(root,'blog/posts.json'),'utf8'));
const template = fs.readFileSync(path.join(root,'blog/blog-shell.html'),'utf8');
const origin = 'https://www.orbitwick.com';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shell(title, description, route, mode, content) {
  const head = `<title>${esc(title)} | OrbitWick</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${origin}/${route}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${origin}/${route}">
<meta property="og:image" content="${origin}/${esc(posts[0].image)}">
<meta name="twitter:card" content="summary_large_image">`;
  return template.replace('{{HEAD}}',head).replace('{{CONTENT}}',content).replaceAll('{{ROOT}}','').replace('<main id="main">',`<main id="main" data-journal="${mode}" aria-busy="true">`);
}
const listing = `<section class="journal-library" id="guides" aria-labelledby="guides-title"><div class="container"><div class="journal-library-head"><div><h1 id="guides-title">The OrbitWick Blog</h1><p>Practical guides for better websites and digital products.</p></div><label class="journal-search" hidden>Search articles<input id="journal-search" type="search" placeholder="Search by topic or keyword"></label></div>
<div class="journal-filters" role="group" aria-label="Filter articles by topic" hidden></div>
<p id="journal-count" class="journal-count" role="status" tabindex="-1">Loading articles…</p>
<noscript><p>Please enable JavaScript to browse the articles.</p></noscript>
<div class="journal-grid" id="journal-grid"></div>
<nav class="journal-pagination" id="journal-pagination" aria-label="Blog pagination" hidden></nav>
<p class="journal-empty" id="journal-empty" hidden>No guides match that search. Try another topic or <button type="button" id="journal-reset">clear the filters</button>.</p></div></section>
<section class="journal-cta"><div class="container"><div><div class="eyebrow">Put the ideas into practice</div><h2>Have a specific challenge?</h2><p>Tell us what your website or product needs to do. We’ll help you find a practical starting point.</p></div><a class="btn btn-burgundy" href="index.html#contact">Talk about your project ↗</a></div></section>`;
const article = `<section class="journal-library"><div class="container"><h1>OrbitWick Blog</h1><p role="status">Loading article…</p><noscript><p>Please enable JavaScript to read this article.</p></noscript><a href="blog.html">Browse all articles</a></div></section>`;
fs.writeFileSync(path.join(root,'blog.html'),shell('Website & Product Guides for Business','Practical guides to website costs, redesigns, maintenance, e-commerce, mobile apps, security and SaaS planning from OrbitWick.','blog.html','listing',listing));
fs.writeFileSync(path.join(root,'blog-post.html'),shell('OrbitWick Blog','Practical website and product guides for your business.','blog-post.html','article',article));
const main = ['','about.html','services.html','portfolio.html','portfolio/saas-products.html','portfolio/ui-ux-design.html','portfolio/website-development.html','portfolio/mobile-app-development.html','portfolio/cybersecurity.html','portfolio/website-maintenance.html','portfolio/cms-ecommerce.html','rd.html','blog.html'];
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+main.map(p=>`  <url><loc>${origin}/${p}</loc></url>`).join('\n')+'\n'+posts.map(p=>`  <url><loc>${origin}/blog-post.html?slug=${esc(encodeURIComponent(p.slug))}</loc><lastmod>${esc(p.updated||p.date)}</lastmod></url>`).join('\n')+'\n</urlset>\n');
console.log('Built two dynamic blog shells and sitemap for '+posts.length+' articles.');
