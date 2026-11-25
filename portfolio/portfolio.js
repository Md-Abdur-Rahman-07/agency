(function () {
  'use strict';
  var grid = document.getElementById('project-grid');
  if (!grid) return;
  // Asset paths in the JSON are relative to the site root, one level above this script.
  var siteRoot = new URL('../', document.currentScript.src).href;
  var status = document.getElementById('project-status');
  var dialog = document.getElementById('project-dialog');
  var content = document.getElementById('project-dialog-content');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function text(value) { return value == null ? '' : String(value).trim(); }
  function node(tag, className, value) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (value) el.textContent = value;
    return el;
  }
  function url(value) {
    if (!text(value)) return '';
    try {
      var parsed = new URL(value, siteRoot);
      return /^https?:$/.test(parsed.protocol) ? parsed.href : '';
    } catch (_) { return ''; }
  }
  function link(value, label) {
    var href = url(value);
    if (!href) return null;
    var a = node('a', 'project-action', label);
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }
  function facts(project, compact) {
    var entries = compact ? [['Timeline', project.timeline], ['Cost', project.cost], ['Client', project.client]] :
      [['Timeline', project.timeline], ['Cost', project.cost], ['Client', project.client], ['Year', project.year], ['Role', project.role]];
    if (!compact && Array.isArray(project.details)) {
      project.details.forEach(function (item) { if (item && text(item.label)) entries.push([item.label, item.value]); });
    }
    entries = entries.filter(function (entry) { return text(entry[1]); });
    if (!entries.length) return null;
    var dl = node('dl', compact ? 'project-card-facts' : 'project-full-facts');
    entries.forEach(function (entry) {
      var row = node('div');
      row.append(node('dt', '', entry[0]), node('dd', '', text(entry[1]))); dl.append(row);
    });
    return dl;
  }
  function background(project) {
    var bg = project.background || {}, src = url(bg.url);
    if (!src) return null;
    var media;
    if (bg.type === 'video') {
      media = node('video', 'project-card-media');
      media.muted = true; media.loop = true; media.playsInline = true;
      media.preload = 'none';
      if (url(bg.poster)) media.poster = url(bg.poster);
      media.setAttribute('aria-hidden', 'true');
      media.tabIndex = -1;
    } else {
      media = node('img', 'project-card-media'); media.alt = text(bg.alt); media.loading = 'lazy';
    }
    media.src = src;
    return media;
  }
  function demo(value) {
    var src = url(value);
    if (!src) return null;
    var parsed = new URL(src), id, embed;
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(parsed.hostname)) {
      id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
      if (/^[\w-]{11}$/.test(id || '')) embed = 'https://www.youtube-nocookie.com/embed/' + id;
    } else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(parsed.hostname)) {
      id = parsed.pathname.split('/').pop();
      if (/^\d+$/.test(id)) embed = 'https://player.vimeo.com/video/' + id;
    }
    if (embed) {
      var frame = node('iframe', 'project-demo');
      frame.src = embed; frame.title = 'Project video demo'; frame.allowFullscreen = true;
      frame.allow = 'fullscreen; picture-in-picture'; return frame;
    }
    var video = node('video', 'project-demo');
    video.src = src; video.controls = true; video.playsInline = true; video.preload = 'metadata';
    return video;
  }
  function open(project) {
    content.replaceChildren();
    if (text(project.label)) content.append(node('p', 'project-dialog-label', project.label));
    var title = node('h2', '', project.title); title.id = 'project-dialog-title'; content.append(title);
    if (project.isDemo) content.append(node('p', 'project-sample-note', 'Demo case study · Client, cost and delivery details are sample information.'));
    if (project.background && project.background.display === 'screenshot' && url(project.background.url)) {
      var shot = node('img', 'project-shot'); shot.src = url(project.background.url); shot.alt = text(project.background.alt); content.append(shot);
    }
    var video = demo(project.demoUrl);
    if (video) {
      var figure = node('figure', 'project-demo-figure');
      figure.append(video);
      if (text(project.demoCaption)) figure.append(node('figcaption', '', project.demoCaption));
      content.append(figure);
    }
    var description = text(project.description) || text(project.summary);
    if (description) content.append(node('p', 'project-description', description));
    var details = facts(project, false); if (details) content.append(details);
    var technologies = Array.isArray(project.technologies) ? project.technologies.filter(text) : [];
    if (technologies.length) {
      var tags = node('div', 'project-tech');
      tags.setAttribute('aria-label', 'Technologies');
      technologies.forEach(function (item) { tags.append(node('span', '', item)); }); content.append(tags);
    }
    var live = link(project.liveUrl, text(project.liveLabel) || (project.isDemo ? 'Sample live site ↗' : 'Visit live project ↗')); if (live) content.append(live);
    document.querySelectorAll('.portfolio-project video').forEach(function (v) { v.pause(); });
    dialog.showModal(); document.body.classList.add('project-dialog-open');
  }
  function card(project, prefix) {
    var article = node('article', 'portfolio-project');
    article.id = (prefix || 'project') + '-' + project.id;
    var media = background(project); if (media) article.append(media);
    if (media && project.background.display === 'screenshot') article.classList.add('is-screenshot');
    var body = node('div', 'project-card-body');
    if (text(project.label)) body.append(node('p', 'project-card-label', project.label));
    body.append(node('h3', '', project.title));
    if (text(project.summary)) body.append(node('p', 'project-card-summary', project.summary));
    var details = facts(project, true); if (details) body.append(details);
    var actions = node('div', 'project-card-actions');
    var button = node('button', 'project-action', 'View details ↗'); button.type = 'button';
    button.setAttribute('aria-label', 'View details: ' + project.title);
    button.addEventListener('click', function () { open(project); }); actions.append(button);
    var live = link(project.liveUrl, text(project.liveLabel) || (project.isDemo ? 'Sample live site ↗' : 'Live site ↗')); if (live) { live.setAttribute('aria-label', live.textContent + ' ' + project.title); actions.append(live); }
    body.append(actions); article.append(body);
    if (media && media.tagName === 'VIDEO') {
      var toggle = node('button', 'project-video-toggle', 'Play background'); toggle.type = 'button';
      toggle.addEventListener('click', function () {
        if (media.paused) media.play().catch(function () { toggle.textContent = 'Video unavailable'; });
        else media.pause();
      });
      media.addEventListener('play', function () { toggle.textContent = 'Pause background'; });
      media.addEventListener('pause', function () { toggle.textContent = 'Play background'; });
      article.append(toggle);
      if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        observer.observe(media);
      }
    }
    return article;
  }
  var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !reducedMotion.matches && !dialog.open) entry.target.play().catch(function () {});
      else entry.target.pause();
    });
  }, { threshold: 0.3 }) : null;
  dialog.querySelector('.project-dialog-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () { content.replaceChildren(); document.body.classList.remove('project-dialog-open'); });
  function loadProjects(target, source, prefix, message) {
    fetch(siteRoot + 'portfolio/data/' + source + '.json').then(function (response) {
      if (!response.ok) throw new Error('Could not load projects'); return response.json();
    }).then(function (data) {
      if (!Array.isArray(data.projects)) throw new Error('Invalid project data');
      var projects = data.projects.filter(function (p) { return p && text(p.title); })
        .sort(function (a, b) { return Number(a.id) - Number(b.id); });
      projects.forEach(function (p) { target.append(card(p, prefix)); });
      if (projects.length < 2) {
        var soon = node('div', 'category-soon');
        soon.append(node('strong', '', 'More projects coming soon.'), node('span', '', 'New work is added here as it is ready to share.'));
        target.append(soon);
      }
      message.hidden = true;
    }).catch(function () {
      message.hidden = false;
      message.textContent = 'Projects could not be loaded. Please refresh to try again.';
    }).finally(function () { target.setAttribute('aria-busy', 'false'); });
  }
  loadProjects(grid, grid.dataset.source, 'project', status);
  // Extra project sections on the same page, such as website revamps.
  document.querySelectorAll('[data-project-source]').forEach(function (target) {
    var message = node('p'); message.setAttribute('role', 'status'); message.hidden = true;
    target.after(message);
    loadProjects(target, target.dataset.projectSource, target.dataset.prefix, message);
  });

  // Optional template section (website development page).
  var templateGrid = document.getElementById('template-grid');
  function template(item) {
    var article = node('article', 'template-card');
    var src = url(item.image), preview;
    if (src) {
      preview = node('img', 'template-preview'); preview.src = src; preview.alt = ''; preview.loading = 'lazy';
    } else {
      var layout = ['split', 'grid', 'masonry', 'center', 'list'].includes(item.layout) ? item.layout : 'split';
      preview = node('div', 'template-preview template-wire template-' + layout);
      preview.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 7; i++) preview.append(node('span'));
    }
    var body = node('div', 'template-body');
    if (text(item.type)) body.append(node('p', 'template-type', item.type));
    body.append(node('h3', '', item.title));
    if (text(item.description)) body.append(node('p', 'template-text', item.description));
    var actions = node('div', 'template-actions');
    var use = node('a', '', 'Use this template'); use.href = siteRoot + '#contact';
    use.setAttribute('aria-label', 'Use this template: ' + item.title); actions.append(use);
    if (url(item.previewUrl)) {
      var live = node('a', '', 'Preview \u2197'); live.href = url(item.previewUrl); live.target = '_blank'; live.rel = 'noopener noreferrer'; actions.append(live);
    }
    body.append(actions); article.append(preview, body);
    return article;
  }
  if (templateGrid) {
    fetch(siteRoot + 'portfolio/data/' + templateGrid.dataset.source + '.json').then(function (response) {
      if (!response.ok) throw new Error('Could not load templates'); return response.json();
    }).then(function (data) {
      var items = (data.templates || []).filter(function (t) { return t && text(t.title); })
        .sort(function (a, b) { return Number(a.id) - Number(b.id); });
      items.forEach(function (t) { templateGrid.append(template(t)); });
      document.getElementById('templates').hidden = !items.length;
    }).catch(function () { /* The section stays hidden when templates cannot be loaded. */ });
  }
})();
