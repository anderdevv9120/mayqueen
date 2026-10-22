# Small Ecommerce Shop — Architecture & Planning Notes

**Discussion date:** October 22, 2026  
**Status:** Planning only — no code, infrastructure, or deployment has been implemented in this conversation.

## 1. Project goals

Build a simple ecommerce storefront for one shop, with a custom CMS for managing products. The technology choice is **Next.js**. The initial objective is a lean product catalog and admin experience; customer checkout and Vietnamese online payment support may be added later.

### Proposed phases

1. **MVP:** Product listing/detail pages, categories, protected admin CMS, image uploads.
2. **Ordering:** Shopping cart, guest checkout, customer details, orders, cash on delivery/manual bank transfer (if desired).
3. **Online payments:** Integrate a Vietnamese payment gateway such as payOS or VNPay, with secure payment verification and webhooks.
4. **Later enhancements:** Promotions, advanced inventory, analytics, shipping integration.

## 2. Infrastructure decision and alternatives

### Initial proposal

- **Frontend + CMS:** Next.js, initially considered for Vercel.
- **SQL database:** Cloudflare D1 (SQLite).
- **Product images / object storage:** Cloudflare R2.

### Hosting options discussed

| Option | Architecture | Tradeoff |
| --- | --- | --- |
| A — Vercel + Cloudflare | Next.js on Vercel; Cloudflare Worker API to D1/R2 | Conventional Next.js deployment; Vercel's Hobby plan is limited to non-commercial use, so a live commercial shop needs an eligible paid plan. |
| B — All Cloudflare | Next.js on Cloudflare Workers; D1 and R2 via native bindings | Less infrastructure separation and potentially low cost, but verify Next.js compatibility and Workers CPU limits. |

**Current preference explored:** Option B, all Cloudflare, with portability in mind. This is a recommendation, not a final committed deployment decision.

## 3. Free-tier considerations

Figures discussed as of October 2026; re-check provider documentation before launch.

| Resource | Cloudflare free tier (discussed) | Implication |
| --- | --- | --- |
| D1 storage | 5 GB total account allowance; **500 MB maximum per individual database** | For a single-shop database, plan around 500 MB, not 5 GB. |
| D1 reads | 5 million rows read/day | Rows scanned/read matter, not just HTTP request count. |
| D1 writes | 100,000 rows written/day | Suitable for an initially small catalog/order volume. |
| R2 storage | 10 GB-month Standard storage | Usually ample for optimized product imagery. |
| R2 Class A operations | 1 million/month | Includes many write/list operations. |
| R2 Class B operations | 10 million/month | Includes many read operations. |
| R2 egress | No egress charge | Useful for serving product photos; operation limits still apply. |
| Workers free requests | 100,000/day | Monitor traffic and API calls. |
| Workers free CPU | 10 ms per invocation | SSR or computationally heavy processing may need Workers Paid. |

Earlier comparison: Supabase Free offers PostgreSQL, integrated Auth, about 500 MB database space, and 1 GB file storage, but free projects may pause for inactivity. Cloudflare offers more generous image storage and egress, at the cost of more assembly and custom auth/integration work.

**Important:** R2 billing activation may require a payment method and usage exceeding free allowances may be billable. Cloudflare Workers Paid was discussed as a low-cost upgrade (~$5/month starting price, subject to current pricing).

Official references:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://supabase.com/pricing
- https://vercel.com/docs/plans/hobby

## 4. Next.js compatibility on Cloudflare

Two approaches discussed:

- **vinext:** Cloudflare's Next.js-on-Vite implementation, recommended by Cloudflare for new projects at the time of discussion; validate individual features and packages because exact parity is not guaranteed.
- **OpenNext:** Adapts standard Next.js builds to the Cloudflare Workers runtime; can be closer to the official Next.js build behavior in some areas.

Core functionality to test: App Router, Server Components, Route Handlers, Server Actions, SSR/SSG/ISR, authentication, image delivery, and deployment build.

Potential friction points: middleware/proxy differences, Node-dependent libraries, native image processing (e.g. `sharp`), auth SDKs, some payment SDKs, caching/image behavior, and newly released Next.js features.

**Decision principle:** Do not rely on Middleware/Proxy as the primary authentication control. Keep Cloudflare-specific bindings encapsulated so hosting can change later.

References:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://github.com/cloudflare/vinext

## 5. Suggested application architecture

```text
Browser
  |
  v
Next.js storefront + protected admin CMS
  |-- public product listing/detail pages
  |-- admin login and product management UI
  |-- route handlers / server actions
  |
  v
Application services / repository layer
  |-- D1 database adapter (Drizzle ORM)
  |-- R2 storage adapter
  |-- authentication/session service
  |-- future payment provider interface
  |
  +--> Cloudflare D1: products, categories, inventory, admins, sessions, orders
  +--> Cloudflare R2: product images and banners
  +--> (future) payOS / VNPay through HTTPS API and signed callbacks
```

For all-Cloudflare hosting, use D1/R2 bindings directly from server-side code; **a separate Hono Worker API is not necessary initially**. If Next.js is instead hosted on Vercel, use a secured Worker API or an appropriate remote D1 access adapter.

