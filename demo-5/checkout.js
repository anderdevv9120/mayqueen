/* Shared by the three purchase layouts and their success screens. */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var layouts = { classic: 'product.html', editorial: 'product-editorial.html', sheet: 'product-botanical.html' };
  var requested = params.get('layout');
  var layout = Object.prototype.hasOwnProperty.call(layouts, requested) ? requested : 'classic';
  var product = params.get('product') === 'detox' ? 'detox' : 'slim';
  var payment = params.get('payment') === 'bank' ? 'bank' : 'cod';
  var paymentLabels = { cod: 'Thanh toán khi nhận hàng (COD)', bank: 'Chuyển khoản ngân hàng' };
  var form = document.querySelector('[data-purchase-form]');
  document.body.dataset.purchaseLayout = layout;

  document.querySelectorAll('[data-purchase-layout]').forEach(function (link) {
    var url = new URL(link.href, window.location.href);
    url.searchParams.set('product', product);
    link.href = url.href;
    if (link.dataset.purchaseLayout === layout) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-product-back]').forEach(function (link) {
    var url = new URL(layouts[layout], window.location.href);
    url.searchParams.set('product', product);
    link.href = url.href;
  });
  document.querySelectorAll('[data-payment-label]').forEach(function (el) { el.textContent = paymentLabels[payment]; });
  document.title = (form ? 'Đặt hàng' : 'Đặt hàng thành công') + ' — ' + document.querySelector('[data-product-name]').textContent + ' · Mayqueen';
  if (!form) return;

  var province = form.elements.province;
  var ward = form.elements.ward;
  function fill(select, placeholder, items) {
    select.length = 0;
    select.add(new Option(placeholder, ''));
    items.forEach(function (item) { select.add(new Option(item.name, item.code)); });
  }
  function load(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error(url);
      return response.json();
    });
  }
  var wardsData;
  fill(province, 'Đang tải...', []);
  load('data/provinces.json').then(function (list) {
    fill(province, 'Chọn Tỉnh/Thành', list);
  }).catch(function () { fill(province, 'Không tải được danh sách — tải lại trang', []); });
  province.addEventListener('change', function () {
    var code = province.value;
    ward.setCustomValidity('');
    ward.removeAttribute('aria-invalid');
    ward.disabled = true;
    if (!code) return fill(ward, 'Chọn Tỉnh/Thành trước', []);
    fill(ward, 'Đang tải...', []);
    // wards.json (~230 KB) is fetched once, on the first province pick
    wardsData = wardsData || load('data/wards.json');
    return wardsData.then(function (all) {
      if (province.value !== code) return;
      fill(ward, 'Chọn Phường/Xã', all.filter(function (item) { return String(item.provinceCode) === code; }));
      ward.disabled = false;
    }).catch(function () {
      wardsData = null;
      if (province.value === code) fill(ward, 'Không tải được — chọn lại Tỉnh/Thành', []);
    });
  });
  form.addEventListener('change', function (event) {
    if (event.target.name !== 'payment') return;
    document.querySelectorAll('[data-payment-note]').forEach(function (note) { note.hidden = note.dataset.paymentNote !== event.target.value; });
  });

  function validate(field) {
    var value = field.value.trim();
    var message = '';
    if (field.name === 'fullname' && value.length < 2) message = 'Vui lòng nhập họ và tên.';
    if (field.name === 'phone' && !/^(?:\+84|0)[0-9]{9,10}$/.test(value.replace(/[\s().-]/g, ''))) message = 'Vui lòng nhập số điện thoại hợp lệ, bắt đầu bằng 0 hoặc +84.';
    if (field.name === 'province' && !value) message = 'Vui lòng chọn Tỉnh/Thành phố.';
    if (field.name === 'ward' && !value) message = 'Vui lòng chọn Phường/Xã.';
    if (field.name === 'address' && value.length < 5) message = 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).';
    field.setCustomValidity(message);
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function onEdit(event) {
    if (event.target.name && event.target.name !== 'payment') validate(event.target);
  }
  form.addEventListener('input', onEdit);
  form.addEventListener('change', onEdit);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    form.querySelectorAll('input:not([type=radio]), select').forEach(validate);
    if (!form.reportValidity()) return;
    // shortcut: mock purchase only; connect an order API before accepting real orders.
    var url = new URL('success.html', window.location.href);
    url.searchParams.set('layout', layout);
    url.searchParams.set('product', product);
    url.searchParams.set('payment', form.elements.payment.value === 'bank' ? 'bank' : 'cod');
    window.location.assign(url.href);
  });
  document.querySelector('[data-purchase-submit]').disabled = false;
})();
