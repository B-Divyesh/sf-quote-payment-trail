# Independent product verification — FAIL

Verified 2026-08-28 09:55 UTC against candidate `9bfd00088886e2dc00d289f33aa542629314dc84` and <https://quote-payment-trail.sociobot.in>.

## Verdict

**FAIL — do not release.** The deployed static build matches this candidate and the ordinary casefile workflow is sound, but the candidate fails mandatory claims/demo acceptance, silently accepts syntactically malformed CSV, and advertises a paid unlock whose production checkout is unavailable.

## Required first checks

1. **Claims: BLOCKED/FAIL.** From the clean candidate checkout, `.factory/claims.json` is absent. Therefore there were no claim tests to run through the required demo entry point. This is itself release-blocking under the claims contract. It also leaves landing/README claims such as “Stored only on this device”, “Works offline”, “No account required”, and CSV/JSON export without a registered, tagged observable test.
2. **Cold first read: FAIL.** A fresh 1440 px browser load said that Deal Thread turns scattered transaction records into a source-linked casefile, but it never says this is for a tiny-business owner. Its headline is the metaphor “Every amount, one honest thread.” rather than the job in plain words. The two choices are “Start a casefile” and “Try a sample”; there is no one-click **“Try it with sample data”** action or explanation of what the sample does. The required three plain first-screen facts (privacy, offline, price) are not all present beside the action.

## Release-blocking defects

### High V2-01 — no isolated, direct demo sandbox

`/demo` and `/?demo=1` both render the ordinary landing page. Neither contains a demo banner, Reset demo, Start for real, nor “Try it with sample data”. Clicking “Try a sample” creates the `Riverside shopfit` casefile in the ordinary IndexedDB database `deal-thread-v1`; it is not placed in a `demo:` namespace and it persists with real data. `.factory/demo.md` is also absent. This violates the demo-sandbox contract and means claims cannot be exercised from a clean demo URL.

### High V2-02 — malformed CSV syntax is silently accepted

On the live app, importing this syntactically malformed CSV produced **“1 ready / 0 held back / Every row passed the format checks”** and enabled `Import 1 records`:

```csv
type,reference,date,amount,note
invoice,INV-UNTERMINATED,2026-08-20,42,"Unclosed note
```

The unterminated quoted field is never detected. This contradicts the UI promise that malformed rows are held for review and the brief’s malformed-CSV/source-integrity constraint.

### High V2-03 — advertised paid checkout is unavailable

Fresh `GET https://api.sociobot.in/api/v1/products/quote-payment-trail/checkout` returned HTTP **404** with:

```json
{"error":"enabled factory product","status":404}
```

The landing header and paid dialog advertise a one-time $19 unlock, but a buyer cannot begin checkout.

## Other defects

### Medium V2-04 — SPA route changes strand keyboard/screen-reader users

After keyboard focus on the footer Privacy link and client-side navigation to `/privacy`, focus became `BODY`; the new `Privacy` h1 was not focused and no `aria-live` route announcement existed. This misses the routing/accessibility contract.

### Medium V2-05 — no real 404, and route metadata is incomplete

`/not-a-real-page` returns HTTP 200 and renders the landing page, rather than a styled 404 with a way back. Direct `/privacy` and `/terms` retain the generic title `Deal Thread — explain every amount` rather than route-specific titles. `index.html` also has no canonical link, Open Graph/Twitter card metadata, or Apple touch icon required by the site-structure contract.

## What passed

### Clean checkout gates

The checkout began at the exact candidate SHA. `npm ci` installed 141 packages with zero reported audit vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 4 files, 11 tests |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS — creates `dist/` |
| `npm run test:e2e` | PASS — 8/8 local browser tests |
| `PLAYWRIGHT_BASE_URL=https://quote-payment-trail.sociobot.in npm run test:e2e` | PASS — 8/8 live browser tests |
| `npm audit --audit-level=low` | PASS — zero vulnerabilities |

The production build is small: JS 33.46 KB (12.14 KB gzip), CSS 16.79 KB (4.74 KB gzip), below the static budget.

### End-to-end and resilience checks

- Independently created a GBP partial-delivery case (quote £600.01, delivery £300, invoice £600.01, credit £100.01, payment £500) and got quoted £600.01, net invoiced £500.00, paid £500.00, still open £0.00. Exported CSV had its header and one row for each of the six created records.
- Duplicate reference `q-600` was rejected with a clear recovery message; changing it to `I-2` allowed the record to be saved.
- The repository and live browser suites passed valid/malformed-value CSV, invalid license, privacy, desktop/390 px, axe, persisted-data, and offline-reload cases. In a fresh live context, sample data and the controlled page reloaded offline correctly after first load.
- A controlled local service-worker version change displayed `A Deal Thread update is ready. Reload to use it.`; the update mechanism is functional. `prefers-reduced-motion: reduce` gave 0.00001 s transitions/animations, and 390 px had no horizontal overflow. Skip-link focus and visible 3 px focus styling passed; the route-change failure above remains.
- Playwright axe checks on landing, workspace, paid dialog, and Privacy found zero serious/critical violations. `verify-url.sh` passed: HTTP 200, title, `lang=en`, one h1, main, alt text, no unlabeled buttons, and no console/page errors.
- Fresh mobile Lighthouse 13.4.1: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.0 s, TBT 50 ms, CLS 0.

### Privacy, transport, and deployment identity

- Normal casefile flow made no third-party requests; no analytics, remote fonts, console errors, or page errors were observed. Case data is in IndexedDB. License verification is the scoped Sociobot API exception.
- Response headers were present: HSTS, CSP with `frame-ancestors 'none'`, Permissions-Policy, `X-Frame-Options: DENY`, nosniff, and strict referrer policy. Hashed JS/CSS use `public, max-age=31536000, immutable`; the service worker is no-store; the manifest MIME is `application/manifest+json`.
- Server-side verification rate limiting now passes: a fresh concurrent burst of 150 invalid verification requests yielded **30 × 200** then **120 × 429**, each 429 with `Retry-After: 4`; observed threshold: 30 requests. This resolves the earlier report’s rate-limit finding.
- Live bytes match this candidate’s locally built `dist/` for index, SW, manifest, icons, hero images, JS, and CSS. Representative SHA-256: `index.html` `71aa28d8c43cffb933646a3a32625a72de318d7255ec4be86e4142b86a14ebdf`; `sw.js` `bcf05d0e0ef8b1b4c5c99d3ceed10ebabdf2c8c327420c1c5da345297046fb9f`; `manifest.webmanifest` `88dfa439a20484c51dac795d12e88830bf37a3c011f4d5a42fec279bba57481a`.

Sign-in, library/CLI consumer installation, backend health/persistence/concurrency are not applicable to this account-free static PWA. The only product-adjacent server endpoint is the Sociobot billing API, tested above.

## Required before a PASS

1. Add `.factory/claims.json`; register every public claim with one tagged demo-entry test and make all pass.
2. Implement the documented `/demo` or `?demo=1` sandbox, a first-screen “Try it with sample data” button, isolated demo storage, persistent demo banner, Reset demo, and Start for real.
3. Replace the first-screen metaphor with a plain job headline; name tiny-business owners and show privacy, offline, and price facts next to the first action.
4. Detect/hold malformed CSV syntax, including unterminated quotes, without corrupting or silently importing source rows.
5. Enable the factory billing product so the advertised checkout returns a hosted checkout rather than 404.
6. Add route focus/live announcements, real 404 behavior, route titles, and required canonical/social metadata; then repeat clean and live verification.
