# ReviewTap — site setup

A site for selling ReviewTap NFC review stands, with checkout embedded
directly on the site (address form + card entry, powered by Stripe). Most
of it is a static HTML/CSS/JS site with no build step — the one exception
is a single serverless function that creates the Stripe charge, since that
step has to happen server-side (a customer's browser can't be trusted to
report its own price).

```
reviewtap/
├── site/                          ← deploy this folder as your site root
│   ├── index.html                 ← main sales page
│   ├── review.html                ← order summary (pack, color, total)
│   ├── checkout.html              ← address form + embedded Stripe card entry
│   ├── setup.html                 ← post-purchase setup guide
│   ├── thank-you.html             ← shown after payment succeeds or fails
│   ├── policies.html              ← shipping / returns / privacy / terms
│   ├── favicon.svg
│   └── assets/
│       ├── css/main.css
│       ├── js/main.js             ← EDIT THIS: prices, publishable key
│       └── fonts/                 ← self-hosted Oswald, Public Sans, Space Mono
├── netlify/functions/
│   └── create-payment-intent.js   ← EDIT THIS: creates the real Stripe charge
├── netlify.toml                   ← tells Netlify where the site + function live
├── package.json                   ← the "stripe" npm package the function needs
├── BUSINESS-PLAYBOOK.md           ← positioning, margins, outreach, launch checklist
└── README.md
```

## 1. Get your Stripe keys

Stripe gives you two keys (Dashboard → Developers → API keys):

- **Publishable key** (`pk_...`) — safe to expose in client-side code.
  Paste it into `stripePublishableKey` in
  [`site/assets/js/main.js`](site/assets/js/main.js).
- **Secret key** (`sk_...`) — must never appear in this repo or in any
  file that ends up in the browser. It only goes into your hosting
  provider's environment variables (step 3 below).

Use the **test** keys while you're setting this up (Stripe's dashboard has
a toggle for Test/Live mode) — test-mode card `4242 4242 4242 4242`, any
future expiry, any CVC, works without charging anything real. Switch to
live keys only once you're ready to accept real orders.

## 2. Keep prices in sync in two places

Because the charge amount is computed server-side (see below), the price a
customer *sees* and the price they *pay* live in two different files that
must agree:

| | Customer-facing display | What actually gets charged |
|---|---|---|
| File | `site/assets/js/main.js` | `netlify/functions/create-payment-intent.js` |
| Field | `colors[].unitPrice`, `shippingFlat`, `taxState`, `taxRate` | `UNIT_CENTS_BY_COLOR`, `SHIPPING_CENTS`, `TAX_STATE`, `TAX_RATE` |

If you change a price, change it in both files. The function is the one
that wins — if they disagree, the customer is charged whatever the
function says, so a stale number there is the one that actually matters.

**Tax:** the site charges a flat 10% on orders shipping to Illinois only
(no nexus registered elsewhere) — set in `TAX_STATE`/`TAX_RATE` in the
function. This is a simplification, not tax advice: IL's actual rate
varies by county/city (10% matches South Barrington specifically), and if
you register in other states later you'll need to add them here. Consider
Stripe Tax if you outgrow a flat rate.

## 3. Deploy somewhere that runs the function

This is the one hard requirement the embedded checkout adds: **your host
needs to run the serverless function**, not just serve static files. Plain
GitHub Pages (or any pure static host) can't do this anymore — the
function is what talks to Stripe with your secret key.

