// Builds service and market pages, and refreshes the SEO block in existing pages. Safe to run repeatedly.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { services, markets, existing } = require('./pages.cjs');
const { posts } = JSON.parse(fs.readFileSync(path.join(root, 'blog/posts.json'), 'utf8'));
const origin = 'https://www.orbitwick.com';
const ogImage = origin + '/img/og-image.png';
const orgId = origin + '/#organization';
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), s); };
const esc = s => s.replace(/&(?!\w+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const url = f => origin + '/' + (f === 'index.html' ? '' : f.replace(/\.html$/, ''));
// Page links become absolute clean paths, for example ../services.html -> /services
const cleanLinks = (html, dir) => html.replace(/href="(?!https?:|\/|#|mailto:)([^"#?]+)\.html(#[^"]*)?"/g, (m, p, hash) => { const t = path.posix.join(dir, p); return `href="${t === 'index' ? '/' : '/' + t}${hash || ''}"`; });

const organization = {
  '@type': 'ProfessionalService', '@id': orgId, name: 'OrbitWick', url: origin + '/', logo: origin + '/img/fav.png', image: ogImage,
  email: 'contact.orbitwick@gmail.com',
  description: 'Website development, software development, mobile apps, UI/UX design and cybersecurity.',
  address: [
    { '@type': 'PostalAddress', streetAddress: 'Agrabad Commercial Area', addressLocality: 'Chattogram', addressCountry: 'BD' },
    { '@type': 'PostalAddress', addressLocality: 'Austin', addressRegion: 'TX', postalCode: '78701', addressCountry: 'US' }
  ],
  areaServed: markets.map(m => m.area),
  knowsAbout: services.map(s => s.name),
  sameAs: ['https://www.facebook.com/share/19suEp2ySE/', 'https://www.linkedin.com/company/orbitwick/']
};
const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, f], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(f) })) });
const faqSchema = list => ({ '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function seoBlock(f, title, desc, graph) {
  return `<!-- SEO:START -->
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${url(f)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="OrbitWick">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url(f)}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>
  <!-- SEO:END -->`;
}
function applySeo(html, block) {
  if (html.includes('<!-- SEO:START -->')) return html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, () => block);
  html = html.replace(/\s*<meta name="description"\s+content="[\s\S]*?">/, '').replace(/\s*<link rel="canonical"[^>]*>/, '');
  return html.replace(/<title>[\s\S]*?<\/title>/, () => block);
}

// Footer: a "Working worldwide" column that links to the market pages. Applied to every page.
function footer(html) {
  const i = html.indexOf('<footer');
  const foot = html.slice(i).replace(/( *)<h2 class="footer-heading">(?:Services|Working worldwide)<\/h2>\n *<ul class="footer-links">[\s\S]*?<\/ul>/, (m, s) =>
    `${s}<h2 class="footer-heading">Working worldwide</h2>\n${s}<ul class="footer-links">\n${markets.map(k => `${s}  <li><a href="/locations/${k.slug}">${k.name}</a></li>`).join('\n')}\n${s}</ul>`);
  if (!foot.includes('Working worldwide')) throw new Error('Footer column not found');
  return html.slice(0, i) + foot;
}

for (const f of [...Object.keys(existing), 'blog/blog-shell.html']) {
  const raw = fs.readFileSync(path.join(root, f), 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  let html = raw.replace(/\r\n/g, '\n');
  if (existing[f]) {
    const [title, desc, label] = existing[f];
    const sub = f.startsWith('portfolio/');
    const graph = f === 'index.html'
      ? [organization, { '@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: 'OrbitWick', publisher: { '@id': orgId } }]
      : [{ '@type': f === 'about.html' ? 'AboutPage' : sub || f === 'portfolio.html' ? 'CollectionPage' : 'WebPage', name: title, description: desc, url: url(f), publisher: { '@id': orgId } }, crumbs([['Home', 'index.html'], ...(sub ? [['Portfolio', 'portfolio.html']] : []), [label, f]])];
    html = applySeo(html, seoBlock(f, title, desc, graph));
  }
  html = footer(html);
  fs.writeFileSync(path.join(root, f), html.replace(/\n/g, nl));
}

// Landing pages reuse the navigation and footer of a portfolio category page.
const shell = read('portfolio/cybersecurity.html');
const headPart = shell.slice(0, shell.indexOf('  <main')).replace(/ aria-current="(?:page|true)"/g, '').replace('class="active" ', '');
const footPart = shell.slice(shell.indexOf('  <footer')).replace(/ *<script src="portfolio\.js"><\/script>\n/, '');
function landing(dir, p) {
  const f = `${dir}/${p.slug}.html`, market = dir === 'locations';
  const serviceSchema = { '@type': 'Service', name: market ? 'Website and software development' : p.name, description: p.desc, url: url(f), provider: { '@id': orgId }, areaServed: market ? p.area : organization.areaServed };
  const trail = market ? [['Home', 'index.html'], [p.name, f]] : [['Home', 'index.html'], ['Services', 'services.html'], [p.name, f]];
  const graph = [organization, serviceSchema, crumbs(trail), faqSchema(p.faq)];
  const others = market
    ? `<h2>Our services</h2><div class="landing-links">${services.map(s => `<a href="../services/${s.slug}.html">${esc(s.name)}</a>`).join('')}</div>`
    : `<h2>Related services</h2><div class="landing-links">${services.filter(s => s !== p).map(s => `<a href="${s.slug}.html">${esc(s.name)}</a>`).join('')}</div><h2>Where we work</h2><div class="landing-links">${markets.map(m => `<a href="../locations/${m.slug}.html">${m.name}</a>`).join('')}</div>`;
  const guides = market ? [] : posts.filter(a => a.service.href === `/services/${p.slug}`).slice(0, 5);
  const reading = guides.length ? `<h2>Helpful guides</h2><div class="landing-links">${guides.map(a => `<a href="../blog/${a.slug}.html">${esc(a.title)}</a>`).join('')}</div>` : '';
  const work = market ? '../portfolio.html' : `../portfolio/${p.portfolio}.html`;
  const main = `  <main class="landing">
    <div class="container">
      <header class="landing-head">
        <nav class="category-crumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span>${market ? '' : '<a href="../services.html">Services</a><span aria-hidden="true">/</span>'}<span>${esc(p.name)}</span></nav>
        <h1>${esc(p.h1)}</h1>
        <p>${esc(p.lead)}</p>
        <div class="landing-actions"><a class="btn btn-burgundy" href="../index.html#contact">Get a free consultation</a><a class="landing-more" href="${work}">See our work</a></div>
      </header>
      <div class="landing-body">
        <div class="landing-copy">
${p.sections.map(([h, t]) => `          <section><h2>${esc(h)}</h2><p>${esc(t)}</p></section>`).join('\n')}
        </div>
        <aside class="landing-list"><h2>${market ? 'What we build' : "What's included"}</h2><ul>${p.list.map(i => `<li>${esc(i)}</li>`).join('')}</ul></aside>
      </div>
      <section class="landing-faq"><h2>Questions and answers</h2><div class="portfolio-faq-list">${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>
      <section class="landing-related">${reading}${others}</section>
    </div>
  </main>

`;
  write(f, applySeo(headPart, seoBlock(f, p.title, p.desc, graph)) + cleanLinks(main, dir) + footPart);
}
services.forEach(s => landing('services', s));
markets.forEach(m => landing('locations', m));
console.log(`Updated ${Object.keys(existing).length} pages; built ${services.length} service and ${markets.length} market pages.`);
