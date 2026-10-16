/* Mayqueen — Demo 1 "Editorial Science". Vanilla JS, works over file:// */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- Data ---------- */
  var PRODUCTS = {
    slim: { id: 'slim', name: 'Mayqueen Slim', price: 550000, unit: 'Lọ 30 viên nang', image: '../product-images/prod4.webp' },
    detox: { id: 'detox', name: 'Yo Detox Extra', price: 390000, unit: 'Hộp 20 gói', image: '../product-images/prod5.webp' },
    combo: { id: 'combo', name: 'Combo Mayqueen Slim + Yo Detox Extra', price: 849000, unit: '1 lọ Slim + 1 hộp Yo Detox', image: '../others/vn-11134207-81ztc-mu3nwyhnak93cd@resize_w900_nl1.jpg' }
  };
  var KEY = 'mq-cart-demo1';
  var FREE_SHIP = 500000;
  var SHIP_FEE = 30000;
  var MAX_QTY = 20;

  function money(n) { return n.toLocaleString('vi-VN') + 'đ'; }
  console.assert(money(550000) === '550.000đ', 'money() format changed');

  /* ---------- Cart state: { productId: qty } ---------- */
  var cart = load();
  var view = 'cart'; // cart | checkout | success
  var lastOrder = '';

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY)) || {};
      var clean = {};
      Object.keys(raw).forEach(function (id) {
        var q = parseInt(raw[id], 10);
        if (PRODUCTS[id] && q > 0) clean[id] = Math.min(q, MAX_QTY);
      });
      return clean;
    } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode: cart lives in memory */ }
    renderBadge();
    render();
  }
  function count() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0); }
  function subtotal() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id] * PRODUCTS[id].price; }, 0); }
  function add(id, qty) {
    if (!PRODUCTS[id]) return;
    cart[id] = Math.min((cart[id] || 0) + qty, MAX_QTY);
    view = 'cart';
    save();
  }
  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, MAX_QTY);
    save();
  }

  /* ---------- Drawer markup (injected once per page) ---------- */
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>';

  document.body.insertAdjacentHTML('beforeend',
    '<div class="overlay" data-cart-close></div>' +
    '<aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">' +
      '<div class="drawer-head"><h2 id="cart-title">Giỏ hàng</h2>' +
      '<button type="button" class="icon-btn" data-cart-close aria-label="Đóng giỏ hàng">' + ICON_CLOSE + '</button></div>' +
      '<div class="drawer-body" data-drawer-body></div>' +
      '<div class="drawer-foot" data-drawer-foot></div>' +
    '</aside>' +
    '<div class="toast" role="status" aria-live="polite"></div>');

  var drawer = document.getElementById('cart-drawer');
  var overlay = document.querySelector('.overlay');
  var body = drawer.querySelector('[data-drawer-body]');
  var foot = drawer.querySelector('[data-drawer-foot]');
  var toastEl = document.querySelector('.toast');
  var lastFocus = null;

  function renderBadge() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (b) {
      b.textContent = n;
      b.setAttribute('data-count', n);
    });
    document.querySelectorAll('[data-cart-open]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Mở giỏ hàng, ' + n + ' sản phẩm');
    });
  }

  function shipHtml(sub) {
    var left = FREE_SHIP - sub;
    var pct = Math.min(100, Math.round(sub / FREE_SHIP * 100));
    var msg = left > 0
      ? 'Mua thêm <strong>' + money(left) + '</strong> để được <strong>miễn phí vận chuyển</strong>.'
      : 'Đơn hàng của bạn được <strong>miễn phí vận chuyển</strong>.';
    return '<div class="ship-progress"><p>' + msg + '</p><div class="ship-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></div></div>';
  }

  function summaryHtml(sub) {
    var ship = sub >= FREE_SHIP ? 0 : SHIP_FEE;
    return '<div class="summary-row"><span>Tạm tính</span><span>' + money(sub) + '</span></div>' +
      '<div class="summary-row"><span>Phí vận chuyển</span><span>' + (ship ? money(ship) : 'Miễn phí') + '</span></div>' +
      '<div class="summary-row total"><span>Tổng cộng</span><span>' + money(sub + ship) + '</span></div>';
  }

  function render() {
    var ids = Object.keys(cart);
    var sub = subtotal();
    // keep focus on the same control after re-render (e.g. repeated +/- clicks)
    var active = document.activeElement;
    var focusKey = active && drawer.contains(active) ? active.getAttribute('data-focus-key') : null;

    if (view === 'success') {
      body.innerHTML = '<div class="form-success" tabindex="-1" data-autofocus><strong>Đặt hàng thành công!</strong>' +
        '<p>Mayqueen sẽ liên hệ xác nhận trong 30 phút.</p><p>Mã đơn hàng: <b>' + lastOrder + '</b></p></div>';
      foot.innerHTML = '<button type="button" class="btn btn-primary btn-block" data-cart-close>Tiếp tục mua sắm</button>';
    } else if (!ids.length) {
      body.innerHTML = '<div class="cart-empty">' + ICON_BAG + '<p>Giỏ hàng của bạn đang trống.</p>' +
        '<a class="btn btn-ghost" href="index.html#products" data-cart-close>Khám phá sản phẩm</a></div>';
      foot.innerHTML = '';
    } else if (view === 'checkout') {
      body.innerHTML = '<button type="button" class="back-btn" data-back data-focus-key="back">← Quay lại giỏ hàng</button>' +
        '<h3>Thông tin giao hàng</h3>' +
        '<form id="checkout-form" data-validate novalidate>' +
          field('co-name', 'Họ và tên', '<input id="co-name" name="name" type="text" autocomplete="name" required data-required="Vui lòng nhập họ tên.">') +
          field('co-phone', 'Số điện thoại', '<input id="co-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" required pattern="0[0-9]{9}" placeholder="0901234567" data-required="Vui lòng nhập số điện thoại." data-error="Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.">') +
          field('co-address', 'Địa chỉ nhận hàng', '<input id="co-address" name="address" type="text" autocomplete="street-address" required minlength="8" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" data-required="Vui lòng nhập địa chỉ nhận hàng." data-error="Địa chỉ quá ngắn, vui lòng ghi rõ hơn.">') +
          field('co-note', 'Ghi chú (không bắt buộc)', '<textarea id="co-note" name="note" rows="2" placeholder="Ví dụ: giao giờ hành chính"></textarea>') +
          '<fieldset class="field"><legend>Phương thức thanh toán</legend>' +
            '<label class="radio"><input type="radio" name="payment" value="cod" checked> Thanh toán khi nhận hàng (COD)</label>' +
            '<label class="radio"><input type="radio" name="payment" value="bank"> Chuyển khoản ngân hàng</label>' +
          '</fieldset>' +
        '</form>';
      foot.innerHTML = summaryHtml(sub) + '<button type="submit" form="checkout-form" class="btn btn-primary btn-block">Đặt hàng · ' + money(sub + (sub >= FREE_SHIP ? 0 : SHIP_FEE)) + '</button>';
    } else {
      body.innerHTML = shipHtml(sub) + '<ul class="cart-items">' + ids.map(function (id) {
        var p = PRODUCTS[id], q = cart[id];
        return '<li class="cart-item">' +
          '<img src="' + p.image + '" alt="" width="76" height="76">' +
          '<div><h3>' + p.name + '</h3><p class="unit">' + p.unit + ' · ' + money(p.price) + '</p>' +
            '<div class="qty qty--sm">' +
              '<button type="button" data-qty="-1" data-id="' + id + '" data-focus-key="dec-' + id + '" aria-label="Giảm số lượng ' + p.name + '">−</button>' +
              '<span aria-live="polite">' + q + '</span>' +
              '<button type="button" data-qty="1" data-id="' + id + '" data-focus-key="inc-' + id + '" aria-label="Tăng số lượng ' + p.name + '"' + (q >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
            '</div></div>' +
          '<div><p class="line-total">' + money(p.price * q) + '</p>' +
            '<button type="button" class="remove-btn" data-remove="' + id + '">Xóa<span class="sr-only"> ' + p.name + '</span></button></div>' +
        '</li>';
      }).join('') + '</ul>';
      foot.innerHTML = summaryHtml(sub) + '<button type="button" class="btn btn-primary btn-block" data-checkout>Thanh toán</button>';
    }

    if (focusKey) {
      var again = drawer.querySelector('[data-focus-key="' + focusKey + '"]');
      (again && !again.disabled ? again : drawer.querySelector('[data-cart-close]')).focus();
    }
  }

  function field(id, label, control) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' + control + '</div>';
  }

  function openDrawer() {
    if (drawer.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    render();
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
    document.querySelectorAll('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    drawer.querySelector('[data-cart-close]').focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    document.querySelectorAll('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (view === 'success') view = 'cart';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2600);
  }

  function qtyFrom(btn) {
    var card = btn.closest('[data-product-card]');
    var input = card && card.querySelector('.qty input');
    var q = input ? parseInt(input.value, 10) : 1;
    return q > 0 ? Math.min(q, MAX_QTY) : 1;
  }

  /* ---------- Form validation (shared: checkout, contact, newsletter) ---------- */
  function validateField(el) {
    if (el.type === 'tel') el.value = el.value.replace(/[\s.\-]/g, '');
    else if (el.type !== 'radio' && el.type !== 'checkbox') el.value = el.value.trim();
    var wrap = el.closest('.field');
    var err = wrap && wrap.querySelector('.field-error');
    if (wrap && !err) {
      err = document.createElement('small');
      err.className = 'field-error';
      err.id = el.id + '-err';
      wrap.appendChild(err);
      el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + err.id).trim());
    }
    var ok = el.checkValidity();
    var msg = ok ? '' : el.validity.valueMissing
      ? (el.getAttribute('data-required') || 'Vui lòng nhập thông tin này.')
      : (el.getAttribute('data-error') || 'Thông tin chưa hợp lệ.');
    if (err) err.textContent = msg;
    if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
    return ok;
  }
  function validateForm(form) {
    var firstBad = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.willValidate || el.type === 'radio' || el.type === 'submit' || el.tagName === 'BUTTON') return;
      if (!validateField(el) && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.hasAttribute('data-validate')) return;
    e.preventDefault();
    if (!validateForm(form)) return;

    if (form.id === 'checkout-form') {
      lastOrder = 'MQ' + String(Date.now()).slice(-6);
      cart = {};
      view = 'success';
      save();
      var s = drawer.querySelector('[data-autofocus]');
      if (s) s.focus();
      return;
    }
    // ponytail: fake success, no network call (demo)
    var box = document.createElement('div');
    box.className = 'form-success';
    box.setAttribute('role', 'status');
    box.tabIndex = -1;
    box.innerHTML = form.getAttribute('data-success') || '<strong>Cảm ơn bạn!</strong>';
    form.hidden = true;
    form.parentNode.insertBefore(box, form.nextSibling);
    box.focus();
  });

  document.addEventListener('input', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') {
      if (e.target.checkValidity()) validateField(e.target);
    }
  });

  /* ---------- Click delegation ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a, [data-cart-close]');
    if (!t) return;

    if (t.hasAttribute('data-add')) {
      var id = t.getAttribute('data-add'), q = qtyFrom(t);
      add(id, q);
      toast('Đã thêm ' + q + ' × ' + PRODUCTS[id].name + ' vào giỏ hàng');
    } else if (t.hasAttribute('data-buy')) {
      add(t.getAttribute('data-buy'), qtyFrom(t));
      openDrawer();
    } else if (t.hasAttribute('data-cart-open')) {
      openDrawer();
    } else if (t.hasAttribute('data-cart-close')) {
      closeDrawer();
    } else if (t.hasAttribute('data-step')) {
      var input = t.closest('.qty').querySelector('input');
      var v = (parseInt(input.value, 10) || 1) + parseInt(t.getAttribute('data-step'), 10);
      input.value = Math.max(1, Math.min(MAX_QTY, v));
    } else if (t.hasAttribute('data-qty')) {
      var pid = t.getAttribute('data-id');
      setQty(pid, (cart[pid] || 0) + parseInt(t.getAttribute('data-qty'), 10));
    } else if (t.hasAttribute('data-remove')) {
      setQty(t.getAttribute('data-remove'), 0);
      drawer.querySelector('[data-cart-close]').focus();
    } else if (t.hasAttribute('data-checkout')) {
      view = 'checkout';
      render();
      drawer.querySelector('#co-name').focus();
    } else if (t.hasAttribute('data-back')) {
      view = 'cart';
      render();
      drawer.querySelector('[data-cart-close]').focus();
    } else if (t.hasAttribute('data-nav-toggle')) {
      toggleNav();
    } else if (t.closest('#site-nav') && t.tagName === 'A') {
      toggleNav(false);
    }
  });

  /* ---------- Keyboard: Esc + focus trap ---------- */
  document.addEventListener('keydown', function (e) {
    var open = drawer.classList.contains('is-open');
    if (e.key === 'Escape') {
      if (open) closeDrawer(); else toggleNav(false);
    }
    if (e.key === 'Tab' && open) {
      var items = Array.prototype.filter.call(
        drawer.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { cart = load(); renderBadge(); render(); }
  });

  /* ---------- Mobile nav ---------- */
  var nav = document.getElementById('site-nav');
  var navBtn = document.querySelector('[data-nav-toggle]');
  function toggleNav(force) {
    if (!nav || !navBtn) return;
    var open = typeof force === 'boolean' ? force : !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    navBtn.setAttribute('aria-expanded', String(open));
    navBtn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  }

  /* ---------- Tabs (science) ---------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
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
      var i = tabs.indexOf(document.activeElement);
      if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  /* ---------- Article filter chips ---------- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var grid = document.getElementById(group.getAttribute('data-filter-group'));
    group.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]');
      if (!chip) return;
      var f = chip.getAttribute('data-filter');
      group.querySelectorAll('[data-filter]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      grid.querySelectorAll('[data-cat]').forEach(function (card) {
        card.hidden = f !== 'all' && card.getAttribute('data-cat') !== f;
      });
    });
  });

  /* ---------- Policy TOC: highlight current section ---------- */
  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  if (tocLinks.length && 'IntersectionObserver' in window) {
    var tocIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    tocLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) tocIo.observe(sec);
    });
  }

  renderBadge();
  render();
})();
