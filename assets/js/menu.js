/*!
 * menu.js — header interactions that need a little JavaScript.
 *
 * 1. `#menu-toggle` (hamburger in the header) toggles `body.menu-open`, which
 *    slides the sidebar in from the right on small screens. The panel also
 *    closes on: backdrop click, Escape, any in-page anchor inside the sidebar,
 *    and when the viewport grows back to the desktop layout.
 *
 * 2. `#lang-switch` is a native <details> element, so the browser already
 *    handles open / close / keyboard. All that is added here is closing it when
 *    the visitor clicks elsewhere or presses Escape.
 *
 * Both parts degrade silently if their markup is absent.
 *
 * No dependencies. Loads at the end of <body>.
 */
(function () {
  'use strict';

  var OPEN_CLASS = 'menu-open';
  var TOGGLE_ID = 'menu-toggle';
  var SIDEBAR_ID = 'sidebar';
  var LANG_ID = 'lang-switch';
  var LINK_SELECTOR = 'a[href^="#"]';

  var DESKTOP_QUERY = '(min-width: 769px)';

  function isEscape(event) {
    var key = event.key || '';
    return key === 'Escape' || key === 'Esc' || event.keyCode === 27;
  }

  /* ------------------------------------------------------ language dropdown */

  var langDone = false;

  function initLangSwitch() {
    if (langDone) return;

    var langSwitch = document.getElementById(LANG_ID);
    if (!langSwitch || typeof langSwitch.open === 'undefined') return;

    langDone = true;

    function close() {
      if (langSwitch.open) langSwitch.open = false;
    }

    document.addEventListener('click', function (event) {
      if (!langSwitch.open) return;

      var target = event.target;

      // An entry inside the menu: follow the link, then tidy up.
      if (target && target.closest && target.closest('.lang-menu')) {
        close();
        return;
      }

      // The <summary> itself: the browser is about to toggle it. Interfering
      // here would close and immediately reopen the panel.
      if (target && langSwitch.contains(target)) return;

      close();
    });

    document.addEventListener('keydown', function (event) {
      if (isEscape(event)) close();
    });
  }

  /* --------------------------------------------------------- sidebar panel */

  var done = false;

  function init() {
    if (done) return;

    var toggle = document.getElementById(TOGGLE_ID);
    var sidebar = document.getElementById(SIDEBAR_ID);
    if (!toggle || !sidebar) return;

    done = true;

    var backdrop = document.querySelector('.menu-backdrop');
    var body = document.body;

    function isOpen() {
      return body.classList.contains(OPEN_CLASS);
    }

    // The button carries its own labels so the language switch stays honest:
    //   data-label       closed state   (zh: 目录 / en: Table of contents)
    //   data-label-open  open state     (zh: 关闭目录 / en: Close table of contents)
    var closedLabel = toggle.getAttribute('data-label') || 'Table of contents';
    var openLabel = toggle.getAttribute('data-label-open') || 'Close table of contents';

    function setOpen(open) {
      body.classList.toggle(OPEN_CLASS, open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? openLabel : closedLabel);
    }

    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      setOpen(!isOpen());
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        setOpen(false);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (isEscape(event)) setOpen(false);
    });

    // Tapping a TOC entry jumps to the heading — the panel should get out of the way.
    sidebar.addEventListener('click', function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest(LINK_SELECTOR) : null;
      if (link) setOpen(false);
    });

    // Rotating a phone or resizing a window back to desktop must not leave the
    // sticky sidebar stuck in its off-canvas state.
    var desktop = window.matchMedia ? window.matchMedia(DESKTOP_QUERY) : null;
    if (desktop) {
      var onChange = function (event) {
        if (event.matches && isOpen()) setOpen(false);
      };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }

    setOpen(false);
  }

  initLangSwitch();
  init();
  document.addEventListener('DOMContentLoaded', function () {
    initLangSwitch();
    init();
  });
})();
