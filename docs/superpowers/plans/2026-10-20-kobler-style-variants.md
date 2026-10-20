# Mayqueen Kobler-style Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two sibling single-page landing sites, `demo-4/` (A · Đêm Ngọc) and `demo-5/` (B · Rừng Sáng), that follow kobler.com.vn's homepage order and feel, using Mayqueen content. Then link both from the hub.

**Architecture:** Each variant is an independent folder (`index.html`, `style.css`, `main.js`), matching demo-1..3. Build demo-4 fully first. Then copy it to demo-5 and modify only tokens, button/icon/card markup and section sizing. JS behavior is identical in both. It is driven by `data-*` hooks, so demo-5 reuses `main.js` unchanged except motion class names, if any.

**Tech Stack:** Plain HTML5, CSS (custom properties), vanilla JS (IIFE, `'use strict'`, `var` style as in `demo-1/main.js`). Google Fonts: Cormorant Garamond + Be Vietnam Pro (`&subset=vietnamese`). No build, no npm.

**Spec:** `docs/superpowers/specs/2026-10-20-kobler-style-variants-design.md`. Read it fully before Task 1. Section layouts, variant tokens table and content sources live there and are not repeated here.

## Global Constraints

- Vietnamese only, `<html lang="vi">`. One `index.html` per variant. No cart, no "Mua ngay".
- No monospace fonts anywhere. Headings `'Cormorant Garamond', Georgia, serif`. Body `'Be Vietnam Pro', system-ui, sans-serif`.
- Images only from `../product-images/*.webp` and `../others/*`. No external image hosts, no stock faces.
- Icons are inline SVG. No icon font or icon library.
- Reused copy keeps its "(demo)" markers. Do not invent testimonials. Use demo-3's 4 quotes (Thu Hà, Minh Anh, Ngọc Trâm, Lan Phương, `demo-3/index.html:407-430`). Add the demo-2 quote at `demo-2/index.html:619` only if its name is not one of those 4.
- Footer must carry the supplement disclaimer verbatim: "Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh." (`demo-3/index.html`, footer legal).
- Contact data: Công ty BOT Việt Nam (demo) · 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh · `tel:19006868` · `mailto:hello@mayqueen.vn` (`demo-3/index.html:570-575`).
- Section anchor ids (both variants): `#trang-chu` (hero), `#cau-chuyen`, `#thanh-phan`, `#chung-nhan`, `#danh-gia`, `#lien-he`.
- `prefers-reduced-motion: reduce` means no reveal motion, all content visible at once.
- No horizontal scroll at 360px width.
- Gold text on cream must reach WCAG AA 4.5:1. Otherwise use gold only for large headings and decoration, or darken the shade.
- Verification per user rules: there is no lint/type tooling for this static repo. Checks are Chrome DevTools MCP `evaluate_script` assertions on the page opened via `file:///C:/Users/AndersonHo/desktop/mine/outsource/mayqueen/demo-N/index.html`. No build step.
- Commits: only when the user has said to commit. Otherwise, at each "Commit" step, stage nothing and note the step in `SESSION_STATE.md` Active Diffs.

## Review Focus

1. **Hero with no video source:** slider visible and draggable, mute/play controls hidden. With `src` set, the video covers the hero and the slider is hidden. Pinned in Task 2 check `heroVideoToggle`.
2. **Touch and keyboard on the before/after knob:** dragging on a phone must not scroll the page sideways, and arrow keys must move the divider. Pinned in Task 2 check `sliderKeyboard`, plus `touch-action: pan-y` on the slider.
3. **Mobile menu at 360px:** opening it must not overflow the left edge (regression of commit `ac7e24c`). Pinned in Task 1 check `noOverflow360` with the menu open.
4. **Reduced motion:** `.reveal` content must never stay invisible. Pinned in Task 2 check `reducedMotion`.
5. **Carousel ends:** prev on the first card and next on the last must not break or show empty space. Disable the button or stop at the end. Pinned in Task 2 check `carouselBounds`.

---

### Task 1: demo-4 markup + Variant A styles (static)

**Files:**
- Create: `demo-4/index.html`
- Create: `demo-4/style.css`

