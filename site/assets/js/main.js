/* ==========================================================================
   ReviewTap site config + behavior
   ── EDIT THE CONFIG BLOCK BELOW ──
   1. Paste your Stripe publishable key into stripePublishableKey (starts
      with "pk_"). Get it from the Stripe Dashboard → Developers → API keys.
   2. Set STRIPE_SECRET_KEY as an environment variable in your hosting
      provider (never in this file, never in the repo) — see README.md.
   3. Keep the prices below in sync with netlify/functions/create-payment-
      intent.js — that file is what actually charges the card, so if the
      two disagree, the real charge wins and the site will show a wrong
      number.
   ========================================================================== */
window.REVIEWTAP_CONFIG = {
  stripePublishableKey: "pk_test_51U1uPqR7lcAX7RRDTmqKet2FMmG0uS3xDNhXMyoweVA1FB77IGc5ymNXl5LvpKEsbze2EkZtns9pL44bkIM4sJxZ00YBYkugs3",
  minQty: 1,
  maxQty: 100,
  colors: [
    { id: "black", name: "Black", default: true, unitPrice: 15.99 },
    { id: "white", name: "White", default: false, unitPrice: 14.99 },
  ],
  // Flat shipping fee charged to the customer, regardless of quantity.
  // Must match SHIPPING_CENTS in netlify/functions/create-payment-intent.js
  // — this value is a preview only, the function is what actually charges it.
  shippingFlat: 4.99,
  // Sales tax: flat rate applied only to orders shipping to this one state
  // (no nexus registered elsewhere). Must match TAX_STATE/TAX_RATE in
  // netlify/functions/create-payment-intent.js.
  taxState: "IL",
  taxRate: 0.10,
};

/* Shared helpers used by index.html (pricing card), review.html (order
   summary), and checkout.html (payment form) — kept off the IIFE below so
   every page can call them. */
window.ReviewTapCheckout = {
  fmt: function (n) {
    return n.toFixed(2);
  },
  clampQty: function (n) {
    var cfg = window.REVIEWTAP_CONFIG;
    var q = parseInt(n, 10);
    if (!q || q < cfg.minQty) q = cfg.minQty;
    if (q > cfg.maxQty) q = cfg.maxQty;
    return q;
  },
  findColor: function (id) {
    var colors = window.REVIEWTAP_CONFIG.colors || [];
    return colors.find(function (c) { return c.id === id; }) || colors.find(function (c) { return c.default; }) || colors[0];
  },
  checkoutLinkFor: function (qty, color) {
    var params = "qty=" + encodeURIComponent(qty) + (color ? "&color=" + encodeURIComponent(color.id) : "");
    return "checkout.html?" + params;
  },
  reviewLinkFor: function (qty, color) {
    var params = "qty=" + encodeURIComponent(qty) + (color ? "&color=" + encodeURIComponent(color.id) : "");
    return "review.html?" + params;
  },
};

(function () {
  "use strict";

  /* ---- Theme toggle, persisted ------------------------------------------ */
  var root = document.documentElement;
  var storedTheme = null;
  try {
    storedTheme = localStorage.getItem("reviewtap-theme");
  } catch (e) {
    /* localStorage unavailable (private mode) — fall back to OS preference */
  }
  if (storedTheme === "dark" || storedTheme === "light") {
    root.setAttribute("data-theme", storedTheme);
  }

  function currentTheme() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.addEventListener("click", function (evt) {
    var btn = evt.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("reviewtap-theme", next);
    } catch (e) {}
  });

  /* ---- Mobile nav --------------------------------------------------------*/
  document.addEventListener("click", function (evt) {
    var toggle = evt.target.closest("[data-nav-toggle]");
    if (toggle) {
      var nav = document.querySelector(".nav-links");
      if (nav) nav.classList.toggle("nav-open");
      return;
    }
    if (evt.target.closest(".nav-links a")) {
      var openNav = document.querySelector(".nav-links.nav-open");
      if (openNav) openNav.classList.remove("nav-open");
    }
  });

  /* ---- Pricing tiers: render + selection --------------------------------- */
  var config = window.REVIEWTAP_CONFIG;
  var qtyInputEl = document.querySelector("[data-qty-input]");
  var priceAmountEl = document.querySelector("[data-price-amount]");
  var priceUnitEl = document.querySelector("[data-price-unit]");
  var buyButtonEl = document.querySelector("[data-buy-button]");
  var colorListEl = document.querySelector("[data-color-list]");
  var selectedQty = config.minQty;
  var selectedColor = (config.colors || []).find(function (c) { return c.default; }) || (config.colors || [])[0];

  var fmt = window.ReviewTapCheckout.fmt;

  function renderSelection() {
    var unitPrice = selectedColor.unitPrice;
    var subtotal = selectedQty * unitPrice;
    if (priceAmountEl) priceAmountEl.textContent = "$" + fmt(subtotal);
    if (priceUnitEl) {
      priceUnitEl.textContent = selectedQty === 1 ? "one-time" : "$" + fmt(unitPrice) + " / stand";
    }
    if (buyButtonEl) {
      buyButtonEl.href = window.ReviewTapCheckout.reviewLinkFor(selectedQty, selectedColor);
      var colorSuffix = selectedColor ? " (" + selectedColor.name + ")" : "";
      var qtyLabel = selectedQty + (selectedQty === 1 ? " Stand" : " Stands");
      buyButtonEl.textContent = "Buy " + qtyLabel + colorSuffix + " — $" + fmt(subtotal);
    }
    if (colorListEl) {
      colorListEl.querySelectorAll("[data-color-id]").forEach(function (el) {
        el.setAttribute("aria-pressed", el.getAttribute("data-color-id") === (selectedColor && selectedColor.id) ? "true" : "false");
      });
    }
  }

  if (qtyInputEl) {
    qtyInputEl.value = selectedQty;
    qtyInputEl.min = config.minQty;
    qtyInputEl.max = config.maxQty;
    qtyInputEl.addEventListener("input", function () {
      selectedQty = window.ReviewTapCheckout.clampQty(qtyInputEl.value);
      renderSelection();
    });
    qtyInputEl.addEventListener("blur", function () {
      qtyInputEl.value = selectedQty;
    });
  }

  if (colorListEl && config.colors) {
    config.colors.forEach(function (color) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "swatch";
      el.setAttribute("data-color-id", color.id);
      el.setAttribute("aria-pressed", color.id === selectedColor.id ? "true" : "false");
      el.innerHTML =
        '<span class="swatch-dot dot-' + color.id + '" aria-hidden="true"></span>' + color.name;
      el.addEventListener("click", function () {
        selectedColor = color;
        renderSelection();
      });
      colorListEl.appendChild(el);
    });
  }

  renderSelection();

  /* ---- Reveal-on-scroll, gentle, respects reduced motion ------------------*/
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- Footer year --------------------------------------------------------*/
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
