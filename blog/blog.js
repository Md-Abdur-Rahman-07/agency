(function () {
  'use strict';
  const root = document.querySelector('[data-journal]');
  if (!root) return;
  const origin = 'https://www.orbitwick.com';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = post => 'blog-post.html?slug=' + encodeURIComponent(post.slug);
  const words = post => post.content.reduce((n, block) => n + (block.text || (block.items || []).join(' ')).split(/\s+/).length, 0);
  const minutes = post => Math.max(1, Math.ceil(words(post) / 200));
  const date = post => new Date(post.date + 'T00:00:00+06:00').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Dhaka'});
  const serviceLink = value => /^(?:services|index|about)\.html(?:#[\w-]+)?$/.test(value) ? esc(value) : '#';
  const sourceLink = value => /^https:\/\//.test(value) ? esc(value) : '#';
  function card(post) {
    return `<article class="journal-card" data-category="${esc(post.category)}" data-search="${esc((post.title+' '+post.excerpt+' '+(post.tags || []).join(' ')).toLowerCase())}">
      <figure class="journal-card-figure"><a class="journal-card-image" href="${url(post)}" tabindex="-1" aria-hidden="true"><img src="${esc(post.image)}" alt="" width="800" height="520" loading="lazy"></a></figure>
      <div class="journal-card-copy"><span class="journal-category">${esc(post.category)}</span><p class="journal-meta"><time datetime="${esc(post.date)}">${date(post)}</time> · ${minutes(post)} min read</p><h2><a href="${url(post)}" title="${esc(post.title)}">${esc(post.title)}</a></h2><p>${esc(post.excerpt)}</p><a class="journal-read" href="${url(post)}" aria-label="Read ${esc(post.title)}">Read guide <span aria-hidden="true">↗</span></a></div></article>`;
  }
  function relatedCard(post) {
    return `<a class="journal-related-card" href="${url(post)}"><img src="${esc(post.image)}" alt="" width="800" height="520" loading="lazy"><span class="journal-related-copy"><span class="journal-category">${esc(post.category)}</span><strong>${esc(post.title)}</strong><span class="journal-related-meta"><time datetime="${esc(post.date)}">${date(post)}</time> · ${minutes(post)} min read</span></span></a>`;
  }
  function listing(posts) {
    const grid = document.getElementById('journal-grid');
    const filters = document.querySelector('.journal-filters');
    const search = document.getElementById('journal-search');
    const count = document.getElementById('journal-count');
    const empty = document.getElementById('journal-empty');
    const pagination = document.getElementById('journal-pagination');
    const pageSize = 12;
    let page = 1;
    let active = 'All';
    filters.innerHTML = ['All', ...new Set(posts.map(p => p.category))].map(category => `<button type="button" data-category="${esc(category)}" aria-pressed="${category === 'All'}">${esc(category)}</button>`).join('');
    filters.hidden = false;
    search.parentElement.hidden = false;
    function update() {
      const query = search.value.trim().toLowerCase();
      const matches = posts.filter(post => (active === 'All' || post.category === active) && (post.title+' '+post.excerpt+' '+(post.tags || []).join(' ')).toLowerCase().includes(query));
      const pages = Math.ceil(matches.length / pageSize);
      page = Math.min(page, Math.max(1, pages));
      const start = (page - 1) * pageSize;
      grid.innerHTML = matches.slice(start, start + pageSize).map(card).join('');
      filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === active)));
      count.textContent = (matches.length ? `${start + 1}–${Math.min(start + pageSize, matches.length)} of ${matches.length}` : '0') + (matches.length === 1 ? ' guide' : ' guides') + (active !== 'All' ? ' / ' + active : '');
      empty.hidden = matches.length !== 0;
      pagination.hidden = pages <= 1;
      pagination.innerHTML = pages > 1 ? `<button type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">Previous</button>${Array.from({length:pages}, (_, index) => `<button type="button" data-page="${index + 1}" aria-label="Page ${index + 1}" ${page === index + 1 ? 'aria-current="page"' : ''}>${index + 1}</button>`).join('')}<button type="button" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">Next</button>` : '';
    }
    filters.addEventListener('click', event => {
      const button = event.target.closest('button[data-category]');
      if (button) { active = button.dataset.category; page = 1; update(); }
    });
    search.addEventListener('input', () => { page = 1; update(); });
    document.getElementById('journal-reset').addEventListener('click', () => { search.value = ''; active = 'All'; page = 1; update(); search.focus(); });
    pagination.addEventListener('click', event => {
      const button = event.target.closest('button[data-page]');
      if (!button || button.disabled || Number(button.dataset.page) === page) return;
      page = Number(button.dataset.page);
      update();
      count.focus({preventScroll:true});
      count.scrollIntoView({block:'start', behavior:'instant'});
    });
    update();
  }
  function metadata(post) {
    const canonical = origin + '/' + url(post);
    document.title = post.title + ' | OrbitWick';
    document.querySelector('link[rel="canonical"]').href = canonical;
    const set = (attribute, name, content) => {
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.append(element); }
      element.content = content;
    };
    set('name', 'description', post.excerpt);
    set('property', 'og:type', 'article');
    set('property', 'og:title', post.title);
    set('property', 'og:description', post.excerpt);
    set('property', 'og:url', canonical);
    set('property', 'og:image', origin + '/' + post.image);
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify([{'@context':'https://schema.org','@type':'BlogPosting',headline:post.title,description:post.excerpt,image:[origin+'/'+post.image],datePublished:post.date+'T09:00:00+06:00',dateModified:(post.updated||post.date)+'T09:00:00+06:00',author:{'@type':'Organization',name:post.author,url:origin+'/about.html'},publisher:{'@type':'Organization',name:'OrbitWick'},mainEntityOfPage:canonical,wordCount:words(post)}, {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Blog',item:origin+'/blog.html'},{'@type':'ListItem',position:2,name:post.title,item:canonical}]}]);
    document.head.append(schema);
  }
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
    root.innerHTML = `<header class="journal-article-header"><div class="container"><nav class="journal-breadcrumb" aria-label="Breadcrumb"><a href="blog.html">Blog</a><span aria-hidden="true"> / </span><span>${esc(post.category)}</span></nav><h1>${esc(post.title)}</h1><div class="journal-byline"><time datetime="${esc(post.date)}">${date(post)}</time><span>${minutes(post)} min read</span></div></div></header>
      <div class="container journal-article-layout"><aside class="journal-sidebar"><nav aria-label="On this page"><p>On this page</p><ol>${toc.map(t => `<li><a href="#${t.id}">${esc(t.title)}</a></li>`).join('')}</ol></nav><a class="journal-service-link" href="${serviceLink(post.service.href)}">Explore ${esc(post.service.name)} ↗</a></aside>
      <article class="journal-article"><figure class="journal-cover-figure"><img class="journal-cover" src="${esc(post.image)}" alt="${esc(post.imageAlt)}" width="1200" height="650" fetchpriority="high"></figure>${post.takeaway ? `<div class="journal-takeaway"><strong>The short answer</strong><p>${esc(post.takeaway)}</p></div>` : ''}${body}
      <section class="journal-sources" aria-label="References"><h2>Sources &amp; further reading</h2><ol>${post.sources.map(source => `<li><a href="${sourceLink(source.url)}">${esc(source.title)}</a></li>`).join('')}</ol></section>
      <div class="journal-share"><button type="button" data-copy-link>Copy article link</button><span role="status" id="copy-status"></span></div></article></div>
      <section class="journal-related"><div class="container"><h2>Useful next reads</h2><div class="journal-related-grid">${related.map(relatedCard).join('')}</div></div></section>`;
    metadata(post);
    document.querySelector('[data-copy-link]').addEventListener('click', async () => {
      const status = document.getElementById('copy-status');
      try { await navigator.clipboard.writeText(window.location.href.split('#')[0]); status.textContent = 'Link copied.'; }
      catch { status.textContent = 'Copy the URL from your address bar.'; }
    });
    if (/^#section-\d+$/.test(location.hash)) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
  }
  function unavailable(title, message, retry) {
    document.title = title + ' | OrbitWick';
    root.innerHTML = `<section class="journal-library"><div class="container"><h1>${esc(title)}</h1><p role="status">${esc(message)}</p>${retry ? '<button class="btn btn-burgundy" data-retry>Try again</button> ' : ''}<a href="blog.html">Browse all articles</a></div></section>`;
    if (retry) root.querySelector('[data-retry]').addEventListener('click', () => location.reload());
    if (!retry) { const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex,follow'; document.head.append(robots); }
  }
  fetch('blog/posts.json').then(response => {
    if (!response.ok) throw new Error('Unable to load articles');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data.posts)) throw new Error('Invalid article data');
    if (root.dataset.journal === 'listing') { listing(data.posts); return; }
    const slug = new URLSearchParams(location.search).get('slug');
    const post = data.posts.find(post => post.slug === slug);
    if (!post) { unavailable('Article not found', 'Choose an article from the blog to continue.', false); return; }
    article(post, data.posts);
  }).catch(() => unavailable('Articles could not be loaded', 'Please check your connection and try again.', true)).finally(() => root.setAttribute('aria-busy', 'false'));
})();