**Interfaces:**
- Produces (JS hooks Task 2 relies on, exact names):
  - `<header class="site-header" data-header>`; mobile toggle `<button data-nav-toggle aria-expanded="false" aria-controls="site-nav">`; nav `<nav id="site-nav">`. Header gets class `is-solid` once scrolled (Task 2). CSS must style `.site-header.is-solid` and `.site-header.nav-open`.
  - Hero `<section id="trang-chu" class="hero" data-hero>` containing:
    - `<video class="hero__video" data-hero-video autoplay muted loop playsinline preload="none">` with an HTML comment above it: `<!-- TVC: đặt src="../path/tvc.mp4" vào <source> bên dưới; slider sẽ tự ẩn -->` and an empty `<source type="video/mp4">`.
    - `<div class="ba" data-ba style="--pos:50%">` with `.ba__before`, `.ba__after` (clipped by `--pos`), and a knob `<div class="ba__knob" data-ba-knob role="slider" tabindex="0" aria-label="So sánh trước và sau" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">`. Before/after content: inline SVG silhouettes plus the caption "Ảnh minh họa — sẽ thay bằng hình AI".
    - `<div class="hero__ctrl" data-hero-ctrl hidden>` with `<button data-video-mute>` and `<button data-video-play>`.
  - Ingredient tabs: `<div data-tabs>` with `role="tablist"`, buttons `role="tab"` (`#tab-slim`, `#tab-detox`), panels `role="tabpanel"` (`#panel-slim`, `#panel-detox`, second one `hidden`). Same ARIA pattern as `demo-1/index.html:214-215`.
  - Carousels (roadmap and feedback): `<div class="carousel" data-carousel>` → `.carousel__track` (overflow-x auto, `scroll-snap-type: x mandatory`) of `.carousel__item`, plus `<button data-prev>`, `<button data-next>`, and an optional `<div data-dots>` (feedback only).
  - Reveal targets: class `reveal`. Visible state class `is-in`.
  - Floating contact: `<div class="float-contact">` with `<a href="tel:19006868" aria-label="Gọi hotline">` and `<a href="#" aria-label="Chat Zalo">`.

- [ ] **Step 1: Write `demo-4/index.html`.** Sections in the spec order 0–6, with copy from the sources the spec names. Ingredients come from `demo-1/index.html:209-250`, both tabs, never merged. Roadmap is the 4 phases at `demo-2/index.html:197-230`. Certifications come from `demo-2/index.html:494-516`. Brand story copy comes from `demo-1/about.html:64-68`, values from `demo-1/index.html:78-90`. Header: links left (Câu chuyện, Thành phần, Chứng nhận), wordmark centered, links right (Đánh giá, Liên hệ). Hero CTAs: text links "Khám phá Mayqueen Slim" → `#thanh-phan` and "Nhận tư vấn" → `#lien-he`. Brand story CTA: "Nhận tư vấn miễn phí" → `#lien-he`.
- [ ] **Step 2: Write `demo-4/style.css` with Variant A tokens on `:root`.** Values: `--dark:#08150f; --dark-2:#173b29; --gold:#d4b26a; --light:#efe9da; --container:1440px; --radius-card:14px`. Every `section` gets `min-height:100vh` (desktop ≥ 1024px; `auto` below). Buttons are gold outline pills with a circled arrow. Icons are thin line SVGs in gold rings. Cards are translucent with a 1px gold border. Dark/light sections follow the spec's variant table. Reveal: `.reveal{opacity:0;transform:translateY(24px);transition:.8s}` `.reveal.is-in{opacity:1;transform:none}`, wrapped in `@media (prefers-reduced-motion: no-preference)`.
- [ ] **Step 3: Static checks.** Open the page in Chrome DevTools MCP and run each check below with `evaluate_script` at 1440×900, then at 360×800.
  - `sectionsOrder`: `[...document.querySelectorAll('main > section')].map(s=>s.id)` deep-equals `['trang-chu','cau-chuyen','thanh-phan','chung-nhan','danh-gia']`, and `footer#lien-he` exists.
  - `noMono`: no element's computed `fontFamily` matches `/mono|courier|consolas/i`.
  - `noOverflow360` (at 360, run once normally and once with `.site-header` given class `nav-open`): `document.documentElement.scrollWidth <= innerWidth`, and every element inside `#site-nav` has `getBoundingClientRect().left >= 0`.
  - `disclaimer`: `document.body.innerText.includes('Thực phẩm này không phải là thuốc')`.
  - `noBuy`: `!/mua ngay/i.test(document.body.innerText)`.
  - Screenshot each section at 1440 and compare by eye with the Kobler reference (`scratchpad/kobler-full.jpeg`) and the approved `variants.html` A card.
  Expected: all checks return `true`.