**Netlify (recommended — this repo is already set up for it)**
1. Push this repo to GitHub, then in [Netlify](https://app.netlify.com),
   **Add new site → Import an existing project**, and pick the repo.
   Netlify reads `netlify.toml` automatically and knows to publish `site/`
   and run `netlify/functions/`.
2. Go to **Site configuration → Environment variables** and add
   `STRIPE_SECRET_KEY` with your secret key from step 1.
3. Deploy. Your function is now live at
   `https://yoursite.netlify.app/.netlify/functions/create-payment-intent`
   — `checkout.html` already calls it at that path, nothing else to wire up.

(Vercel or Cloudflare Pages can also run this, but the function would need
to move into their specific folder convention — e.g. `api/` for Vercel —
and be adjusted to that platform's function signature. Netlify is the path
of least resistance since the repo is already configured for it.)

## 4. Preview locally

The pages themselves can be opened directly (`open site/index.html`), but
`checkout.html` won't be able to reach the function that way — a plain
file open has nothing at `/.netlify/functions/...` to call. To test the
full flow locally, use the Netlify CLI, which runs both the static site
and the function together:

```bash
npm install
npm install -g netlify-cli
netlify dev
```

This opens the site (usually `http://localhost:8888`) with the function
running alongside it, reading `STRIPE_SECRET_KEY` from a local `.env` file
if you add one (create `.env` with `STRIPE_SECRET_KEY=sk_test_...` — this
file should never be committed; add it to `.gitignore`).

## 5. How checkout flows

Clicking "Buy" on the pricing card doesn't charge anything directly — it's
a three-step handoff:

1. **`index.html`** — quantity input + color selector, links to
   `review.html` with the choice in the URL (`?qty=3&color=white`).
2. **`review.html`** — shows the order summary (quantity, color, subtotal,
   shipping, estimated total) with a "Continue to secure checkout" button.
   Tax isn't shown here yet since it depends on the shipping state, which
   isn't collected until the next step.
3. **`checkout.html`** — the real payment step, in two stages. First the
   customer fills in a plain HTML shipping address form (address fields
   aren't sensitive the way card numbers are, so that part doesn't need
   Stripe's iframe) and clicks "Continue to payment" — that's the point the
   state becomes known, so it's when the page calls the
   `create-payment-intent` function (passing `qty`, `color`, and `state` —
   never a price) to get back a `clientSecret` and the real tax-inclusive
   total. Then Stripe's Payment Element mounts to collect card details, and
   submitting calls `stripe.confirmPayment()`, which charges the card and
   redirects to `thank-you.html`.

The card number itself is typed into an iframe that Stripe controls
(`elements.create("payment")`) — this site's own JavaScript never has
access to it, which is what keeps this out of PCI-DSS scope on your end.

`thank-you.html` checks the `redirect_status` query param Stripe appends
on return and shows either the order-confirmed content or a
payment-didn't-go-through message with a link back to try again.

### Color choice (black / white)

The color picker's selection travels through the URL from page to page
(`?qty=...&color=...`) and ends up in the PaymentIntent's `metadata` field
(set server-side in the function) — visible on that payment's details page
in your Stripe Dashboard, so check it when fulfilling an order to know
which color (and quantity) to ship.

## 6. Fill in the business specifics

A few places still carry placeholder or assumed details — confirm against
your actual supplier/carrier before launch:

- **`site/policies.html`** — shipping region and warranty length are
  bracketed placeholders (`[the United States]`, `[1-year]`).
- **`site/index.html`** product specs (weighted base, NFC + QR, waterproof
  PVC, NTAG215 chip) — pulled from the actual Alibaba listing; re-confirm
  if you switch suppliers.
- **Contact email** — currently `fixaoperations@gmail.com` throughout
  (footer, setup guide, thank-you page, policies). Change it in each file
  if you want a different address, or set up a dedicated business inbox.

## 7. Buy a domain (optional but recommended)

`reviewtap.com` / `.co` / `getreviewtap.com` — check availability at any
registrar (Namecheap, Porkbun, Squarespace Domains). Point it at Netlify
per its DNS instructions, and update the Stripe publishable key setup and
any hardcoded URLs (there aren't any — everything's relative) — nothing
else needs to change.

## Theming

The whole site respects system light/dark mode automatically and has a
manual toggle (top right) that remembers the visitor's choice. Color, type,
and spacing are all driven by CSS custom properties at the top of
`main.css` — change the palette in one place and it propagates everywhere.
