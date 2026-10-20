# Mayqueen: Kobler-style landing page, 2 variants

Date: 2026-10-20

## Intent

The client (Mayqueen, a slimming supplement brand: Mayqueen Slim + Yo Detox Extra) wants its site redone in the style of https://kobler.com.vn/. The things they like about it: the section order, a styling that feels professional and luxurious, big full-screen sections, and light scroll motion.

We deliver two sibling variants so the client can pick one. The two share structure, content and theme color. They differ in exact shades, icons, button style and section size. They must read as two takes on one direction, not two unrelated sites.

## Client brief (translated)

- Opening: a TVC-style video, maybe a before/after (a heavy person becoming slim), can be AI-generated.
- Kobler's "Kiến trúc Pháp" section becomes the **brand story**.
- Kobler's "8 lớp kiến tạo" section becomes **product ingredients**.
- Kobler's "Niềm tin tạo nên lựa chọn" section becomes **certifications**.
- Kobler's "Công trình tiêu biểu" section becomes **customer feedback**.
- The last section is **company info**.

## Goals

- Two single-page sites, `demo-4/` (Variant A) and `demo-5/` (Variant B), beside the existing `demo-1..3`.
- Section order and layout follow Kobler's homepage. Each section fills the screen or close to it.
- A luxury, professional feel: serif display headings, gold accents on Mayqueen green, generous whitespace.
- Light scroll motion: elements fade or slide in once as they enter view.
- Hub `index.html` gets two new cards linking to demo-4 and demo-5.

## Non-goals

- No about, contact, policy or cart pages. Each variant is one `index.html`.
- No Vietnamese/English language switch. The page is Vietnamese only.
- Kobler's "Công cụ chọn sàn" (floor selector tool) and the service strip above its footer are dropped. The client did not mention them.
- No real video and no real before/after photos. We have none, and we cannot generate AI video.
- No build step, framework or npm dependencies.

## Anti-goals (failure even if it works)

- Variants so different they look like two unrelated sites, or so similar the client cannot tell them apart.
- Anything that looks cheap: crowded sections, small headings, loud colors, heavy animation.
- Monospace fonts anywhere. The user has rejected them in Mayqueen demos before.
- Kobler branding, images or copy left on the page.

## Constraints

- Same stack as `demo-1..3`: plain HTML, one `style.css`, one `main.js` (vanilla JS, IIFE style, see `demo-1/main.js`) per folder.
- Fonts from Google Fonts with the Vietnamese subset: **Cormorant Garamond** (display headings, like Kobler) and **Be Vietnam Pro** (body).
- Images reuse `../product-images/prod*.webp` and `../others/*`. No external image hosts.
- Must work on mobile (≥ 360px wide) with no horizontal scroll. The full-screen sections may grow taller than the viewport on mobile.
- Respect `prefers-reduced-motion`: no motion, content shown at once. Follow the reveal pattern already in `demo-1/main.js:373-383`.
- Content is reused from `demo-1..3` (user decision). Keep the "(demo)" markers that the existing copy has on unverifiable claims (e.g. "Đạt chuẩn GMP (demo)", "Công ty BOT Việt Nam (demo)").

## Page structure (both variants)

Reference: Kobler screenshot taken 2026-10-20; approved wireframes `page-flow.html` and `hero-v2.html` in `.superpowers/brainstorm/` (local only).

### 0. Header (overlaid on hero)

- Transparent over the hero. Links on the left, MAYQUEEN wordmark centered, links on the right (Kobler layout).
- Links are in-page anchors: Câu chuyện, Thành phần, Chứng nhận, Đánh giá, Liên hệ. There is no "Mua ngay" or cart. Like Kobler's homepage, the page sells through enquiry, not checkout (user: "follow what the ref site do").
- Floating contact buttons fixed on the right edge, as on Kobler: a phone button (`tel:` hotline from demo-3) and a chat button (Zalo/Messenger link, `#` placeholder). These are the buying path.
- Turns solid (variant's dark color) once the user scrolls past the hero top.
- Mobile: wordmark plus hamburger. The menu must not overflow the left edge (see commit `ac7e24c`, the demo-2 fix).

### 1. Hero: full-screen TVC slot

- 100vh, full-bleed. Text overlaid on the left over a dark left-to-right gradient: title "MAYQUEEN SLIM", subtitle "GIẢM CÂN LÀNH MẠNH · THẢI ĐỘC TOÀN DIỆN", italic gold tagline "“Chọn sống khỏe. Chọn yêu mình.”", and two text-link CTAs with a small arrow, like Kobler's "Khám phá Versailles 10 · Dành cho KTS": "Khám phá Mayqueen Slim" → `#thanh-phan` and "Nhận tư vấn" → `#lien-he`.
- **Video slot:** a `<video autoplay muted loop playsinline>` element with an empty/commented `src`. When a video source is present, the video covers the hero (`object-fit: cover`) and mute/play toggle icons appear at the bottom center.
- **Fallback while there is no video:** a full-screen before/after slider. Two layers ("TRƯỚC" / "SAU 30 NGÀY") with a draggable gold divider and round knob. Pointer and touch drag, plus keyboard (arrow keys on the knob, which is focusable, `role="slider"` with aria values).
- Before/after imagery: SVG silhouette placeholders (heavier vs slimmer figure) on dark green, with a small caption "Ảnh minh họa — sẽ thay bằng hình AI". This is my call, since there are no real photos.
- Swapping in the real TVC must mean setting one `src` (document this in an HTML comment). The slider hides when the video has a source.

### 2. Brand story (Kobler "Kiến trúc Pháp")

- Dark section. Text block on the left over a mood image or gradient that fills the right side.
- Two-line heading: "CÂU CHUYỆN / MAYQUEEN" (second line gold), a short paragraph, then a 2×2 grid of value points, each with a gold label and one line of text. Values come from demo-1's feature row: Thông tin minh bạch, Thói quen lành mạnh, Đồng hành mỗi ngày, Giao nhanh toàn quốc.
- Paragraph copy comes from `demo-*/about.html`.
- One outline CTA, mirroring Kobler's "Nhận mẫu Versailles 10": "Nhận tư vấn miễn phí" → `#lien-he`.

### 3. Ingredients + 30-day roadmap (Kobler "8 lớp kiến tạo" + "Công nghệ")

- Light (cream) section split in two columns with a thin divider, like Kobler.
- Left: heading "BÊN TRONG / SẢN PHẨM", two small tabs (Mayqueen Slim | Yo Detox Extra), and per tab a product image (`prod*.webp`) plus a numbered list of that product's ingredients with a one-line benefit each. Source: demo-1 "Khoa học đằng sau Mayqueen" tabs (`demo-1/index.html:220-250`). Ingredients must stay with their own product: Slim is the capsule, Yo Detox is the drink. Never merge the lists. *(My call, after the review found the products' ingredients differ.)*
- Right: heading "LỘ TRÌNH / 30 NGÀY" and a horizontal card carousel (prev/next arrows) of the 4 phases from demo-2 (Làm quen, Ổn định cơn thèm, Nhẹ nhõm hơn, Thói quen mới). Image cards with text overlaid, like Kobler's "Công nghệ" cards.
- Mobile: columns stack, and the carousel becomes swipeable (CSS scroll-snap).