- [ ] **Step 4: Commit** (see Global Constraints): `feat(demo-4): Kobler-style layout, variant A`.

### Task 2: demo-4 interactions (`main.js`)

**Files:**
- Create: `demo-4/main.js` (loaded with `<script src="main.js" defer>`)

**Interfaces:**
- Consumes: every hook in Task 1's Produces block.
- Produces: no globals. One IIFE. demo-5 copies this file unchanged.

- [ ] **Step 1: Implement these units in one IIFE in `demo-4/main.js`**, in this order, each guarded by `if (!el) return`:
  - `header()`: toggles `is-solid` on `[data-header]` when `scrollY > 40`, using a passive scroll listener. `[data-nav-toggle]` toggles `nav-open` and `aria-expanded`. Clicking a nav link closes the menu.
  - `heroVideo()`: if `[data-hero-video] source[src]` has a non-empty src, add `has-video` to `[data-hero]`, call `video.load()`, set `hidden` on `[data-ba]`, and unhide `[data-hero-ctrl]`. The mute/play buttons toggle `video.muted` and `play()`/`pause()`, and update their `aria-pressed`.
  - `beforeAfter()`: pointer events on `[data-ba]` (`setPointerCapture`) set the `--pos` percentage from `clientX`. Keyboard on `[data-ba-knob]`: ArrowLeft/ArrowRight ±5, Home 0, End 100. Every change updates `aria-valuenow`. Clamp to 0–100. CSS on `.ba`: `touch-action: pan-y`.
  - `tabs()`: same behavior as demo-1's tab script (`demo-1/main.js`; find it with `role="tab"`): click and ArrowLeft/ArrowRight, with `aria-selected`, `tabindex`, and `hidden` on panels.
  - `carousels()`: for each `[data-carousel]`, prev/next call `track.scrollBy({left: ±itemWidth, behavior})`. Set `behavior` to `'instant'` when reduced motion is on (`'auto'` would defer to the track's CSS `scroll-behavior: smooth`). Update `disabled` on prev at the start and on next at the end (with a 2px tolerance). Build dots in `[data-dots]`, one per page, and sync the active dot on `scroll`.
  - `reveal()`: copy the pattern at `demo-1/main.js:373-383`, but use class `is-in`. With no `IntersectionObserver` or with reduced motion, add `is-in` to all elements immediately.
- [ ] **Step 2: Interaction checks** via `evaluate_script` on demo-4 at 1440×900:
  - `headerSolid`: `scrollTo(0,600)`, wait 100ms, then `[data-header]` has `is-solid`. `scrollTo(0,0)`, then it does not.
  - `heroVideoToggle`: initially `[data-ba]` is not hidden and `[data-hero-ctrl]` is hidden. Then set a fake src on the source and re-run the logic by reloading with the src edited temporarily in the file: `[data-ba]` is hidden, `[data-hero-ctrl]` is visible, and `[data-hero]` has `has-video`. Revert the src afterwards.
  - `sliderKeyboard`: focus `[data-ba-knob]`, dispatch ArrowRight twice, then `aria-valuenow === '60'` and `[data-ba]` style `--pos` is `60%`. Dispatching End gives `'100'`. Dispatching ArrowRight again stays `'100'`.
  - `tabsWork`: click `#tab-detox`, then `#panel-detox` is not hidden, `#panel-slim` is hidden, and `#tab-detox` has `aria-selected="true"`.
  - `carouselBounds`: for each `[data-carousel]`, initially `[data-prev].disabled === true`. Click next until it is disabled (at most 10 clicks, 400ms apart), then `track.scrollLeft + track.clientWidth >= track.scrollWidth - 2`.
  - `reducedMotion`: emulate `prefers-reduced-motion: reduce` (DevTools `emulate`), reload, then every `.reveal` has `is-in` without scrolling.
  - `noConsoleErrors`: `list_console_messages` shows no errors.
  Expected: all `true`.
- [ ] **Step 3: Commit:** `feat(demo-4): hero slider, tabs, carousels, reveal`.

### Task 3: demo-5 (Variant B) from demo-4

**Files:**
- Create (copy first, per user rule): `demo-5/index.html`, `demo-5/style.css`, `demo-5/main.js` via `cp demo-4/* demo-5/`
- Modify: `demo-5/index.html`, `demo-5/style.css`

**Interfaces:**
- Consumes: all Task 1 hooks and the Task 2 `main.js` unchanged. Do not rename any `data-*` hook, id or `reveal`/`is-in` class.

- [ ] **Step 1: Copy:** `mkdir demo-5 && cp demo-4/index.html demo-4/style.css demo-4/main.js demo-5/`.
- [ ] **Step 2: Retoken `demo-5/style.css`.** Values: `--dark:#1f4d36; --dark-2:#2c6448; --gold:#a8873f; --light:#f4f0e6; --container:1200px; --radius-card:2px`. Hero `min-height:100vh`, other sections `min-height:80vh`. Buttons: solid `--dark` fill, 2px radius, 2px gold bottom border, plain `→`. Icons: filled glyphs in square `--dark` tiles with gold fill. Cards: white, 3px gold top rule, shadow `0 6px 18px rgba(19,38,27,.08)`. Brand story becomes a light section (spec table). Reveal motion: `translateX(-32px)` at `.6s` instead of fade-up.
- [ ] **Step 3: Adjust `demo-5/index.html` markup only where the button and icon style needs it:** the circled-arrow span becomes a plain arrow, and ring icons become tile icons. Update `<title>` and the meta description to say "Rừng Sáng". All copy and section content stay identical to demo-4.
- [ ] **Step 4: Checks:** re-run every Task 1 Step 3 and Task 2 Step 2 check against demo-5. Add:
  - `goldContrast`: compute the contrast of `--gold` text on the cream sections (`#f4f0e6`) wherever gold is body-size text (< 24px). The ratio must be ≥ 4.5. If it fails, darken the gold used for small text, e.g. a `--gold-text` token, and re-check. Do the same for demo-4's gold on its light sections.
  - `siblingCheck`: screenshots of both variants at 1440, same sections side by side. They must be clearly different in shade, buttons, icons and section height, but recognisably the same layout.
  Expected: all `true`. Screenshots reviewed.
- [ ] **Step 5: Commit:** `feat(demo-5): variant B from demo-4`.

### Task 4: Hub cards

**Files:**
- Modify: `index.html:71` (intro paragraph) and `index.html:74-104` (grid, append after the Demo 03 card)

- [ ] **Step 1:** Append two `<a class="card">` blocks copying the Demo 03 card markup exactly:
  - "Demo 04", `<h2>Đêm Ngọc</h2>`, `href="demo-4/index.html"`, thumb `product-images/prod.webp`.
  - "Demo 05", `<h2>Rừng Sáng</h2>`, `href="demo-5/index.html"`, thumb `product-images/prod4.webp`.
  Each gets a one-sentence Vietnamese description matching the spec's variant "Feel" row. Each thumbnail gets real alt text describing the image.
- [ ] **Step 2:** Rewrite the intro so it no longer claims 3 demos or claims every demo has cart/about/contact/policy pages. Suggested wording: "5 bản demo giao diện website cho Mayqueen Slim & Yo Detox Extra. Demo 01–03 gồm đầy đủ các trang; Demo 04–05 là trang chủ phong cách sang trọng, toàn màn hình."
- [ ] **Step 3: Checks** on the hub: `document.querySelectorAll('main .card').length === 5`, both new hrefs resolve (open each, check that the title loads), and `noOverflow360` passes.
- [ ] **Step 4: Commit:** `feat(hub): link demo-4 and demo-5`.

### Task 5: Final review

- [ ] **Step 1:** Run all checks once more on demo-4, demo-5 and the hub at 1440×900 and 360×800. Record the raw `evaluate_script` outputs in `SESSION_STATE.md` Verification Gates.
- [ ] **Step 2:** Dispatch one reviewer (superpowers:requesting-code-review) on the full diff, against the spec and this plan's Review Focus.
- [ ] **Step 3:** Stop the brainstorm server: `bash <brainstorming>/scripts/stop-server.sh .superpowers/brainstorm/34723-1792488512`.
