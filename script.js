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

    // Portfolio dropdown: hover opens it on desktop, the arrow button works everywhere.
    nav.querySelectorAll('.nav-has-menu').forEach(function (item) {
      var button = item.querySelector('.nav-sub-toggle');
      function setOpen(open) {
        item.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
      }
      button.addEventListener('click', function () { setOpen(!item.classList.contains('is-open')); });
      item.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && item.classList.contains('is-open')) { setOpen(false); button.focus(); }
      });
      item.addEventListener('focusout', function (event) {
        if (event.relatedTarget && !item.contains(event.relatedTarget)) setOpen(false);
      });
      document.addEventListener('click', function (event) {
        if (!item.contains(event.target)) setOpen(false);
      });
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

  initNav();
  initAnimations();
  initStatCounters();
  initHeroCursorCircle();
  initToolsSlider();
  initWorkFilter();
  initReviewSlider();
  initToTop();
  initContactForm();
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
