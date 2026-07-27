# ReviewTap — go-to-market playbook

This covers positioning, margin math, how to find and pitch small-business
customers, and a launch checklist. It assumes you're sourcing the physical
stands yourself — plug your real supplier numbers into the margin worksheet
below.

---

## 1. Positioning

**One-line pitch:** *A countertop stand that opens a customer's Google
review page the instant they tap their phone — no app, no monthly fee,
$14.99 once.*

**Who it's for:** owner-operated local businesses that depend on Google
Maps/Search for walk-in traffic and don't have marketing staff — cafés,
salons and barbershops, auto shops, dental/medical clinics, gyms and
studios, restaurants, contractors, boutiques, vets.

**What you're competing against, and why you win on each:**

| Alternative | Their weakness | Your angle |
|---|---|---|
| Asking verbally | Forgotten by the time customer reaches their car | Tap happens at the counter, before they leave |
| QR code on receipt | Thrown away, or requires opening camera app + typing | NFC opens instantly on tap; QR is just the fallback |
| Review-request SaaS (email/SMS drip) | $30–$150/month subscription, needs POS integration | One-time $14.99, zero integration, works day one |
| Generic "review kiosk" tablets | $200+ hardware, needs power/Wi-Fi, can break | Passive chip, no power, no software to maintain |

**Core promise to keep, always:** you never touch or influence the content
of a review — you only remove friction from the ask. Say this explicitly in
outreach; it's the difference between a legitimate tool and something that
reads like review manipulation, and small-business owners (rightly) worry
about the latter.

---

## 2. Margin worksheet

Fill in your real numbers — everything below is a placeholder structure,
not a claim about your actual costs.

| Line item | 1-unit example | Your number |
|---|---|---|
| Sale price | $14.99 | |
| Stripe fee (2.9% + $0.30) | –$0.73 | auto from Stripe |
| Unit cost (stand + chip, from your supplier) | –$? | *fill in* |
| Card printing (if separate from unit cost) | –$? | *fill in* |
| Packaging | –$? | *fill in* |
| **Net margin per unit** | **$?** | |

Shipping is deliberately left off this table — the customer now pays it
separately as its own $4.99 line item at checkout (see below), so it
doesn't eat into the $14.99 product margin the way it would if it were
bundled in. After the $0.73 Stripe fee, you have $14.26 left to cover unit
cost, printing, and packaging on a single-unit order — a much healthier
starting point than absorbing shipping too.

**Shipping economics (separate from product margin):** the site charges a
flat **$4.99** shipping fee, computed server-side in
`netlify/functions/create-payment-intent.js` (see [README.md](README.md)).
Your actual carrier cost may be more or less than $4.99 — that difference,
not the full shipping cost, is what to track. If a small parcel actually
costs you $6 to ship, you're losing about $1/order on shipping alone; if
it costs $3.50, you're pocketing the difference. Check real rates from
your carrier before finalizing $4.99 as the number.

