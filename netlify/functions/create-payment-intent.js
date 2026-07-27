// Creates a Stripe PaymentIntent for a checkout attempt.
//
// The amount is computed here from server-side price/tax tables, never
// taken from the client — a request can send any `qty`/`color`/`state`,
// but it cannot send an `amount`, so there's no way to pay less than the
// real price by editing devtools or replaying a request with a different
// body.
//
// Requires STRIPE_SECRET_KEY set as an environment variable in your
// hosting provider's dashboard (Netlify: Site settings → Environment
// variables). Never commit the secret key itself to the repo.

const Stripe = require("stripe");

// Keep in sync with site/assets/js/main.js — that file drives what the
// customer *sees*; these values decide what they actually pay.
const UNIT_CENTS_BY_COLOR = {
  black: 1599,
  white: 1499,
};
const SHIPPING_CENTS = 499;
const MIN_QTY = 1;
const MAX_QTY = 100;
const COLORS = Object.keys(UNIT_CENTS_BY_COLOR);

// Flat-rate sales tax, charged only on orders shipping to this one state
// (no nexus registered elsewhere yet). Add more states here as needed.
const TAX_STATE = "IL";
const TAX_RATE = 0.10;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  let qty = parseInt(body.qty, 10);
  if (!qty || qty < MIN_QTY) qty = MIN_QTY;
  if (qty > MAX_QTY) qty = MAX_QTY;

  const colorId = COLORS.includes(body.color) ? body.color : "black";
  const state = typeof body.state === "string" ? body.state.trim().toUpperCase() : "";

  const subtotal = qty * UNIT_CENTS_BY_COLOR[colorId];
  const tax = state === TAX_STATE ? Math.round((subtotal + SHIPPING_CENTS) * TAX_RATE) : 0;
  const amount = subtotal + SHIPPING_CENTS + tax;

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "STRIPE_SECRET_KEY is not set. Add it in your hosting provider's environment variables.",
      }),
    };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        qty: String(qty),
        color: colorId,
        ship_state: state,
        subtotal_cents: String(subtotal),
        shipping_cents: String(SHIPPING_CENTS),
        tax_cents: String(tax),
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        tax: tax,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Failed to create payment intent" }),
    };
  }
};
