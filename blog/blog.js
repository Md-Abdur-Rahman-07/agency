(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = post => '/blog/' + encodeURIComponent(post.slug);
  const words = post => post.content.reduce((n, block) => n + (block.text || (block.items || []).join(' ')).split(/\s+/).length, 0);
  const minutes = post => Math.max(1, Math.ceil(words(post) / 200));
  const date = post => new Date(post.date + 'T00:00:00+06:00').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Dhaka'});
  const serviceLink = value => /^\/(?:services(?:\/[\w-]+)?|about)?(?:#[\w-]+)?$/.test(value) ? esc(value) : '#';
  const sourceLink = value => /^https:\/\//.test(value) ? esc(value) : '#';
  function card(post) {
    return `<article class="journal-card" data-category="${esc(post.category)}" data-search="${esc((post.title+' '+post.excerpt+' '+(post.tags || []).join(' ')).toLowerCase())}">
      <figure class="journal-card-figure"><a class="journal-card-image" href="${url(post)}" tabindex="-1" aria-hidden="true"><img src="${esc(post.image)}" alt="" width="800" height="520" loading="lazy"></a></figure>
      <div class="journal-card-copy"><span class="journal-category">${esc(post.category)}</span><p class="journal-meta"><time datetime="${esc(post.date)}">${date(post)}</time> · ${minutes(post)} min read</p><h2><a href="${url(post)}" title="${esc(post.title)}">${esc(post.title)}</a></h2><p>${esc(post.excerpt)}</p><a class="journal-read" href="${url(post)}" aria-label="Read ${esc(post.title)}">Read guide <span aria-hidden="true">↗</span></a></div></article>`;
  }
  function relatedCard(post) {
    return `<a class="journal-related-card" href="${url(post)}"><img src="${esc(post.image)}" alt="" width="800" height="520" loading="lazy"><span class="journal-related-copy"><span class="journal-category">${esc(post.category)}</span><strong>${esc(post.title)}</strong><span class="journal-related-meta"><time datetime="${esc(post.date)}">${date(post)}</time> · ${minutes(post)} min read</span></span></a>`;
  }
  // The page builder (Node) reuses the templates above.
  if (typeof module !== 'undefined' && module.exports) { module.exports = {esc, url, words, minutes, date, serviceLink, sourceLink, card, relatedCard}; return; }
  const root = document.querySelector('[data-journal]');
  if (!root) return;
  if (root.dataset.journal === 'article') {
    const copy = document.querySelector('[data-copy-link]');
    if (copy) copy.addEventListener('click', async () => {
      const status = document.getElementById('copy-status');
      try { await navigator.clipboard.writeText(location.href.split('#')[0]); status.textContent = 'Link copied.'; }
      catch { status.textContent = 'Copy the URL from your address bar.'; }
    });
    return;
  }
  if (root.dataset.journal === 'redirect') {
    const slug = new URLSearchParams(location.search).get('slug') || '';
    location.replace(/^[\w-]+$/.test(slug) ? '/blog/' + slug : '/blog');
    return;
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
  fetch('blog/posts.json').then(response => {
    if (!response.ok) throw new Error('Unable to load articles');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data.posts)) throw new Error('Invalid article data');
    listing(data.posts);
  }).catch(() => { document.getElementById('journal-count').textContent = ''; }).finally(() => root.setAttribute('aria-busy', 'false'));
})();
