/* Mayqueen — Demo 04 · Đêm Ngọc. Shared by demo-5 unchanged: everything hangs off data-* hooks. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: solid on scroll, mobile menu ---------- */
  function header() {
    var el = document.querySelector('[data-header]');
    if (!el) return;
    var btn = el.querySelector('[data-nav-toggle]');
    function onScroll() { el.classList.toggle('is-solid', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // desktop: hovering the product trigger opens its <details> after a short delay (a passing cursor
    // doesn't flash it open); click/keyboard still toggle natively
    var hoverNav = window.matchMedia('(hover: hover) and (min-width: 1024px)');
    el.querySelectorAll('.product-menu details').forEach(function (d) {
      var timer;
      d.parentNode.addEventListener('mouseenter', function () {
        if (hoverNav.matches) timer = setTimeout(function () { d.open = true; }, 150);
      });
      d.parentNode.addEventListener('mouseleave', function () {
        clearTimeout(timer);
        if (hoverNav.matches) d.open = false;
      });
    });
    if (!btn) return;
    function setOpen(open) {
      el.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    }
    btn.addEventListener('click', function () { setOpen(!el.classList.contains('nav-open')); });
    el.querySelectorAll('#site-nav a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* ---------- Hero: TVC alternates with the before/after slide once a source is set ---------- */
  function heroVideo() {
    var hero = document.querySelector('[data-hero]');
    var video = document.querySelector('[data-hero-video]');
    if (!hero || !video) return;
    var source = video.querySelector('source[src]');
    if (!source || !source.getAttribute('src').trim()) return;
    var ba = hero.querySelector('[data-ba]');
    var ctrl = hero.querySelector('[data-hero-ctrl]');
    hero.classList.add('has-video');
    video.load();
    rotate(hero, video, ba);
    if (!ctrl) return;
    ctrl.hidden = false;
    var mute = ctrl.querySelector('[data-video-mute]');
    var play = ctrl.querySelector('[data-video-play]');
    if (mute) mute.addEventListener('click', function () {
      video.muted = !video.muted;
      mute.setAttribute('aria-pressed', String(video.muted));
    });
    if (play) play.addEventListener('click', function () {
      if (video.paused) video.play(); else video.pause();
    });
    video.addEventListener('play', function () { if (play) play.setAttribute('aria-pressed', 'true'); });
    video.addEventListener('pause', function () { if (play) play.setAttribute('aria-pressed', 'false'); });
  }

  /* Like kobler's hero (measured): the TVC plays through, fades to the before/after slide,
     which holds 5.7s, then the TVC replays from 0. Held while someone drags or focuses the slide. */
  function rotate(hero, video, ba) {
    // no rotation: stay on the slide that carries the hero text, video still
    if (reduce || !ba) {
      video.removeAttribute('autoplay');
      video.pause();
      hero.classList.add('show-ba');
      return;
    }
    var content = hero.querySelector('.hero__content');
    var held = false;
    ba.addEventListener('pointerdown', function () { held = true; });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      ba.addEventListener(t, function () { held = false; });
    });
    function busy() {
      var a = document.activeElement;
      return held || ba.contains(a) || (content && content.contains(a));
    }
    function back() {
      if (busy()) { setTimeout(back, 1000); return; }
      hero.classList.remove('show-ba');
      video.currentTime = 0;
      video.play();
    }
    video.addEventListener('ended', function () {
      hero.classList.add('show-ba');
      setTimeout(back, 5700);
    });
  }

  /* ---------- Before/after slider ---------- */
  function beforeAfter() {
    var ba = document.querySelector('[data-ba]');
    if (!ba) return;
    var knob = ba.querySelector('[data-ba-knob]');
    var dragging = false;
    function set(pos) {
      pos = Math.round(Math.max(0, Math.min(100, pos)));
      ba.style.setProperty('--pos', pos + '%');
      if (knob) knob.setAttribute('aria-valuenow', String(pos));
    }
    function fromX(x) {
      var r = ba.getBoundingClientRect();
      set((x - r.left) / r.width * 100);
    }
    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      // touch waits for the first move: a vertical swipe gets pointercancel instead and must not jump the divider
      if (e.pointerType !== 'touch') fromX(e.clientX);
    });
    ba.addEventListener('pointermove', function (e) { if (dragging) fromX(e.clientX); });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      ba.addEventListener(t, function () { dragging = false; });
    });
    if (!knob) return;
    knob.addEventListener('keydown', function (e) {
      var now = parseInt(knob.getAttribute('aria-valuenow'), 10) || 0;
      var next = { ArrowLeft: now - 5, ArrowRight: now + 5, Home: 0, End: 100 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      set(next);
    });
  }

  /* ---------- Tabs (same pattern as demo-1) ---------- */
  function tabs() {
    document.querySelectorAll('[data-tabs] [role="tablist"]').forEach(function (list) {
      var all = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      function select(tab) {
        all.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        });
      }
      list.addEventListener('click', function (e) {
        var t = e.target.closest('[role="tab"]');
        if (t) select(t);
      });
      list.addEventListener('keydown', function (e) {
        var i = all.indexOf(document.activeElement);
        if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
        var next = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
        select(next);
        next.focus();
      });
    });
  }

  /* ---------- Carousels: infinite loop + autoplay like kobler (Swiper loop, 3.5s) ----------
     Native scroll-snap track. The item set is cloned before and after the real one;
     once a scroll settles inside a clone set, jump one set width back to the twin real item. */
  function carousels() {
    document.querySelectorAll('[data-carousel]').forEach(function (c) {
      var track = c.querySelector('.carousel__track');
      if (!track) return;
      var items = Array.prototype.slice.call(track.querySelectorAll('.carousel__item'));
      var n = items.length;
      if (n < 2) return;
      var prev = c.querySelector('[data-prev]');
      var next = c.querySelector('[data-next]');
      var dotsBox = c.querySelector('[data-dots]');
      // 'auto' would defer to the track's CSS scroll-behavior: smooth
      var behavior = reduce ? 'instant' : 'smooth';
      var dots = [];
      var held = false;
      var timer, settle;

      function clone(el) {
        var k = el.cloneNode(true);
        k.setAttribute('aria-hidden', 'true');
        k.inert = true;
        return k;
      }
      items.forEach(function (el) { track.appendChild(clone(el)); });
      items.slice().reverse().forEach(function (el) { track.insertBefore(clone(el), track.firstChild); });

      function step() { return items[1].offsetLeft - items[0].offsetLeft; }
      function index() { return ((Math.round(track.scrollLeft / step()) - n) % n + n) % n; }
      function jump(left) { track.scrollTo({ left: left, behavior: 'instant' }); }
      function go(i) { track.scrollTo({ left: (n + i) * step(), behavior: behavior }); }
      function home() {
        var w = n * step();
        if (track.scrollLeft < w - 2) jump(track.scrollLeft + w);
        else if (track.scrollLeft >= 2 * w - 2) jump(track.scrollLeft - w);
      }
      function update() {
        var a = index();
        dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === a)); });
      }
      if (dotsBox) {
        dotsBox.innerHTML = '';
        for (var i = 0; i < n; i++) {
          var d = document.createElement('button');
          d.type = 'button';
          d.setAttribute('aria-label', 'Trang ' + (i + 1) + ' / ' + n);
          d.addEventListener('click', go.bind(null, i));
          dotsBox.appendChild(d);
          dots.push(d);
        }
      }
      function play() {
        clearInterval(timer);
        if (reduce) return;
        timer = setInterval(function () {
          if (!held && !document.hidden) track.scrollBy({ left: step(), behavior: behavior });
        }, 3500);
      }

      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: behavior }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: behavior }); });
      track.addEventListener('scroll', function () {
        update();
        // ponytail: 150ms debounce stands in for scrollend on Safari < 26
        if (!('onscrollend' in window)) { clearTimeout(settle); settle = setTimeout(home, 150); }
      }, { passive: true });
      track.addEventListener('scrollend', home);
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (e) {
        c.addEventListener(e, function () { held = true; }, { passive: true });
      });
      ['mouseleave', 'focusout', 'touchend'].forEach(function (e) {
        c.addEventListener(e, function () { held = false; play(); }, { passive: true });
      });
      window.addEventListener('resize', function () { jump((n + index()) * step()); });
      jump(n * step());
      update();
      play();
    });
  }

  /* ---------- Reveal on scroll (demo-1 pattern) ---------- */
  function reveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    if (!('IntersectionObserver' in window) || reduce) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Scroll-to-top: shown once past the hero ---------- */
  function toTop() {
    var btn = document.querySelector('[data-to-top]');
    if (!btn) return;
    function onScroll() { btn.classList.toggle('is-on', window.scrollY > window.innerHeight); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  header();
  heroVideo();
  beforeAfter();
  tabs();
  carousels();
  reveal();
  toTop();
})();
