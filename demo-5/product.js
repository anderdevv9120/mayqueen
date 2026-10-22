/* All product layout proposals use the same content and gallery behavior. */
(function () {
  'use strict';

  var detox = new URLSearchParams(window.location.search).get('product') === 'detox';
  var name = detox ? 'Yo Detox Extra' : 'Mayqueen Slim';
  var images = detox ? ['prod5.webp', 'prod4.webp', 'prod.webp'] : ['prod2.webp', 'prod3.webp', 'prod.webp'];
  var fields = {
    name: name,
    tagline: detox ? 'Một nghi thức nhỏ. Một ngày nhẹ nhàng hơn.' : 'Mỗi ngày một bước nhỏ. Đến gần hơn với phiên bản bạn yêu.',
    description: detox ? 'Dạng bột pha uống, đồng hành cùng thói quen chăm sóc bản thân và lối sống cân bằng mỗi ngày.' : 'Đồng hành cùng hành trình chăm sóc vóc dáng, kết hợp chế độ ăn uống cân bằng và vận động phù hợp.',
    pack: detox ? 'Hộp 20 gói bột pha uống' : 'Lọ 30 viên nang',
    price: detox ? '390.000đ' : '550.000đ',
    ingredients: detox ? 'Chất xơ hòa tan (Inulin), diệp lục (Chlorophyll), men vi sinh (Probiotic), chiết xuất rau má.' : 'Chiết xuất trà xanh (EGCG), L-Carnitine, Garcinia cambogia (HCA), chiết xuất cà phê xanh.'
  };

  Object.keys(fields).forEach(function (key) {
    document.querySelectorAll('[data-product-' + key + ']').forEach(function (el) { el.textContent = fields[key]; });
  });
  document.querySelectorAll('[data-product-ingredient-list]').forEach(function (list) {
    list.innerHTML = fields.ingredients.replace(/\.$/, '').split(', ').map(function (item) { return '<li>' + item + '</li>'; }).join('');
  });
  var layout = document.querySelector('[data-layout-link][aria-current]');
  document.title = name + ' — Mayqueen · Bố cục ' + parseInt(layout.textContent, 10);
  document.querySelector('meta[name="description"]').content = fields.description;
  document.querySelectorAll('[data-layout-link]').forEach(function (link) {
    if (detox) link.search = '?product=detox';
  });

  var mainImage = document.querySelector('[data-product-image]');
  var thumbs = document.querySelectorAll('[data-product-thumb]');
  function select(index) {
    mainImage.src = '../product-images/' + images[index];
    mainImage.alt = name + ' — hình sản phẩm ' + (index + 1);
    thumbs.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === index)); });
  }
  thumbs.forEach(function (button, i) {
    button.querySelector('img').src = '../product-images/' + images[i];
    button.addEventListener('click', function () {
      // Crossfade via View Transitions; wait for decode so the new image is ready before the fade.
      var swap = function () { select(i); return mainImage.decode().catch(function () {}); };
      if (document.startViewTransition) document.startViewTransition(swap); else swap();
    });
  });
  select(0);
})();
