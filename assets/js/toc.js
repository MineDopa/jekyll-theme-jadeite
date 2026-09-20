/*!
 * toc.js — builds the sidebar table of contents and keeps it in sync with the
 * scroll position.
 *
 * Source of truth : every h1/h2/h3 inside `.content`
 * Output          : `ul.toc-list > li.tag-h1|tag-h2|tag-h3 > a[href="#id"]`
 *                   inside `<nav id="toc">`
 * Side effects    : adds `body.no-toc` when the page has no headings, so CSS can
 *                   hide the (now useless) sidebar and the hamburger button.
 *
 * No dependencies. Loads at the end of <body>, so the DOM above it is ready.
 */
(function () {
  'use strict';

  var CONTENT_SELECTOR = '.content';
  var HEADING_SELECTOR = 'h1, h2, h3';
  var SKIP_SELECTOR = 'pre, .no-toc, [data-toc="false"]';
  var NAV_ID = 'toc';
  var LIST_CLASS = 'toc-list';
  var ACTIVE_CLASS = 'active';
  var NO_TOC_CLASS = 'no-toc';

  // Must stay in sync with --anchor-offset in _sass/_layout.scss.
  var DEFAULT_ANCHOR_OFFSET = 80;

  /* ------------------------------------------------------------------ utils */

  function anchorOffset() {
    var raw = '';
    try {
      raw = getComputedStyle(document.documentElement).getPropertyValue('--anchor-offset');
    } catch (e) {
      raw = '';
    }
    var value = parseInt(raw, 10);
    return isNaN(value) ? DEFAULT_ANCHOR_OFFSET : value;
  }

  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  // Distance between the top of the element and the top of the viewport.
  // Negative means the element has already scrolled past the top edge — which
  // is exactly what the scroll spy needs, so no page offset is added here.
  function viewportTop(el) {
    return el.getBoundingClientRect().top;
  }

  function slugify(text) {
    var slug = String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[\s\u3000]+/g, '-')                        // spaces -> dashes
      .replace(/[^\w\u3400-\u4dbf\u4e00-\u9fff-]+/g, '')  // drop punctuation, keep CJK
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'section';
  }

  function uniqueId(base, used) {
    var id = base;
    var n = 1;
    while (used[id] || document.getElementById(id)) {
      n += 1;
      id = base + '-' + n;
    }
    used[id] = true;
    return id;
  }

  /* -------------------------------------------------------------- collect */

  function collect(content) {
    var nodes = content.querySelectorAll(HEADING_SELECTOR);
    var used = {};
    var items = [];

    for (var i = 0; i < nodes.length; i++) {
      var heading = nodes[i];
      if (heading.closest && heading.closest(SKIP_SELECTOR)) continue;

      var id = heading.id;
      if (id) {
        used[id] = true;
      } else {
        id = uniqueId(slugify(heading.textContent), used);
        heading.id = id;
      }

      items.push({
        el: heading,
        id: id,
        level: heading.tagName.toLowerCase(),
        text: (heading.textContent || '').trim()
      });
    }

    return items;
  }

  /* --------------------------------------------------------------- render */

  function render(nav, items) {
    var list = document.createElement('ul');
    list.className = LIST_CLASS;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      var li = document.createElement('li');
      li.className = 'tag-' + item.level;

      var link = document.createElement('a');
      link.href = '#' + item.id;
      link.textContent = item.text;

      li.appendChild(link);
      list.appendChild(li);
    }

    nav.innerHTML = '';
    nav.appendChild(list);
  }

  /* ----------------------------------------------------------- scroll spy */

  function initScrollSpy(items) {
    var current = -1;
    var offset = anchorOffset();
    var ticking = false;

    function update() {
      if (!items.length) return;

      // Headings are in document order, so the first one still below the offset
      // line ends the search.
      var reached = 0;
      for (var i = 0; i < items.length; i++) {
        if (viewportTop(items[i].el) - offset <= 0) {
          reached = i;
        } else {
          break;
        }
      }

      // At the very bottom of the page the last heading should win, otherwise a
      // short final section can never become active. Only applies to pages that
      // are actually scrollable — a page that fits in one screen stays on the
      // first entry.
      var scrollable = document.documentElement.scrollHeight > window.innerHeight + 1;
      var atBottom =
        scrollable &&
        window.innerHeight + scrollTop() >= document.documentElement.scrollHeight - 2;
      if (atBottom) reached = items.length - 1;

      if (reached === current) return;
      if (current > -1 && items[current].li) {
        items[current].li.classList.remove(ACTIVE_CLASS);
      }
      current = reached;
      if (items[current].li) items[current].li.classList.add(ACTIVE_CLASS);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      var run = function () {
        ticking = false;
        update();
      };
      if (window.requestAnimationFrame) window.requestAnimationFrame(run);
      else window.setTimeout(run, 16);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);

    update();
  }

  function paintList(nav, items) {
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < items.length; i++) {
      var li = links[i] && links[i].parentNode;
      if (li && li.tagName === 'LI') items[i].li = li;
    }
  }

  /* ----------------------------------------------------------------- init */

  var done = false;

  function init() {
    if (done) return;

    var content = document.querySelector(CONTENT_SELECTOR);
    var nav = document.getElementById(NAV_ID);
    if (!content || !nav) return;

    done = true;

    var items = collect(content);
    if (!items.length) {
      document.body.classList.add(NO_TOC_CLASS);
      return;
    }

    document.body.classList.remove(NO_TOC_CLASS);
    render(nav, items);
    paintList(nav, items);
    initScrollSpy(items);
  }

  init();
  document.addEventListener('DOMContentLoaded', init);
})();
