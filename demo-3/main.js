/* Mayqueen — Demo 3. Vanilla JS: cart + drawer + checkout, nav, count-up, carousel, forms.
   Works from file:// (no modules, no fetch). */
(function () {
  'use strict';

  var STORAGE_KEY = 'mq-cart-demo3';
  var FREE_SHIP = 500000;
  var SHIP_FEE = 30000;
  var MAX_QTY = 99;

  var PRODUCTS = {
    slim: {
      id: 'slim',
      name: 'Mayqueen Slim',
      price: 550000,
      image: '../product-images/prod3.webp',
      note: 'Lọ 30 viên nang'
    },
    detox: {
      id: 'detox',
      name: 'Yo Detox Extra',
      price: 390000,
      image: '../product-images/prod5.webp',
      note: 'Hộp 20 gói'
    },
    combo: {
      id: 'combo',
      name: 'Combo Mayqueen Slim + Yo Detox Extra',
      price: 849000,
      image: '../others/vn-11134207-81ztc-mu3nwyhnak93cd@resize_w900_nl1.jpg',
      note: '1 lọ Slim + 1 hộp Yo Detox'
    }
  };

  /* ---------- Helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n) { return n.toLocaleString('vi-VN') + 'đ'; }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cart state ---------- */
  function loadCart() {
    var clean = {};
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      Object.keys(data).forEach(function (id) {
        var q = parseInt(data[id], 10);
        if (PRODUCTS[id] && q > 0) clean[id] = Math.min(q, MAX_QTY);
      });
    } catch (e) { /* corrupted or blocked storage: start empty */ }
    return clean;
  }

  var cart = loadCart();

  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
  }
  function itemCount() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }
  function subtotal() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + PRODUCTS[id].price * cart[id]; }, 0);
  }
  function setQty(id, qty) {
    if (!PRODUCTS[id]) return;
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, MAX_QTY);
    saveCart();
    render();
  }
  function addToCart(id, qty) {
    setQty(id, (cart[id] || 0) + (qty || 1));
  }

  /* ---------- Drawer + toast markup (injected once per page) ---------- */
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  document.body.insertAdjacentHTML('beforeend',
    '<div class="overlay" data-cart-close></div>' +
    '<aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">' +
      '<div class="drawer__head">' +
        '<h2 id="drawer-title" tabindex="-1">Giỏ hàng</h2>' +
        '<button class="icon-btn" type="button" data-cart-close aria-label="Đóng giỏ hàng">' + ICON_CLOSE + '</button>' +
      '</div>' +

      '<div class="drawer__view" data-view="cart">' +
        '<div class="drawer__body">' +
          '<div class="ship" data-ship>' +
            '<p data-ship-msg></p>' +
            '<div class="bar" role="progressbar" aria-label="Tiến độ miễn phí vận chuyển" aria-valuemin="0" aria-valuemax="100" data-ship-progress><span data-ship-bar></span></div>' +
          '</div>' +
          '<ul class="lines" data-lines></ul>' +
          '<div class="empty" data-empty>' + ICON_BAG +
            '<h3>Giỏ hàng đang trống</h3>' +
            '<p class="muted">Bắt đầu nghi thức mỗi sáng với Combo Mayqueen Slim + Yo Detox Extra.</p>' +
            '<button class="btn btn--primary" type="button" data-add="combo">Thêm Combo — 849.000đ</button>' +
          '</div>' +
        '</div>' +
        '<div class="drawer__foot" data-cart-foot>' +
          '<div class="subtotal"><span>Tạm tính</span><span data-subtotal>0đ</span></div>' +
          '<p class="small">Phí vận chuyển được tính ở bước thanh toán.</p>' +
          '<button class="btn btn--primary btn--lg btn--block" type="button" data-checkout>Thanh toán</button>' +
        '</div>' +
      '</div>' +

      '<div class="drawer__view" data-view="checkout" hidden>' +
        '<form class="drawer__body" novalidate data-checkout-form>' +
          '<h3>Thông tin nhận hàng</h3>' +
          '<div class="field"><label for="co-name">Họ và tên <span class="req" aria-hidden="true">*</span></label>' +
            '<input id="co-name" name="name" type="text" autocomplete="name" required aria-describedby="co-name-err">' +
            '<p class="field__error" id="co-name-err" data-error-for="name"></p></div>' +
          '<div class="field"><label for="co-phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label>' +
            '<input id="co-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="VD: 0901234567" required aria-describedby="co-phone-err">' +
            '<p class="field__error" id="co-phone-err" data-error-for="phone"></p></div>' +
          '<div class="field"><label for="co-address">Địa chỉ nhận hàng <span class="req" aria-hidden="true">*</span></label>' +
            '<input id="co-address" name="address" type="text" autocomplete="street-address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành" required aria-describedby="co-address-err">' +
            '<p class="field__error" id="co-address-err" data-error-for="address"></p></div>' +
          '<div class="field"><label for="co-note">Ghi chú (không bắt buộc)</label>' +
            '<textarea id="co-note" name="note" rows="2" placeholder="VD: Giao giờ hành chính"></textarea></div>' +
          '<fieldset class="fieldset"><legend>Phương thức thanh toán</legend>' +
            '<label class="radio"><input type="radio" name="payment" value="cod" checked><span>Thanh toán khi nhận hàng (COD)<small>Kiểm tra hàng trước khi trả tiền</small></span></label>' +
            '<label class="radio"><input type="radio" name="payment" value="bank"><span>Chuyển khoản ngân hàng<small>Thông tin chuyển khoản gửi qua SMS (demo)</small></span></label>' +
          '</fieldset>' +
          '<div class="summary" data-summary></div>' +
          '<button class="btn btn--primary btn--lg btn--block" type="submit">Đặt hàng</button>' +
          '<p style="text-align:center;margin:12px 0 0"><button class="link-btn" type="button" data-back>← Quay lại giỏ hàng</button></p>' +
        '</form>' +
      '</div>' +

      '<div class="drawer__view" data-view="success" hidden>' +
        '<div class="drawer__body success">' +
          '<div class="success__icon">' + ICON_CHECK + '</div>' +
          '<h3 tabindex="-1" data-success-title>Đặt hàng thành công!</h3>' +
          '<p>Mayqueen sẽ liên hệ xác nhận trong 30 phút.</p>' +
          '<p class="muted small">Mã đơn hàng (demo): <strong data-order-code></strong></p>' +
          '<button class="btn btn--primary" type="button" data-cart-close>Tiếp tục mua sắm</button>' +
        '</div>' +
      '</div>' +
    '</aside>' +
    '<div class="toast" role="status" aria-live="polite" data-toast></div>'
  );

  var drawer = $('#cart-drawer');
  var linesEl = $('[data-lines]', drawer);
  var emptyEl = $('[data-empty]', drawer);
  var footEl = $('[data-cart-foot]', drawer);
  var shipEl = $('[data-ship]', drawer);
  var checkoutForm = $('[data-checkout-form]', drawer);
  var toastEl = $('[data-toast]');

  /* ---------- Render ---------- */
  function lineHTML(id) {
    var p = PRODUCTS[id];
    var q = cart[id];
    return '<li class="line">' +
      '<img src="' + p.image + '" alt="" width="72" height="72" loading="lazy">' +
      '<div>' +
        '<p class="line__name">' + p.name + '</p>' +
        '<p class="line__price">' + money(p.price) + ' · ' + p.note + '</p>' +
        '<div class="qty" role="group" aria-label="Số lượng ' + p.name + '">' +
          '<button type="button" data-dec="' + id + '" aria-label="Giảm số lượng ' + p.name + '">−</button>' +
          '<output aria-live="polite">' + q + '</output>' +
          '<button type="button" data-inc="' + id + '" aria-label="Tăng số lượng ' + p.name + '">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="line__right">' +
        '<p class="line__total">' + money(p.price * q) + '</p>' +
        '<button type="button" class="link-btn" data-remove="' + id + '" aria-label="Xóa ' + p.name + ' khỏi giỏ">Xóa</button>' +
      '</div>' +
    '</li>';
  }

  function render() {
    var n = itemCount();
    var sub = subtotal();
    var ids = Object.keys(cart);

    $all('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $all('.cart-btn').forEach(function (b) {
      b.setAttribute('aria-label', 'Mở giỏ hàng, ' + n + ' sản phẩm');
    });

    linesEl.innerHTML = ids.map(lineHTML).join('');
    emptyEl.hidden = ids.length > 0;
    footEl.hidden = ids.length === 0;
    shipEl.hidden = ids.length === 0;
    $('[data-subtotal]', drawer).textContent = money(sub);

    var left = FREE_SHIP - sub;
    var pct = Math.min(100, Math.round((sub / FREE_SHIP) * 100));
    $('[data-ship-msg]', drawer).innerHTML = left > 0
      ? 'Mua thêm <strong>' + money(left) + '</strong> để được <strong>miễn phí vận chuyển</strong>.'
      : '<strong>Tuyệt! Đơn hàng của bạn được miễn phí vận chuyển.</strong>';
    $('[data-ship-bar]', drawer).style.width = pct + '%';
    $('[data-ship-progress]', drawer).setAttribute('aria-valuenow', pct);

    var ship = sub >= FREE_SHIP ? 0 : SHIP_FEE;
    $('[data-summary]', drawer).innerHTML =
      '<div><span>Tạm tính (' + n + ' sản phẩm)</span><span>' + money(sub) + '</span></div>' +
      '<div><span>Vận chuyển</span><span>' + (ship ? money(ship) : 'Miễn phí') + '</span></div>' +
      '<div class="summary__total"><span>Tổng cộng</span><span>' + money(sub + ship) + '</span></div>';
  }

  /* ---------- Drawer open / close / views ---------- */
  var lastFocus = null;

  function isOpen() { return document.documentElement.classList.contains('is-cart-open'); }

  function showView(name) {
    $all('[data-view]', drawer).forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
    $('#drawer-title').textContent = name === 'checkout' ? 'Thanh toán' : name === 'success' ? 'Hoàn tất' : 'Giỏ hàng';
  }

  function openDrawer(view) {
    showView(view || 'cart');
    if (!isOpen()) lastFocus = document.activeElement;
    document.documentElement.classList.add('is-cart-open');
    closeNav();
    setTimeout(function () { $('#drawer-title').focus(); }, 60);
  }

  function closeDrawer() {
    document.documentElement.classList.remove('is-cart-open');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function focusables(root) {
    return $all('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex="0"]', root)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    toastEl.innerHTML = '<span>' + msg + '</span><button type="button" class="toast__btn" data-cart-open>Xem giỏ</button>';
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 3000);
  }

  function bumpBadge() {
    $all('[data-cart-count]').forEach(function (el) {
      el.classList.remove('is-bump');
      void el.offsetWidth; // restart animation
      el.classList.add('is-bump');
    });
  }

  /* Re-rendering replaces the qty buttons, so put focus back where the user was. */
  function refocus(selector) {
    var el = selector && $(selector, drawer);
    (el || $('#drawer-title')).focus();
  }

  /* ---------- Global click delegation ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add],[data-buy],[data-cart-open],[data-cart-close],[data-inc],[data-dec],[data-remove],[data-checkout],[data-back]');
    if (!t) return;
    var d = t.dataset;

    if (d.add) {
      if (!PRODUCTS[d.add]) return;
      addToCart(d.add, parseInt(d.qty, 10) || 1);
      bumpBadge();
      if (isOpen()) return; // e.g. "Thêm Combo" inside empty drawer
      toast('Đã thêm <strong>' + PRODUCTS[d.add].name + '</strong> vào giỏ');
    } else if (d.buy) {
      if (!PRODUCTS[d.buy]) return;
      addToCart(d.buy, 1);
      bumpBadge();
      openDrawer('cart');
    } else if ('cartOpen' in d) {
      toastEl.classList.remove('is-show');
      openDrawer('cart');
    } else if ('cartClose' in d) {
      closeDrawer();
    } else if (d.inc) {
      setQty(d.inc, (cart[d.inc] || 0) + 1);
      refocus('[data-inc="' + d.inc + '"]');
    } else if (d.dec) {
      setQty(d.dec, (cart[d.dec] || 0) - 1);
      refocus('[data-dec="' + d.dec + '"]');
    } else if (d.remove) {
      setQty(d.remove, 0);
      refocus(null);
    } else if ('checkout' in d) {
      if (!itemCount()) return;
      showView('checkout');
      $('#co-name').focus();
    } else if ('back' in d) {
      showView('cart');
      $('#drawer-title').focus();
    }
  });

  /* ---------- Keyboard: Esc + focus trap ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (isOpen()) closeDrawer();
      else closeNav(true);
      return;
    }
    if (e.key !== 'Tab' || !isOpen()) return;
    var f = focusables(drawer);
    if (!f.length) return;
    var first = f[0];
    var last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* Keep tabs in sync */
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) { cart = loadCart(); render(); }
  });

  /* ---------- Form validation (checkout + contact) ---------- */
  function phoneRule(v) {
    return /^0\d{9}$/.test(v.replace(/[\s.\-]/g, '')) ? '' : 'Số điện thoại gồm 10 chữ số và bắt đầu bằng số 0.';
  }
  function minLen(n, msg) {
    return function (v) { return v.trim().length >= n ? '' : msg; };
  }

  function validateField(form, name, rule) {
    var input = form.elements[name];
    var msg = rule(input.value);
    var err = form.querySelector('[data-error-for="' + name + '"]');
    if (err) err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function validateForm(form, rules) {
    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      if (!validateField(form, name, rules[name]) && !firstBad) firstBad = form.elements[name];
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  /* Clear an error as soon as the user fixes it */
  function liveValidate(form, rules) {
    form.addEventListener('input', function (e) {
      var name = e.target.name;
      if (rules[name] && e.target.getAttribute('aria-invalid') === 'true') validateField(form, name, rules[name]);
    });
  }

  var checkoutRules = {
    name: minLen(2, 'Vui lòng nhập họ và tên.'),
    phone: phoneRule,
    address: minLen(8, 'Vui lòng nhập địa chỉ nhận hàng đầy đủ.')
  };
  liveValidate(checkoutForm, checkoutRules);

  checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!itemCount() || !validateForm(checkoutForm, checkoutRules)) return;
    // Demo only: no network call. Clear cart and show success.
    $('[data-order-code]', drawer).textContent = 'MQ' + String(Date.now()).slice(-6);
    cart = {};
    saveCart();
    render();
    checkoutForm.reset();
    showView('success');
    $('[data-success-title]', drawer).focus();
  });

  var contactForm = $('[data-contact-form]');
  if (contactForm) {
    var contactRules = {
      name: minLen(2, 'Vui lòng nhập họ và tên.'),
      phone: phoneRule,
      email: function (v) {
        return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Email chưa đúng định dạng (VD: ban@email.com).';
      },
      message: minLen(10, 'Nội dung cần ít nhất 10 ký tự.')
    };
    liveValidate(contactForm, contactRules);
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(contactForm, contactRules)) return;
      var ok = $('[data-contact-success]');
      ok.hidden = false;
      contactForm.reset();
      ok.focus();
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = $('.nav-toggle');
  var nav = $('#site-nav');

  function closeNav(returnFocus) {
    if (!navToggle || navToggle.getAttribute('aria-expanded') !== 'true') return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Mở menu');
    nav.classList.remove('is-open');
    if (returnFocus) navToggle.focus();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
  }

  /* ---------- Count-up numbers ---------- */
  function showCount(el, value) {
    var dec = parseInt(el.dataset.decimals, 10) || 0;
    el.textContent = value.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
  }

  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.decimals, 10) || 0;
    var start = null;
    var duration = 1600;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var v = target * (1 - Math.pow(1 - p, 3)); // ease-out cubic
      showCount(el, dec ? v : Math.round(v));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = $all('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { showCount(el, 0); io.observe(el); });
  }

  /* ---------- Testimonial carousel ---------- */
  $all('[data-carousel]').forEach(function (root) {
    var slides = $all('[data-slide]', root);
    var dots = $all('[data-dot]', root);
    var index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.hidden = k !== index; });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === index ? 'true' : 'false'); });
    }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-prev],[data-next],[data-dot]');
      if (!b) return;
      if ('prev' in b.dataset) show(index - 1);
      else if ('next' in b.dataset) show(index + 1);
      else show(parseInt(b.dataset.dot, 10));
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    show(0);
  });

  render();
})();
