/* Mayqueen — Demo 2 "Clinical Lab"
   Vanilla JS, no modules (works via file://). */
(function () {
  'use strict';

  // ---------- Catalog ----------
  var PRODUCTS = {
    slim:  { name: 'Mayqueen Slim', variant: '1 lọ · 30 viên nang', price: 550000, image: '../product-images/prod2.webp' },
    slim3: { name: 'Mayqueen Slim — Liệu trình 3 lọ', variant: '3 lọ · 90 viên nang', price: 1490000, image: '../product-images/prod4.webp' },
    detox: { name: 'Yo Detox Extra', variant: 'Hộp 20 gói · bột pha uống', price: 390000, image: '../product-images/prod5.webp' },
    combo: { name: 'Combo Mayqueen Slim + Yo Detox Extra', variant: '1 lọ Slim + 1 hộp Yo Detox', price: 849000, image: '../others/vn-11134207-81ztc-mu3nwyhnak93cd@resize_w900_nl1.jpg' }
  };
  var STORAGE_KEY = 'mq-cart-demo2';
  var FREE_SHIP = 500000;
  var SHIP_FEE = 30000;
  var MAX_QTY = 20;

  function money(n) { return n.toLocaleString('vi-VN') + 'đ'; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clampQty(n) { n = parseInt(n, 10); return isNaN(n) ? 1 : Math.min(MAX_QTY, Math.max(1, n)); }

  // ---------- Cart state: { productId: qty } ----------
  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      var clean = {};
      Object.keys(raw).forEach(function (id) {
        if (PRODUCTS[id] && raw[id] > 0) clean[id] = clampQty(raw[id]);
      });
      return clean;
    } catch (e) { return {}; }
  }
  var cart = loadCart();

  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked: cart stays in memory */ }
    render();
  }
  function addToCart(id, qty) {
    if (!PRODUCTS[id]) return;
    cart[id] = Math.min(MAX_QTY, (cart[id] || 0) + qty);
    saveCart();
  }
  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(MAX_QTY, qty);
    saveCart();
  }
  function totals() {
    var ids = Object.keys(cart);
    var count = 0, subtotal = 0;
    ids.forEach(function (id) { count += cart[id]; subtotal += PRODUCTS[id].price * cart[id]; });
    var shipping = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : SHIP_FEE;
    return { ids: ids, count: count, subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
  }

  // ---------- Drawer markup (injected once per page) ----------
  var drawerHTML =
    '<div class="drawer-overlay"></div>' +
    '<aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">' +
      '<div class="drawer-head">' +
        '<h2 id="cart-title">Giỏ hàng <span class="mono" data-cart-count-text></span></h2>' +
        '<button type="button" class="icon-btn" data-close-cart aria-label="Đóng giỏ hàng"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>' +
      '</div>' +
      '<div class="drawer-body">' +
        // cart view
        '<div data-view="cart">' +
          '<div class="ship" data-ship>' +
            '<p data-ship-msg></p>' +
            '<div class="bar" role="progressbar" aria-label="Tiến độ miễn phí vận chuyển" aria-valuemin="0" aria-valuemax="100" data-ship-bar><span></span></div>' +
          '</div>' +
          '<ul class="cart-lines" data-lines></ul>' +
          '<div class="cart-empty" data-empty hidden>' +
            '<div class="ritual-icon"><svg class="icon" aria-hidden="true"><use href="#i-bag"/></svg></div>' +
            '<p>Giỏ hàng của bạn đang trống.</p>' +
            '<a class="btn btn-primary" href="index.html#products" data-close-cart>Khám phá sản phẩm</a>' +
          '</div>' +
        '</div>' +
        // checkout view
        '<div data-view="checkout" hidden>' +
          '<button type="button" class="link-btn back-btn" data-back>← Quay lại giỏ hàng</button>' +
          '<form class="checkout" id="checkout-form" novalidate>' +
            '<h3>Thông tin giao hàng</h3>' +
            '<div class="field"><label for="co-name">Họ và tên <span class="req" aria-hidden="true">*</span></label>' +
              '<input class="input" id="co-name" name="name" autocomplete="name" data-rule="required" aria-describedby="co-name-err" required>' +
              '<p class="field-error" id="co-name-err"></p></div>' +
            '<div class="field"><label for="co-phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label>' +
              '<input class="input" id="co-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="VD: 0901234567" data-rule="required phone" aria-describedby="co-phone-err" required>' +
              '<p class="field-error" id="co-phone-err"></p></div>' +
            '<div class="field"><label for="co-address">Địa chỉ nhận hàng <span class="req" aria-hidden="true">*</span></label>' +
              '<input class="input" id="co-address" name="address" autocomplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" data-rule="required" aria-describedby="co-address-err" required>' +
              '<p class="field-error" id="co-address-err"></p></div>' +
            '<div class="field"><label for="co-note">Ghi chú</label>' +
              '<textarea class="input" id="co-note" name="note" rows="2" placeholder="Thời gian nhận hàng, lưu ý cho shipper…"></textarea></div>' +
            '<fieldset class="pay-options"><legend class="field-label">Phương thức thanh toán</legend>' +
              '<label class="pay-option"><input type="radio" name="payment" value="cod" checked><span><strong>Thanh toán khi nhận hàng (COD)</strong><span>Kiểm tra hàng trước khi thanh toán.</span></span></label>' +
              '<label class="pay-option"><input type="radio" name="payment" value="bank"><span><strong>Chuyển khoản ngân hàng</strong><span>Mayqueen gửi thông tin tài khoản qua SMS/Zalo.</span></span></label>' +
            '</fieldset>' +
          '</form>' +
        '</div>' +
        // success view
        '<div data-view="success" hidden>' +
          '<div class="success-box" role="status">' +
            '<div class="success-icon"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></div>' +
            '<h3 tabindex="-1" data-success-title>Đặt hàng thành công!</h3>' +
            '<p>Mayqueen sẽ liên hệ xác nhận trong 30 phút.</p>' +
            '<p>Mã đơn hàng: <span class="mono" data-order-id></span></p>' +
            '<button type="button" class="btn btn-primary" data-close-cart>Tiếp tục mua sắm</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="drawer-foot" data-foot>' +
        '<div class="sum-row"><span>Tạm tính</span><span class="mono" data-subtotal></span></div>' +
        '<div class="sum-row"><span>Phí vận chuyển</span><span class="mono" data-shipping></span></div>' +
        '<div class="sum-row sum-total"><span>Tổng cộng</span><span class="mono" data-total></span></div>' +
        '<button type="button" class="btn btn-primary btn-block btn-lg" data-go-checkout>Thanh toán</button>' +
        '<button type="submit" form="checkout-form" class="btn btn-primary btn-block btn-lg" data-place-order hidden>Đặt hàng</button>' +
      '</div>' +
    '</aside>' +
    '<div class="toast" role="status" aria-live="polite" data-toast><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span data-toast-text></span></div>';

  document.body.insertAdjacentHTML('beforeend', drawerHTML);

  var drawer = $('#cart-drawer');
  var view = 'cart';
  var lastFocus = null;

  function lineHTML(id) {
    var p = PRODUCTS[id], q = cart[id];
    return '<li class="line" data-id="' + id + '">' +
      '<img src="' + p.image + '" alt="" width="68" height="68" loading="lazy">' +
      '<div><p class="line-name">' + p.name + '</p><p class="line-variant mono">' + p.variant + ' · ' + money(p.price) + '</p>' +
        '<div class="qty" role="group" aria-label="Số lượng ' + p.name + '">' +
          '<button type="button" data-line-step="-1" aria-label="Giảm số lượng ' + p.name + '">−</button>' +
          '<output aria-live="polite">' + q + '</output>' +
          '<button type="button" data-line-step="1" aria-label="Tăng số lượng ' + p.name + '"' + (q >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
        '</div></div>' +
      '<div class="line-side"><p class="line-price">' + money(p.price * q) + '</p>' +
        '<button type="button" class="link-btn" data-line-remove>Xóa</button></div>' +
    '</li>';
  }

  function render() {
    var t = totals();

    // header badges (every page)
    $$('[data-cart-count]').forEach(function (b) {
      b.textContent = t.count;
      b.hidden = t.count === 0;
    });
    $$('[data-open-cart]').forEach(function (b) {
      b.setAttribute('aria-label', 'Mở giỏ hàng (' + t.count + ' sản phẩm)');
    });

    $('[data-cart-count-text]', drawer).textContent = t.count ? '(' + t.count + ')' : '';

    // empty cart while on checkout → back to cart view
    if (!t.count && view === 'checkout') view = 'cart';

    $$('[data-view]', drawer).forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });

    $('[data-lines]', drawer).innerHTML = t.ids.map(lineHTML).join('');
    $('[data-empty]', drawer).hidden = t.count > 0;
    $('[data-ship]', drawer).hidden = t.count === 0;

    var remain = FREE_SHIP - t.subtotal;
    var pct = Math.min(100, Math.round(t.subtotal / FREE_SHIP * 100));
    $('[data-ship-msg]', drawer).innerHTML = remain > 0
      ? 'Mua thêm <strong class="mono">' + money(remain) + '</strong> để được <strong>miễn phí vận chuyển</strong>.'
      : 'Đơn hàng của bạn được <strong>miễn phí vận chuyển</strong>.';
    var shipBar = $('[data-ship-bar]', drawer);
    shipBar.setAttribute('aria-valuenow', pct);
    shipBar.firstChild.style.width = pct + '%';

    $('[data-subtotal]', drawer).textContent = money(t.subtotal);
    $('[data-shipping]', drawer).textContent = t.shipping ? money(t.shipping) : 'Miễn phí';
    $('[data-total]', drawer).textContent = money(t.total);

    $('[data-foot]', drawer).hidden = view === 'success' || t.count === 0;
    $('[data-go-checkout]', drawer).hidden = view !== 'cart';
    var place = $('[data-place-order]', drawer);
    place.hidden = view !== 'checkout';
    place.textContent = 'Đặt hàng · ' + money(t.total);
  }

  // ---------- Drawer open / close ----------
  function openCart() {
    lastFocus = document.activeElement;
    document.documentElement.classList.add('cart-open', 'html-lock');
    render();
    setTimeout(function () { $('[data-close-cart].icon-btn', drawer).focus(); }, 60);
  }
  function closeCart() {
    if (!document.documentElement.classList.contains('cart-open')) return;
    document.documentElement.classList.remove('cart-open', 'html-lock');
    if (view === 'success') { view = 'cart'; render(); }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Focus trap + Esc
  document.addEventListener('keydown', function (e) {
    if (!document.documentElement.classList.contains('cart-open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), input, textarea, select', drawer).filter(function (el) {
      return el.offsetParent !== null;
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ---------- Toast ----------
  var toast = $('[data-toast]');
  var toastTimer;
  function showToast(msg) {
    $('[data-toast-text]', toast).textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  function bumpBadges() {
    $$('[data-cart-count]').forEach(function (b) {
      b.classList.remove('bump');
      void b.offsetWidth; // restart animation
      b.classList.add('bump');
    });
  }

  // ---------- Form validation (checkout + contact) ----------
  function fieldError(el) {
    var v = el.value.trim();
    var rules = (el.getAttribute('data-rule') || '').split(' ');
    if (rules.indexOf('required') > -1 && !v) return el.getAttribute('data-msg') || 'Vui lòng nhập thông tin này.';
    if (v && rules.indexOf('phone') > -1 && !/^0\d{9}$/.test(v.replace(/[\s.-]/g, ''))) return 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.';
    if (v && rules.indexOf('email') > -1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email chưa đúng định dạng (VD: ten@email.com).';
    if (v && rules.indexOf('min10') > -1 && v.length < 10) return 'Nội dung cần ít nhất 10 ký tự.';
    return '';
  }
  function showFieldError(el) {
    var msg = fieldError(el);
    var err = document.getElementById(el.id + '-err');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return msg;
  }
  function validateForm(form) {
    var firstBad = null;
    $$('[data-rule]', form).forEach(function (el) {
      if (showFieldError(el) && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  // live re-check once a field has been flagged
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') showFieldError(el);
  });

  // ---------- Click delegation ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a');
    if (!t) return;

    if (t.hasAttribute('data-add')) {
      var id = t.getAttribute('data-add');
      var qtyInput = t.getAttribute('data-qty-input') && document.getElementById(t.getAttribute('data-qty-input'));
      var qty = qtyInput ? clampQty(qtyInput.value) : clampQty(t.getAttribute('data-qty') || 1);
      view = 'cart';
      addToCart(id, qty);
      bumpBadges();
      if (t.hasAttribute('data-buy-now')) openCart();
      else showToast('Đã thêm ' + qty + ' × ' + PRODUCTS[id].name + ' vào giỏ');
      return;
    }
    if (t.hasAttribute('data-open-cart')) { e.preventDefault(); openCart(); return; }
    if (t.hasAttribute('data-close-cart')) {
      closeCart();
      return; // links (e.g. "Khám phá sản phẩm") still navigate
    }
    if (t.hasAttribute('data-go-checkout')) {
      view = 'checkout';
      render();
      $('#co-name').focus();
      return;
    }
    if (t.hasAttribute('data-back')) { view = 'cart'; render(); $('[data-go-checkout]', drawer).focus(); return; }

    var line = t.closest('.line');
    if (line) {
      var lid = line.getAttribute('data-id');
      if (t.hasAttribute('data-line-step')) {
        var step = parseInt(t.getAttribute('data-line-step'), 10);
        setQty(lid, cart[lid] + step);
        // keep keyboard focus on the same control after re-render
        var again = $('.line[data-id="' + lid + '"] [data-line-step="' + step + '"]', drawer);
        if (again && !again.disabled) again.focus();
        else $('[data-close-cart].icon-btn', drawer).focus();
      } else if (t.hasAttribute('data-line-remove')) {
        setQty(lid, 0);
        $('[data-close-cart].icon-btn', drawer).focus();
      }
      return;
    }

    // qty stepper outside drawer
    if (t.hasAttribute('data-step')) {
      var input = t.parentNode.querySelector('input');
      input.value = clampQty(parseInt(input.value, 10) + parseInt(t.getAttribute('data-step'), 10));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // overlay is a div, not a button
  $('.drawer-overlay').addEventListener('click', closeCart);

  // Checkout submit
  $('#checkout-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm(this)) return;
    cart = {};
    this.reset();
    $$('[aria-invalid]', this).forEach(function (el) { el.removeAttribute('aria-invalid'); });
    view = 'success';
    $('[data-order-id]', drawer).textContent = 'MQ' + String(Date.now()).slice(-6);
    saveCart();
    $('[data-success-title]', drawer).focus();
  });

  // Keep tabs in sync
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) { cart = loadCart(); render(); }
  });

  // ---------- Mobile nav ----------
  var header = $('[data-header]');
  var navToggle = $('.nav-toggle');
  function setNav(open) {
    header.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  }
  if (header && navToggle) {
    navToggle.addEventListener('click', function () { setNav(!header.classList.contains('nav-open')); });
    $$('.main-nav a', header).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { setNav(false); navToggle.focus(); }
    });
  }

  // ---------- Hero: gallery ----------
  var mainImg = $('#gallery-main');
  $$('[data-thumb]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('[data-thumb]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      mainImg.classList.add('is-swapping');
      setTimeout(function () {
        mainImg.src = btn.getAttribute('data-src');
        mainImg.alt = btn.getAttribute('data-alt');
        mainImg.classList.remove('is-swapping');
      }, 150);
    });
  });

  // ---------- Hero: pack picker + qty → button price ----------
  var heroQty = $('#hero-qty');
  function updateHeroPrice() {
    var picked = $('input[name="pack"]:checked');
    if (!picked || !heroQty) return;
    var id = picked.value;
    var q = clampQty(heroQty.value);
    $$('[data-hero-add]').forEach(function (b) { b.setAttribute('data-add', id); });
    $$('[data-hero-price]').forEach(function (s) { s.textContent = money(PRODUCTS[id].price * q); });
  }
  $$('input[name="pack"]').forEach(function (r) { r.addEventListener('change', updateHeroPrice); });
  if (heroQty) {
    heroQty.addEventListener('input', updateHeroPrice);
    heroQty.addEventListener('change', function () { heroQty.value = clampQty(heroQty.value); updateHeroPrice(); });
    updateHeroPrice();
  }

  // ---------- Tabs (ARIA tabs pattern) ----------
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        if (on) revealIn(document.getElementById(t.getAttribute('aria-controls')));
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  // ---------- Contact form ----------
  var contactForm = $('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = $('[data-contact-success]');
      if (!validateForm(contactForm)) { ok.hidden = true; return; }
      contactForm.reset();
      ok.hidden = false;
      ok.focus();
    });
  }

  // ---------- Reveal on scroll ----------
  function revealIn(el) { if (el) $$('.reveal', el).concat(el.classList.contains('reveal') ? [el] : []).forEach(function (r) { r.classList.add('is-in'); }); }
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('is-in'); });
  }

  render();
})();