**Tax:** orders shipping to Illinois are charged a flat 10% sales tax
(South Barrington's combined rate); other states currently aren't taxed.
That tax is collected and remitted by you, not kept as revenue — don't
count it as margin.

**Quantity discounts:** the site lets a customer buy any quantity at
$14.99/unit — there's no separate multi-pack price tier anymore. If your
supplier gives you a better per-unit cost at higher order volumes, that
shows up as *your* margin improving on large orders, not as a discount
you're passing to the customer. A business with multiple locations or
several service stations (e.g. a salon with 4 chairs) buying 3+ at once is
still a natural high-value customer to pitch — it just means one shipping
label and one Stripe fee instead of three separate orders, even without a
price break.

---

## 3. Where your first 50 customers come from

Small businesses don't see ads for niche B2B products well — they respond
to direct, local, personal outreach far better than paid social in the
early days. In rough priority order:

### A. Walk-in / in-person pitch (highest close rate, free)
Visit 5–10 local businesses a day with one sample stand in hand. Let the
owner tap it themselves — the product sells itself in ten seconds when
they feel it work. Best targets: places you're already a customer of.

### B. Local Facebook Groups / Nextdoor
Search "[Your City] small business owners" or "[Your City] entrepreneurs"
groups. Post the problem, not the pitch — see script below.

### C. Cold email / DM to businesses with low review counts
Use Google Maps to find businesses in your area with high star ratings
(4.3+) but a low review *count* (under ~40) — they're clearly doing good
work but aren't collecting reviews systematically, which is exactly your
buyer. Get their public contact email or Instagram/Facebook DM from their
listing.

### D. Instagram/TikTok short demo
A 15-second video of the tap → stars-appear moment is inherently
demo-able. Post it, tag it with local business hashtags, and mention it in
outreach DMs as social proof once you have one.

### E. Local business associations / chambers of commerce
Many run small in-person mixers or have a members' Facebook group — one
good demo at one of these can turn into several sales at once via
word-of-mouth among owners who know each other.

---

## 4. Outreach templates

Edit the bracketed parts. Keep these short — owners are busy and skim.

### Cold email

> Subject: quick idea for [Business Name]'s Google reviews
>
> Hi [Name],
>
> I noticed [Business Name] has a [4.6]-star rating but only [23] reviews —
> looks like people love it but rarely get around to leaving a review.
>
> I make a small countertop stand ($14.99, one-time — no subscription) that
> customers tap with their phone on the way out. It opens your Google
> review box instantly, so there's no searching, no app, nothing to type.
> Takes about three seconds.
>
> Happy to bring one by for you to try before you buy anything, if you're
> ever around [neighborhood/area]. No pressure either way — just thought
> it might help.
>
> [Your name]
> [Phone/email]

### Instagram/Facebook DM (shorter)

> Hey! Love [Business Name] — noticed you've got great reviews but not a
> ton of them. I made a $14.99 tap-to-review stand that makes it stupid
> easy for customers to leave one on the way out (no app, taps their
> phone, opens Google review instantly). Want me to send a pic/video?

### In-person opener

> "Quick one — do you ever wish more of your happy customers actually left
> a Google review? I've got a little stand that does that automatically,
> takes three seconds for the customer. Mind if I show you?"
> *(Then hand them your sample and let them tap it themselves.)*

### Follow-up (send 4–5 days after no response)

> Hey [Name] — just bumping this in case it got buried. No worries if it's
> not a fit, just didn't want it to slip through. Happy to answer any
> questions.

---

## 5. Launch checklist

- [ ] Confirm real unit cost from your supplier and fill in the margin
      worksheet (Section 2) — decide if $14.99/unit leaves the margin you
      want, adjust prices in **both** `site/assets/js/main.js` and
      `netlify/functions/create-payment-intent.js` if not (see README.md —
      the function is what actually charges the card).
- [ ] Confirm the 10% IL tax rate is still accurate for South Barrington
      and that you're not shipping to states where you'd owe tax elsewhere.
- [ ] Get your Stripe publishable + secret keys and wire them up (README
      Section 1) — publishable key goes in `main.js`, secret key goes in
      Netlify's environment variables, never in the repo.
- [ ] Confirm your real carrier shipping cost against the $4.99 you're
      charging (see the shipping economics note in Section 2).
- [ ] Fill in the bracketed placeholders in `site/policies.html` (shipping
      region, warranty length).
- [ ] Confirm the product spec bullets on the homepage match your actual
      supplier's stand (materials, NFC chip type, QR fallback, weight).
- [ ] Order a small batch of sample units for in-person demos before you
      commit to a large first order.
- [ ] Set up (or confirm) your own Google Business Profile — you'll need
      its review link both to demo the product and, eventually, to put
      your own stand on your own counter as proof.
- [ ] Deploy to Netlify (see README) — needed for the checkout function to
      run, not just to serve pages — and buy a domain if you want one.
- [ ] Switch Stripe from test keys to live keys once you've placed a real
      test order end-to-end and everything works.
- [ ] Do 10 in-person pitches (Section 3A) before spending a dollar on
      ads — it's free, it's the highest-converting channel, and it
      surfaces objections you'll want to answer on the site before
      scaling outreach.
- [ ] After your first 5–10 sales, ask happy buyers for a short quote or
      photo to replace the placeholder use-case chips on the homepage
      with real testimonials.

---

## 6. What NOT to do

- **Don't fabricate testimonials or review counts.** The FAQ/social-proof
  section on the site deliberately ships without fake quotes — add real
  ones as they come in, not before. A fake-reviews scandal is especially
  bad look for a *review* product.
- **Don't promise a specific increase in reviews.** You're selling reduced
  friction, not a guaranteed outcome — the terms page already reflects
  this; keep outreach copy consistent with it.
- **Don't skip the redirect setup in Stripe.** Without it, customers who
  pay land on Stripe's generic confirmation page instead of your
  `thank-you.html`, which is where you tell them you need their Google
  review link to ship their order.
