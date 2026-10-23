/* Run with node demo-5/checkout.check.cjs. No browser or dependencies needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const checkout = fs.readFileSync(__dirname + '/checkout.js', 'utf8');
const product = fs.readFileSync(__dirname + '/product.js', 'utf8');

async function page(search, success = false) {
  const handlers = {};
  const fields = ['fullname', 'phone', 'province', 'ward', 'address'].map((name) => ({
    name, value: '', error: '', attrs: {}, options: [], handlers: {}, disabled: name === 'ward',
    set length(count) { this.options.length = count; },
    add(option) { this.options.push(option); },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    setCustomValidity(message) { this.error = message; },
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; }
  }));
  const payment = { value: 'cod' };
  const form = {
    elements: { ...Object.fromEntries(fields.map((field) => [field.name, field])), payment },
    addEventListener(type, handler) { (handlers[type] = handlers[type] || []).push(handler); },
    querySelectorAll() { return fields; },
    reportValidity() { return fields.every((field) => !field.error); }
  };
  const links = ['classic', 'editorial', 'sheet'].map((layout) => ({
    href: (success ? 'success.html' : 'checkout.html') + '?layout=' + layout,
    dataset: { purchaseLayout: layout }, attrs: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; }
  }));
  const summaries = {
    name: [{ textContent: '' }, { textContent: '' }],
    pack: [{ textContent: '' }], payment: [{ textContent: '' }], price: [{ textContent: '' }, { textContent: '' }]
  };
  const images = [{ src: '', alt: '' }, { src: '', alt: '' }];
  const back = { href: '' };
  const submit = { disabled: true };
  let destination;
  const document = {
    title: '', body: { dataset: {} },
    querySelector(selector) {
      if (selector === '[data-purchase-form]') return success ? null : form;
      if (selector === '[data-purchase-submit]') return submit;
      if (selector === '[data-product-name]') return summaries.name[0];
      if (selector === 'meta[name="description"]') return { content: '' };
      if (selector === '[data-product-image]') return images[0];
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-purchase-layout]') return links;
      if (selector === '[data-product-back]') return [back];
      if (selector === '[data-product-image]') return images;
      if (selector === '[data-payment-label]') return summaries.payment;
      const match = selector.match(/^\[data-product-(name|pack|price)\]$/);
      return match ? summaries[match[1]] : [];
    }
  };
  const location = {
    search, href: 'https://example.test/demo-5/' + (success ? 'success.html' : 'checkout.html') + search,
    assign(url) { destination = String(url); }
  };
  const context = vm.createContext({ document, window: { location }, URL, URLSearchParams, Option: function (text, value) { return { text, value: String(value) }; }, fetch: async (url) => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(__dirname + '/' + url, 'utf8')) }) });
  vm.runInContext(product, context);
  vm.runInContext(checkout, context);
  await new Promise((resolve) => setTimeout(resolve, 5));
  return { document, fields, form, links, summaries, images, back, submit, payment,
    submitForm() { handlers.submit.forEach((handler) => handler({ preventDefault() {} })); return destination; },
    input(field) { handlers.input.forEach((handler) => handler({ target: field })); },
    choose(province) { return province.handlers.change(); }
  };
}

(async () => {
for (const layout of ['classic', 'editorial', 'sheet']) {
  for (const type of ['slim', 'detox']) {
    const current = await page('?layout=' + layout + '&product=' + type);
    assert.equal(current.document.body.dataset.purchaseLayout, layout);
    assert.equal(current.submit.disabled, false);
    assert.equal(current.summaries.price[0].textContent, type === 'slim' ? '550.000đ' : '390.000đ');
    assert(current.images.every((img) => img.src.endsWith(type === 'slim' ? 'prod2.webp' : 'prod5.webp')));
    for (const link of current.links) assert.equal(new URL(link.href).searchParams.get('product'), type);
    assert.equal(current.submitForm(), undefined, 'Empty fields must not navigate');
    current.fields[0].value = '  ';
    current.fields[1].value = '0900abc123';
    current.fields[4].value = '     ';
    assert.equal(current.submitForm(), undefined, 'Invalid fields must not navigate');
    const [, , province, ward] = current.fields;
    assert(province.options.length > 3, 'Provinces are listed');
    assert.equal(ward.disabled, true);
    assert(province.options.some((option) => option.text === 'Thành phố Hồ Chí Minh'), 'Real province list is loaded');
    current.fields[0].value = 'Nguyễn An';
    current.fields[1].value = '+84 (901) 234-567';
    current.fields[4].value = '123 Nguyễn Trãi';
    current.input(current.fields[1]);
    assert.equal(current.fields[1].error, '');
    assert.equal(current.submitForm(), undefined, 'Missing province/ward must not navigate');
    province.value = province.options.find((option) => option.text === 'Thành phố Hồ Chí Minh').value;
    await current.choose(province);
    assert.equal(ward.disabled, false);
    assert(ward.options.length > 20 && ward.options.slice(1).every((option) => option.text), 'Wards follow the province');
    const hcmWards = ward.options.length;
    province.value = province.options.find((option) => option.text === 'Thành phố Hà Nội').value;
    await current.choose(province);
    assert.notEqual(ward.options.length, hcmWards, 'Wards change with the province');
    province.value = province.options.find((option) => option.text === 'Thành phố Hồ Chí Minh').value;
    await current.choose(province);
    assert.equal(current.submitForm(), undefined, 'Missing ward must not navigate');
    ward.value = ward.options[1].value;
    current.payment.value = type === 'slim' ? 'bank' : 'cod';
    const target = new URL(current.submitForm());
    assert(target.pathname.endsWith('/success.html'));
    assert.deepEqual([...target.searchParams.keys()].sort(), ['layout', 'payment', 'product']);
    assert.equal(target.searchParams.get('layout'), layout);
    assert.equal(target.searchParams.get('product'), type);
    assert.equal(target.searchParams.get('payment'), type === 'slim' ? 'bank' : 'cod');
    assert(!target.href.includes('Nguy') && !decodeURIComponent(target.href).includes(ward.options[1].text));
    const done = await page(target.search, true);
    assert.equal(done.document.body.dataset.purchaseLayout, layout);
    assert.equal(done.summaries.name[0].textContent, current.summaries.name[0].textContent);
    assert.equal(done.summaries.payment[0].textContent, type === 'slim' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)');
    assert.equal(new URL(done.back.href).searchParams.get('product'), type);
  }
}
const fallback = await page('?layout=%3Cscript%3E&product=unknown');
assert.equal(fallback.document.body.dataset.purchaseLayout, 'classic');
assert.equal(fallback.summaries.name[0].textContent, 'Mayqueen Slim');
})().then(() => console.log('Checkout self-check passed: 3 layouts × 2 products, validation, success, safe fallback and no personal data in URLs.'), (error) => { console.error(error); process.exit(1); });
