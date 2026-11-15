(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function wordCount(post) {
    var count = 0;
    (post.content || []).forEach(function (block) {
      if (block.text) count += block.text.split(/\s+/).length;
      if (block.items) {
        block.items.forEach(function (item) {
          count += item.split(/\s+/).length;
        });
      }
    });
    return count;
  }

  function readTime(post) {
    return Math.max(1, Math.round(wordCount(post) / 200)) + ' min read';
  }

  function formatDate(date) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function initNav() {
    var nav = document.querySelector('.site-nav');
    var toggle = nav && nav.querySelector('.nav-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Deliberately minimal: every animated element gets the same short fade-up, once.
  function initAnimations() {
    if (!window.AOS) return;

    // Page headers are visible straight away; only content further down fades in.
    document.querySelectorAll('.hero, .page-hero, .about-hero').forEach(function (header) {
      header.querySelectorAll('[data-aos]').forEach(function (element) {
        element.removeAttribute('data-aos');
        element.removeAttribute('data-aos-delay');
      });
    });

    document.querySelectorAll('[data-aos]').forEach(function (element) {
      element.setAttribute('data-aos', 'fade-up');
      element.removeAttribute('data-aos-duration');
      element.removeAttribute('data-aos-easing');

      var delay = Number(element.getAttribute('data-aos-delay')) || 0;
      if (delay > 150) element.setAttribute('data-aos-delay', '150');
    });

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.AOS.init({
      duration: 450,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      startEvent: 'DOMContentLoaded',
      anchorPlacement: 'top-bottom',
      disable: prefersReducedMotion
    });
  }

  // Portfolio filter on the home page: show only the work of the chosen type.
  function initWorkFilter() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.work-filter'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.work-featured, .work-card'));
    if (!buttons.length || !items.length) return;

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');

        buttons.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
        items.forEach(function (item) {
          item.hidden = filter !== 'all' && item.getAttribute('data-type') !== filter;
        });
      });
    });
  }

  // Duplicate each review row so it can loop without a gap.
  function initReviewSlider() {
    document.querySelectorAll('.review-track').forEach(function (track) {
      if (track.children.length > 1) return;

      var group = track.firstElementChild;
      if (!group) return;

      var duplicate = group.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      track.appendChild(duplicate);
    });
  }

  // Floating button, bottom right, that returns to the top of the page.
  function initToTop() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    document.body.appendChild(button);

    function update() {
      button.classList.toggle('is-visible', window.scrollY > 600);
    }

    button.addEventListener('click', function () {
      var prefersReducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initStatCounters() {
    var overview = document.querySelector('.overview');
    var counters = overview
      ? Array.prototype.slice.call(overview.querySelectorAll('[data-counter-target]'))
      : [];
    if (!counters.length) return;

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    var formatter = new Intl.NumberFormat();
    var animationFrame = null;
    var startedAt = null;
    var duration = 1200;

    function resetCounters() {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      startedAt = null;
      counters.forEach(function (element) {
        var suffix = element.getAttribute('data-counter-suffix') || '';
        var start = Number(element.getAttribute('data-counter-start')) || 0;
        element.textContent = formatter.format(start) + suffix;
      });
    }

    function animateCounters(timestamp) {
      if (startedAt === null) startedAt = timestamp;
      var progress = Math.min((timestamp - startedAt) / duration, 1);
      var easedProgress = 1 - Math.pow(1 - progress, 3);

      counters.forEach(function (element) {
        var target = Number(element.getAttribute('data-counter-target'));
        var start = Number(element.getAttribute('data-counter-start')) || 0;
        var suffix = element.getAttribute('data-counter-suffix') || '';
        element.textContent = formatter.format(Math.round(start + (target - start) * easedProgress)) + suffix;
      });

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animateCounters);
      } else {
        animationFrame = null;
      }
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          resetCounters();
          animationFrame = window.requestAnimationFrame(animateCounters);
        } else {
          resetCounters();
        }
      });
    }, { threshold: 0.25 });

    observer.observe(overview);
  }

  function initHeroCursorCircle() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.hero-cursor-area').forEach(function (area) {
      area.addEventListener('pointermove', function (event) {
        if (event.pointerType === 'touch') return;

        var bounds = area.getBoundingClientRect();
        area.style.setProperty('--cursor-x', (event.clientX - bounds.left) + 'px');
        area.style.setProperty('--cursor-y', (event.clientY - bounds.top) + 'px');
        area.classList.add('is-cursor-active');
      });

      area.addEventListener('pointerleave', function () {
        area.classList.remove('is-cursor-active');
      });
    });
  }

  function initToolsSlider() {
    document.querySelectorAll('.tools-track').forEach(function (track) {
      if (track.children.length > 1) return;

      var group = track.firstElementChild;
      var slider = track.closest('.tools-slider');
      if (!group || !slider) return;

      slider.style.setProperty('--total', group.children.length);
      var duplicate = group.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      track.appendChild(duplicate);
    });
  }

  function initContactForm() {
    var form = document.querySelector('.contact-form');
    var status = document.querySelector('.contact-form-status');
    if (!form || !status) return;

    function displayStatus(type, message) {
      status.className = 'contact-form-status alert alert-' + type;
      status.textContent = message;
      status.hidden = false;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (form.dataset.submitting === 'true') return;

      var submitButton = form.querySelector('[type="submit"]');
      var buttonText = submitButton.textContent;
      var formData = new FormData(form);
      var values = {};
      formData.forEach(function (value, key) {
        values[key] = value;
      });

      form.dataset.submitting = 'true';
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
      displayStatus('info', 'Sending your request...');

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values)
      })
        .then(function (response) {
          return response.json().then(function (result) {
            if (!response.ok || !result.success) {
              displayStatus('danger', result.message || 'We could not send your request. Please try again later.');
              return;
            }
            displayStatus('success', 'Thanks! Your request has been sent. We will be in touch soon.');
            form.reset();
          });
        })
        .catch(function () {
          displayStatus('danger', 'We could not send your request. Please try again or email contact.orbitwick@gmail.com.');
        })
        .then(function () {
          form.dataset.submitting = 'false';
          submitButton.disabled = false;
          submitButton.textContent = buttonText;
          status.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
  }

  function initBlog() {
    var grid = document.getElementById('postGrid');
    var filters = document.getElementById('filters');
    var search = document.getElementById('q');
    if (!grid || !filters || !search) return;

    var posts = [];
    var active = 'All';

    function renderFilters() {
      var categories = ['All'];
      posts.forEach(function (post) {
        if (categories.indexOf(post.category) === -1) categories.push(post.category);
      });
      filters.innerHTML = categories.map(function (category) {
        return '<button type="button" class="' + (category === active ? 'active' : '') +
          '" data-cat="' + escapeHtml(category) + '">' + escapeHtml(category) + '</button>';
      }).join('');
    }

    function render() {
      var query = search.value.trim().toLowerCase();
      var matchingPosts = posts.filter(function (post) {
        var inCategory = active === 'All' || post.category === active;
        var haystack = (post.title + ' ' + post.excerpt + ' ' + (post.tags || []).join(' ')).toLowerCase();
        return inCategory && (!query || haystack.indexOf(query) !== -1);
      });

      if (!matchingPosts.length) {
        grid.innerHTML = '<div class="col-12 text-grey">No articles match your search.</div>';
        return;
      }

      grid.innerHTML = matchingPosts.map(function (post) {
        var thumbnail = post.image
          ? '<img src="' + escapeHtml(post.image) + '" alt="' + escapeHtml(post.title) + '" loading="lazy">'
          : '<i class="bi ' + escapeHtml(post.icon || 'bi-journal-text') + '"></i>';
        return '<div class="col-md-6 col-lg-4"><a class="blog-card" href="blog-post.html?slug=' +
          encodeURIComponent(post.slug) + '"><div class="blog-thumb">' + thumbnail +
          '<span class="blog-cat">' + escapeHtml(post.category) + '</span></div><div class="blog-body">' +
          '<div class="blog-meta">' + formatDate(post.date) + ' &middot; ' + readTime(post) + '</div><h3>' +
          escapeHtml(post.title) + '</h3><p>' + escapeHtml(post.excerpt) + '</p>' +
          '<span class="service-more">Read article <i class="bi bi-arrow-right"></i></span></div></a></div>';
      }).join('');
    }

    filters.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-cat]');
      if (!button) return;
      active = button.getAttribute('data-cat');
      renderFilters();
      render();
    });
    search.addEventListener('input', render);

    fetch('data/posts.json')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        posts = (data.posts || []).slice().sort(function (a, b) {
          return b.date.localeCompare(a.date);
        });
        renderFilters();
        render();
      })
      .catch(function () {
        grid.innerHTML = '<div class="col-12 text-grey">Articles could not be loaded. If you are previewing locally, serve the site over HTTP (for example, run <code>python3 -m http.server</code> in this folder).</div>';
      });
  }

  function initBlogPost() {
    var titleElement = document.getElementById('postTitle');
    var postBody = document.getElementById('postBody');
    if (!titleElement || !postBody) return;

    var siteUrl = 'https://www.orbitwick.com';
    var slug = new URLSearchParams(window.location.search).get('slug');

    function setMeta(selector, attribute, value) {
      var element = document.querySelector(selector);
      if (element) element.setAttribute(attribute, value);
    }

    function hidePostFigure() {
      var figure = document.querySelector('.post-figure-wrap');
      if (figure) figure.hidden = true;
    }

    function notFound() {
      document.title = 'Article not found | OrbitWick';
      titleElement.textContent = 'Article not found';
      document.getElementById('postCat').textContent = 'Blog';
      document.getElementById('crumb').textContent = 'Not found';
      postBody.innerHTML = '<p>We could not find that article. <a href="blog.html">Browse all articles</a>.</p>';
    }

    function renderBlock(block) {
      if (block.type === 'h2') return '<h2>' + escapeHtml(block.text) + '</h2>';
      if (block.type === 'h3') return '<h3>' + escapeHtml(block.text) + '</h3>';
      if (block.type === 'ul') return '<ul>' + block.items.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>';
      if (block.type === 'ol') return '<ol>' + block.items.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ol>';
      if (block.type === 'quote') return '<blockquote>' + escapeHtml(block.text) + '</blockquote>';
      return '<p>' + escapeHtml(block.text) + '</p>';
    }

    function articleCard(post) {
      var thumbnail = post.image
        ? '<img src="' + escapeHtml(post.image) + '" alt="' + escapeHtml(post.title) + '" loading="lazy" width="1600" height="840">'
        : '<i class="bi bi-journal-text"></i>';
      return '<div class="col-md-6 col-lg-4"><a class="blog-card" href="blog-post.html?slug=' +
        encodeURIComponent(post.slug) + '"><div class="blog-thumb">' + thumbnail +
        '<span class="blog-cat">' + escapeHtml(post.category) + '</span></div><div class="blog-body">' +
        '<div class="blog-meta">' + formatDate(post.date) + ' &middot; ' + readTime(post) + '</div><h3>' +
        escapeHtml(post.title) + '</h3><p>' + escapeHtml(post.excerpt) + '</p>' +
        '<span class="service-more">Read article <i class="bi bi-arrow-right"></i></span></div></a></div>';
    }

    function render(post, allPosts) {
      var url = siteUrl + '/blog-post.html?slug=' + encodeURIComponent(post.slug);
      var pageTitle = post.title + ' | OrbitWick';
      var imageUrl = post.image ? siteUrl + '/' + post.image : '';

      document.title = pageTitle;
      setMeta('meta[name="description"]', 'content', post.excerpt);
      setMeta('link[rel="canonical"]', 'href', url);
      setMeta('meta[property="og:title"]', 'content', pageTitle);
      setMeta('meta[property="og:description"]', 'content', post.excerpt);
      setMeta('meta[property="og:image"]', 'content', imageUrl);

      var structuredData = document.createElement('script');
      structuredData.type = 'application/ld+json';
      var schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        dateModified: post.updated || post.date,
        author: { '@type': 'Organization', name: post.author || 'OrbitWick Team' },
        publisher: {
          '@type': 'Organization',
          name: 'OrbitWick',
          logo: { '@type': 'ImageObject', url: siteUrl + '/img/logo-white.png' }
        },
        mainEntityOfPage: url,
        keywords: (post.tags || []).join(', ')
      };
      if (imageUrl) schema.image = imageUrl;
      structuredData.textContent = JSON.stringify(schema);
      document.head.appendChild(structuredData);

      document.getElementById('crumb').textContent = post.title;
      document.getElementById('postCat').textContent = post.category;
      titleElement.textContent = post.title;
      document.getElementById('postMeta').innerHTML =
        '<span><i class="bi bi-person"></i> ' + escapeHtml(post.author || 'OrbitWick Team') + '</span>' +
        '<span><i class="bi bi-calendar3"></i> ' + formatDate(post.date) + '</span>' +
        '<span><i class="bi bi-clock"></i> ' + readTime(post) + '</span>';

      if (post.image) {
        var image = document.getElementById('postImg');
        image.src = post.image;
        image.alt = post.title;
        document.getElementById('postFigure').hidden = false;
      } else {
        hidePostFigure();
      }

      postBody.innerHTML = '<p class="post-lead">' + escapeHtml(post.excerpt) + '</p>' +
        (post.content || []).map(renderBlock).join('');
      document.getElementById('postTags').innerHTML = (post.tags || []).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');

      if (post.service) {
        var service = document.getElementById('postService');
        service.innerHTML = '<i class="bi bi-compass"></i> This article is part of our <a href="' +
          escapeHtml(post.service.href) + '">' + escapeHtml(post.service.name) + '</a> service.';
        service.hidden = false;
      }

      var encodedUrl = encodeURIComponent(window.location.href);
      var encodedTitle = encodeURIComponent(post.title);
      document.getElementById('shWa').href = 'https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl;
      document.getElementById('shFb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
      document.getElementById('shLi').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl;
      document.getElementById('postShare').hidden = false;
      document.getElementById('shCopy').addEventListener('click', function () {
        var label = this.querySelector('span');
        var copied = function () {
          label.textContent = 'Copied';
          window.setTimeout(function () { label.textContent = 'Copy link'; }, 1800);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).then(copied);
      });

      var relatedPosts = allPosts.filter(function (item) { return item.slug !== post.slug; })
        .sort(function (a, b) {
          return (b.category === post.category) - (a.category === post.category) || b.date.localeCompare(a.date);
        })
        .slice(0, 3);
      if (relatedPosts.length) {
        document.getElementById('related').innerHTML = relatedPosts.map(articleCard).join('');
        document.getElementById('relatedSection').hidden = false;
      }
    }

    fetch('data/posts.json')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var allPosts = data.posts || [];
        var post = allPosts.filter(function (item) { return item.slug === slug; })[0];
        if (!post) {
          hidePostFigure();
          notFound();
          return;
        }
        render(post, allPosts);
      })
      .catch(function () {
        hidePostFigure();
        titleElement.textContent = 'Article could not be loaded';
        postBody.innerHTML = '<p>If you are previewing locally, serve the site over HTTP (for example, run <code>python3 -m http.server</code> in this folder). <a href="blog.html">Back to the blog</a>.</p>';
      });
  }

  initNav();
  initAnimations();
  initStatCounters();
  initHeroCursorCircle();
  initToolsSlider();
  initWorkFilter();
  initReviewSlider();
  initToTop();
  initContactForm();
  initBlog();
  initBlogPost();
})();

// Disable Right Click
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});

// Disable Common Developer Tools Shortcuts
document.addEventListener("keydown", function (e) {

    const key = e.key.toLowerCase();

    // F12
    if (e.key === "F12") {
        e.preventDefault();
        return;
    }

    // Ctrl + Shift + I / J / C
    if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        return;
    }

    // Ctrl + U (View Page Source)
    if (e.ctrlKey && key === "u") {
        e.preventDefault();
        return;
    }

    // Mac: Cmd + Option + I / J / C
    if (e.metaKey && e.altKey && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        return;
    }

});