### 4. Certifications (Kobler "Niềm tin tạo nên lựa chọn")

- Dark section with a centered heading "CHẤT LƯỢNG / KIỂM CHỨNG".
- Three framed cards in a row, each with a header bar, an icon or emblem, short text and a small link-style CTA. Source: demo-2 "Chất lượng bạn có thể kiểm chứng": Đạt chuẩn GMP (demo), Kiểm nghiệm định kỳ, Không chất cấm, Hoàn tiền nếu không hài lòng. Show 3 or 4 depending on fit.

### 5. Feedback (Kobler "Công trình tiêu biểu")

- Light section, centered heading "SỐNG ĐẸP CÙNG MAYQUEEN" plus a one-line subtitle.
- A carousel of 3 visible cards on desktop (1 on mobile), each with a photo area on top and the quote, name and location below. Arrows at the sides, dots below. Source: the existing testimonials in demo-2/demo-3 only. Do not invent new quotes. Where the same name has conflicting details, keep the demo-3 version. *(My call: there are only ~5 testimonials, so 3 visible keeps the carousel meaningful.)*
- Photos: reuse the product and `others/` images, or an initials avatar. No stock faces of real people.

### 6. Company info (Kobler footer)

- Darkest band. Wordmark on the left, a contact block (Công ty BOT Việt Nam (demo), hotline, email, address taken from demo-3's footer/contact), social icons, and a bottom row with copyright and policy links (links can point to `../demo-3/policy.html` or `#`).

## Variants

Both use the same HTML structure and the same section content. They differ only in CSS tokens and a few markup details (icon and button markup). Approved mockup: `variants.html`.

| | A · Đêm Ngọc (`demo-4`) | B · Rừng Sáng (`demo-5`) |
|---|---|---|
| Feel | Closest to Kobler. Dark, glassy | Lighter, editorial. More cream |
| Base dark | `#08150f` near-black green | `#1f4d36` brand green |
| Secondary | `#173b29` | `#2c6448` |
| Gold | `#d4b26a` | `#a8873f` (deeper, works on cream) |
| Light | `#efe9da` | `#f4f0e6` |
| Dark/light sections | Mostly dark. Ingredients and feedback light | Hero, certifications, footer dark. Brand story light |
| Buttons | Gold outline pill, uppercase tracked, small circled arrow | Solid green square (2px radius), gold bottom border, plain arrow |
| Icons | Thin line icons inside gold rings | Filled icons in square green tiles, gold glyph |
| Cards | Rounded 14px, translucent, thin gold border | Sharp 2px, white, gold top rule, soft shadow |
| Section size | Every section `min-height: 100vh`, 1440px container | Hero 100vh, others ~80vh, 1200px container |
| Motion | Slow fade-up (≈800ms) | Slide-in from the side (≈600ms) |

Gold on cream must pass WCAG AA for text (≥ 4.5:1) or be used only for large headings and decoration. Adjust the shade if it fails.

## Hub

Add two cards to the root `index.html` grid, after Demo 03, in the same markup as the existing cards: "Demo 04 · Đêm Ngọc" and "Demo 05 · Rừng Sáng", each with a one-line Vietnamese description and a `product-images` thumbnail. Update the intro paragraph: it says "3 bản demo" and that each demo has a cart, about, contact and policy page, which is no longer true for 04/05.

## Left to the builder

- Exact copy edits so reused text fits the new layouts.
- Icon set (inline SVG, no icon font dependency), the silhouette SVG drawings, and image choice per section.
- Whether A and B share one CSS file with token overrides or have two full files. Default: copy and modify, matching how demo-1..3 are independent.
- Breakpoints, exact spacing, and carousel implementation (scroll-snap plus small JS for arrows/dots is enough).
