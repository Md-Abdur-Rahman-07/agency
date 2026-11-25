// Builds the blog listing, one page per article, the redirect page for old links, and the sitemap.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {posts} = JSON.parse(fs.readFileSync(path.join(root,'blog/posts.json'),'utf8'));
const template = fs.readFileSync(path.join(root,'blog/blog-shell.html'),'utf8');
const origin = 'https://www.orbitwick.com';
const {esc, url, words, minutes, date, serviceLink, sourceLink, card, relatedCard} = require('./blog.js');
function shell(title, description, route, mode, content) {
  const head = `<title>${esc(title)} | OrbitWick</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${origin}/${route}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OrbitWick">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${origin}/${route}">
<meta property="og:image" content="${origin}/${esc(posts[0].image)}">
<meta name="twitter:card" content="summary_large_image">`;
  return template.replace('{{HEAD}}',head).replace('{{CONTENT}}',content).replaceAll('{{ROOT}}','').replace('<main id="main">',`<main id="main" data-journal="${mode}">`);
}
const up = html => html.replace(/(href|src)="(?!https?:|\/|#|mailto:|tel:|data:)([^"]+)"/g, '$1="../$2"');
function article(post, posts) {
  let heading = 0;
  const toc = [];
  const cite = value => esc(value).replace(/\[(\d+)\]/g, (match, number) => post.sources[number-1] ? `<a class="journal-citation" href="${sourceLink(post.sources[number-1].url)}" aria-label="Source ${number}: ${esc(post.sources[number-1].title)}">[${number}]</a>` : match);
  const body = post.content.map(block => {
    if (block.type === 'h2') { const id = 'section-' + (++heading); toc.push({id, title:block.text}); return `<h2 id="${id}">${esc(block.text)}</h2>`; }
    if (block.type === 'h3') return `<h3>${esc(block.text)}</h3>`;
    if (block.type === 'ul' || block.type === 'ol') return `<${block.type}>${block.items.map(item => `<li>${cite(item)}</li>`).join('')}</${block.type}>`;
    return `<p>${cite(block.text)}</p>`;
  }).join('');
  const related = posts.filter(other => other.slug !== post.slug).sort((a,b) => Number(b.service.href === post.service.href) - Number(a.service.href === post.service.href)).slice(0,5);
  return `<header class="journal-article-header"><div class="container"><nav class="journal-breadcrumb" aria-label="Breadcrumb"><a href="/blog">Blog</a><span aria-hidden="true"> / </span><span>${esc(post.category)}</span></nav><h1>${esc(post.title)}</h1><div class="journal-byline"><time datetime="${esc(post.date)}">${date(post)}</time><span>${minutes(post)} min read</span></div></div></header>
    <div class="container journal-article-layout"><aside class="journal-sidebar"><nav aria-label="On this page"><p>On this page</p><ol>${toc.map(t => `<li><a href="#${t.id}">${esc(t.title)}</a></li>`).join('')}</ol></nav><a class="journal-service-link" href="${serviceLink(post.service.href)}">Explore ${esc(post.service.name)} ↗</a></aside>
    <article class="journal-article"><figure class="journal-cover-figure"><img class="journal-cover" src="${esc(post.image)}" alt="${esc(post.imageAlt)}" width="1200" height="650" fetchpriority="high"></figure>${post.takeaway ? `<div class="journal-takeaway"><strong>The short answer</strong><p>${esc(post.takeaway)}</p></div>` : ''}${body}
    <section class="journal-sources" aria-label="References"><h2>Sources &amp; further reading</h2><ol>${post.sources.map(source => `<li><a href="${sourceLink(source.url)}">${esc(source.title)}</a></li>`).join('')}</ol></section>
    <div class="journal-share"><button type="button" data-copy-link>Copy article link</button><span role="status" id="copy-status"></span></div></article></div>
    <section class="journal-related"><div class="container"><h2>Useful next reads</h2><div class="journal-related-grid">${related.map(relatedCard).join('')}</div></div></section>`;
}
function articlePage(post) {
  const canonical = origin + url(post);
  const graph = [{'@context':'https://schema.org','@type':'BlogPosting',headline:post.title,description:post.excerpt,image:[origin+'/'+post.image],datePublished:post.date+'T09:00:00+06:00',dateModified:(post.updated||post.date)+'T09:00:00+06:00',author:{'@type':'Organization',name:post.author,url:origin+'/about'},publisher:{'@type':'Organization','@id':origin+'/#organization',name:'OrbitWick',url:origin+'/',logo:{'@type':'ImageObject',url:origin+'/img/fav.png'}},inLanguage:'en',articleSection:post.category,keywords:(post.tags||[]).join(', '),mainEntityOfPage:canonical,wordCount:words(post)}, {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:'Blog',item:origin+'/blog'},{'@type':'ListItem',position:3,name:post.title,item:canonical}]}];
  const head = `<title>${esc(post.title)} | OrbitWick</title>
<meta name="description" content="${esc(post.excerpt)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="OrbitWick">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.excerpt)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${origin}/${esc(post.image)}">
<meta property="article:published_time" content="${esc(post.date)}">
<meta property="article:modified_time" content="${esc(post.updated||post.date)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g,'\\u003c')}</script>`;
  return up(template.replace('{{HEAD}}',()=>head).replace('{{CONTENT}}',()=>article(post,posts)).replaceAll('{{ROOT}}','').replace('<main id="main">','<main id="main" data-journal="article">'));
}
const listing = `<section class="journal-library" id="guides" aria-labelledby="guides-title"><div class="container"><div class="journal-library-head"><div><h1 id="guides-title">The OrbitWick Blog</h1><p>Practical guides for better websites and digital products.</p></div><label class="journal-search" hidden>Search articles<input id="journal-search" type="search" placeholder="Search by topic or keyword"></label></div>
<div class="journal-filters" role="group" aria-label="Filter articles by topic" hidden></div>
<p id="journal-count" class="journal-count" role="status" tabindex="-1">${posts.length} guides</p>
<div class="journal-grid" id="journal-grid">${posts.map(card).join('')}</div>
<nav class="journal-pagination" id="journal-pagination" aria-label="Blog pagination" hidden></nav>
<p class="journal-empty" id="journal-empty" hidden>No guides match that search. Try another topic or <button type="button" id="journal-reset">clear the filters</button>.</p></div></section>
<section class="journal-cta"><div class="container"><div><div class="eyebrow">Put the ideas into practice</div><h2>Have a specific challenge?</h2><p>Tell us what your website or product needs to do. We’ll help you find a practical starting point.</p></div><a class="btn btn-burgundy" href="/#contact">Talk about your project ↗</a></div></section>`;
const moved = `<section class="journal-library"><div class="container"><h1>This article has moved</h1><p>Taking you to its new page. You can also <a href="/blog">browse all articles</a>.</p></div></section>`;
fs.writeFileSync(path.join(root,'blog.html'),shell('Web Development & Software Blog for Business','Practical web development and software guides on website cost, redesign, SEO, e-commerce, mobile apps, security and SaaS planning from OrbitWick.','blog','listing',listing));
fs.writeFileSync(path.join(root,'blog-post.html'),shell('Article moved','OrbitWick articles now have their own pages.','blog','redirect',moved).replace('content="index,follow,max-image-preview:large"','content="noindex,follow"'));
for (const file of fs.readdirSync(__dirname)) if (file.endsWith('.html') && file !== 'blog-shell.html') fs.unlinkSync(path.join(__dirname,file));
for (const post of posts) fs.writeFileSync(path.join(root,url(post)+'.html'),articlePage(post));
const landing = require('../seo/pages.cjs');
const main = ['','about','services','portfolio','portfolio/saas-products','portfolio/ui-ux-design','portfolio/website-development','portfolio/mobile-app-development','portfolio/cybersecurity','portfolio/website-maintenance','portfolio/cms-ecommerce','rd','blog',...landing.services.map(p=>'services/'+p.slug),...landing.markets.map(p=>'locations/'+p.slug)];
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+main.map(p=>`  <url><loc>${origin}/${p}</loc></url>`).join('\n')+'\n'+posts.map(p=>`  <url><loc>${origin}${esc(url(p))}</loc><lastmod>${esc(p.updated||p.date)}</lastmod></url>`).join('\n')+'\n</urlset>\n');
console.log('Built the blog listing, '+posts.length+' article pages and the sitemap.');