Suggested app tooling: Next.js App Router, Tailwind CSS, shadcn/ui, Drizzle ORM, Zod. Hono was considered for an optional standalone Worker API.

## 6. Data model (initial draft)

Potential tables:

```text
admins
admin_sessions
categories
products
product_variants
product_images
inventory
orders
order_items
customers
```

Start only with the tables the MVP actually needs. Customer accounts can be deferred; a protected admin and guest checkout are sufficient for early stages.

For future ordering:
- Save historical snapshots of purchased product names and prices in `order_items`.
- Store money in integer VND units rather than floating-point numbers.
- Recheck prices and availability server-side before placing an order.
- Use atomic stock updates / appropriate transactions to prevent overselling.
- Make payment callbacks idempotent and validate gateway signatures and transaction amounts.

## 7. Image storage plan

Save image binary data in R2 and only object keys / metadata in D1.

Example:

```text
R2 object keys:
products/123/main.webp
products/123/gallery-01.webp

D1 product_images:
id
product_id
object_key
sort_order
```

Serve public images via a dedicated domain such as `images.yourshop.com`, optionally using Cloudflare caching. The CMS must authorize uploads: generate appropriately scoped presigned URLs or proxy uploads through protected server code. Never expose R2 API credentials in the browser. Optimize product images to control storage/transfer volumes.

## 8. CMS authentication design

**Recommended approach:** Session-based administrator login with secure HTTP-only cookies, checks in server-side entry points, and no security dependency on Next.js Middleware/Proxy.

### Authentication flow

1. Admin submits email and password at `/admin/login`.
2. A Route Handler validates credentials (using a securely password-hashed record).
3. The server creates a cryptographically random session token.
4. Store only the **hash** of the session token in D1; return the raw token in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie with an appropriate expiry.
5. For each protected admin page, Server Action and Route Handler, verify the session with a central `requireAdmin()` / equivalent guard.
6. Logout invalidates the D1 session and clears the cookie.

### Example D1 tables

```sql
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_expires
ON admin_sessions(expires_at);
```

Use a maintained Workers-compatible auth library when feasible instead of building password hashing, login protection, and session management from scratch. Auth.js / an external provider / Cloudflare Access were considered as alternatives; exact library compatibility must be verified.

### Authorization boundaries

- CMS page / layout: check session and redirect unauthenticated visitors to login.
- **Every** product/order mutation and R2 upload endpoint: check auth independently; page or layout checks alone are insufficient.
- Validate inputs (e.g. Zod) and protect cookie-authenticated writes from CSRF, including origin verification for custom endpoints.
- Protect admin initialization: create the first admin through a secure seed/setup process, not an open public signup endpoint.
- Middleware/Proxy may provide early redirects based on cookie presence, but **cookie presence is not session validation**.

### Illustrative pseudocode

```ts
async function requireAdmin() {
  const token = await readHttpOnlySessionCookie();
  if (!token) throw new UnauthorizedError();

  const hash = await sha256(token); // appropriate for high-entropy session tokens only
  const session = await db.findValidSessionByHash(hash, Date.now());
  if (!session) throw new UnauthorizedError();

  return session.admin;
}
```

The pseudocode is conceptual, not a drop-in implementation. For admin passwords, use a suitable password-hashing algorithm (e.g. Argon2id where supported); never use plain SHA-256 for passwords.

## 9. Future Vietnamese online payments

Possible providers to evaluate: **payOS** and **VNPay**. Integration was discussed only at architecture level; neither provider has been selected or implemented.

Suggested flow:

```text
Checkout submission
  -> validate cart / product prices server-side
  -> create pending order in D1
  -> create gateway payment request
  -> redirect/display payment instructions
  -> receive signed payment webhook/callback
  -> verify signature, amount, order ID, status
  -> idempotently mark order paid and update downstream state
```

Use an abstraction such as `PaymentProvider` so payment selection does not affect storefront/CMS architecture. HTTPS requests and Web Crypto can often replace Node-specific payment SDK functionality if necessary; verify each provider's actual signing specification.

## 10. Recommended validation before committing to all-Cloudflare

- [ ] Scaffold Next.js and deploy a minimal app via vinext (and compare OpenNext if needed).
- [ ] Confirm the exact Next.js version, App Router behavior, and package compatibility.
- [ ] Test protected admin login/logout and session validation on Cloudflare Workers.
- [ ] Test D1 queries and migrations with Drizzle.
- [ ] Upload and display images through R2 using properly authorized flows.
- [ ] Test a public SSR page and a static/cached page; measure Worker CPU time.
- [ ] Test build/deploy, caching, environment bindings, and local development.
- [ ] Evaluate whether Workers Free limits suffice or Workers Paid is needed.
- [ ] Later: test payment webhooks and idempotency end-to-end in the deployed runtime.

## 11. Current conclusion

**Working recommendation:** Start with Next.js + Cloudflare Workers + D1 + R2 for the small-shop MVP, isolate infrastructure adapters, and perform early compatibility and performance smoke tests. Use a central server-side admin session guard; treat Middleware/Proxy as optional. Keep checkout and Vietnamese payment providers in the future plan rather than building them now.

**Not yet done:** No project has been scaffolded, no code has been committed, no D1/R2 resources have been provisioned, and no production compatibility test has been performed in this conversation.
