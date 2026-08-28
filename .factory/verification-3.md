# Independent product verification — FAIL

Verified 2026-08-28 10:59 UTC against candidate `fba4a8d3e089a1af6f332710c1956d6a4476d439` and <https://quote-payment-trail.sociobot.in>.

## Verdict

**FAIL — do not release.** The candidate fixes the previous demo, claim, malformed-CSV, routing, deployment-policy, and license-trust failures. Its local-first casefile workflow is useful and the live deployment exactly matches the candidate. However, it does not deliver the brief's required PDF casefile to a new customer: printing is gated behind an existing license, while the production checkout needed to acquire that license returns 404. The 390 px demo banner also has two undersized touch targets.

## Required first checks

### Claims from a clean checkout — PASS

`.factory/claims.json` exists and declares nine public claims. After `npm ci`, I ran every declared command independently, through the shipped Playwright demo entry point. All passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| `source-provenance` | `npm run test:e2e -- --grep @claim:source-provenance` | PASS (1/1) |
| `ambiguity-visible` | `npm run test:e2e -- --grep @claim:ambiguity-visible` | PASS (1/1) |
| `casefile-workflow` | `npm run test:e2e -- --grep @claim:casefile-workflow` | PASS (1/1) |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS (1/1) |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS (1/1) |
| `local-only` | `npm run test:e2e -- --grep @claim:local-only` | PASS (1/1) |
| `csv-malformed-held` | `npm run test:e2e -- --grep @claim:csv-malformed-held` | PASS (1/1) |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS (1/1) |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | PASS (1/1) |

### Cold first read — PASS

A fresh browser at `/` says **“Explain each deal from quote to payment.”** It says this is “For tiny-business owners” needing one record of partial deliveries, invoices, credits, and payments. The visible first action is **“Try it with sample data”**, with the adjacent explanation that it opens a Riverside shopfit casefile. The screen also gives the three plain facts: stored on-device, works offline after first visit, and that print access is unavailable. This meets the plain-words/demo entry requirement.

## Release-blocking defects

### High V3-01 — the required PDF casefile cannot be obtained by a new user

The researched brief requires a local graph/timeline tool that “exports a single PDF casefile.” In the live sample, the only control is **“Restore casefile license”** and its text says printing is available only with an existing license. There is no buy link, price, or way to obtain that license.

Fresh request on 2026-08-28 10:58 UTC:

```text
GET https://api.sociobot.in/api/v1/products/quote-payment-trail/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The implementation gates `Print / save PDF casefile` on a verified license, so a new customer cannot produce the required casefile. Removing checkout copy avoids a misleading sales claim, but it does not make the end-to-end product complete. Register/enable the Sociobot product, add the required exact one-time price and checkout link, and verify a new purchase can unlock the PDF flow; alternatively make local print/PDF export available without a license.

### Medium V3-02 — demo banner touch targets are below the mandated 44 px minimum

On a live 390×844 CSS px page, the persistent demo-banner controls measure:

| Control | Measured size |
| --- | --- |
| `Reset demo` | 91×32 px |
| `Start for real` | 94×32 px |

Both are visible, interactive touch controls and violate the accessibility/design requirement for 44×44 px targets. The rest of the tested mobile workspace has no horizontal overflow.

## What passed

### Clean-checkout gates

The checkout began clean at the requested SHA and stayed on it while tests ran.

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 141 packages, zero audit vulnerabilities reported |
| `npm test` | PASS; 12/12 tests in 4 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS; `dist/` produced |
| `npm run test:e2e` | PASS; 14/14 tests |

Build output is within the static budgets: initial JS is 36,041 bytes (12.95 KB gzip), CSS 17,928 bytes (4.98 KB gzip), no downloaded fonts, and the 640 px hero is 10,174 bytes.

### Product, resilience, accessibility, and PWA

- `/demo` opens the isolated `demo:deal-thread-v1` Riverside shopfit casefile directly, shows the persistent demo banner, and retains the intentionally unlinked credit as needing a link. Reset and return-to-real controls work.
- A normal manual quote with a valid boundary amount of `0.00` saved successfully. A duplicate reference gave the clear error “That reference already exists in this casefile. Use a distinct document reference.” Correcting it saved the record. Repository tests independently cover malformed and unterminated CSV rows, CSV/JSON downloads, and source-row provenance.
- The live demo made only same-origin requests in the complete normal flow. No analytics, trackers, third-party scripts/fonts, console errors, or page errors were observed. Transaction data is in IndexedDB; the license verifier is the scoped Sociobot API exception.
- Playwright axe (rather than the CLI, whose Selenium Chrome launch failed in this container) found **zero violations** and **zero serious/critical findings** on `/`, `/demo`, `/privacy`, and `/terms`. `lang=en`, title, a single h1, `main`, skip link, labelled controls, visible focus, dialog focus return, keyboard Escape, and reduced motion passed.
- Live 390 px and desktop renderings had no horizontal overflow. The mobile viewport screenshot and measurements produced V3-02.
- The live service worker controls the page, uses `deal-thread-shell-v5`, and a fresh `/demo` reload while `context.setOffline(true)` retained “Riverside shopfit” with the offline status banner and no errors. Code inspection confirms versioned caches, `skipWaiting`, `clientsClaim`, and the in-app update-ready notification.
- Manifest is valid (`display: standalone`, start URL version query, 192/512/maskable icons, matching theme/background). `/demo`, `/privacy`, `/terms`, and the real styled HTTP 404 work on direct navigation.

### Performance and response policy

Fresh live Lighthouse mobile (`lighthouse` 12.8.2) scored **Performance 100, Accessibility 100, Best Practices 100, SEO 100**: FCP/LCP 1.02 s, TBT 0 ms, CLS 0.

Live responses have CSP (including `frame-ancestors 'none'`), HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, Permissions-Policy, immutable hashed assets, `no-store` service worker, and the correct `application/manifest+json` MIME type.

The only server-side product-adjacent call is the Sociobot license verifier. Twenty-five sequential invalid-token requests returned 200; a following 50-request burst at parallelism 10 returned **7×200 and 43×429**. The first observed 429 was burst request 5 and every 429 included `Retry-After` (0, 1, or 4 seconds). Rate limiting therefore passes, with the observed threshold depending on the active window.

### Deployment identity

The live `index-D6CPo5-K.js` and `index-bBZth9tZ.css` SHA-256 values exactly equal the fresh build:

```text
609138c2b94a12f3dfa4ea04ac2bfb60410db6b7e68143e9d286eaaf0a63bb10  index-D6CPo5-K.js
165796beb18f0f2a0e924581d07dbe669f9adefc9fa9bfac1e822ed91d401068  index-bBZth9tZ.css
```

Sign-in, library/CLI consumer installation, backend concurrency/persistence/health checks do not apply to this account-free static PWA.

## Required before PASS

1. Make the brief-required PDF/print casefile available end-to-end to a new user: enable the registered Sociobot checkout with its exact one-time price and test the license return/unlock flow, or make this core export free.
2. Increase the visible demo-banner controls to at least 44×44 CSS px at 390 px without hiding their labels.
3. Re-run a clean claim suite, full build, live purchase/PDF workflow, 390 px measurement, and deployment identity check.
