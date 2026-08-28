# Independent product verification — FAIL

Verified 2026-08-28 07:59 UTC.

- Candidate: `c1660bbe8c0f1451fb33df66163fa16409a99a3f`
- Production URL: `https://quote-payment-trail.sociobot.in`
- Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2, Chrome 145.0.7632.6, Lighthouse 13.0.1

## Verdict

**FAIL.** The core local casefile workflow is useful, but the candidate silently accepts malformed financial source data, an arbitrary token can unlock the paid PDF feature after failed offline verification, the advertised checkout is unavailable, and the required billing verification rate limit is absent at the tested burst size.

## Acceptance-blocking defects

### High — V-01: malformed CSV becomes plausible records

This live import reported **2 ready, 0 held back**:

```csv
type,reference,date,amount,note,links
invoice,INV-BLANK,2026-08-30,,Blank amount,Q-100
invoice,INV-BADDATE,2026-02-30,10,Impossible date,Q-100
```

`INV-BLANK` becomes `£0.00`. `INV-BADDATE` retains source `2026-02-30`, renders as **Mar 2, 2026**, and opens with an empty date input. This violates the malformed-CSV and source-integrity contract.

### High — V-02: arbitrary token unlocks paid PDF offline

Paste `arbitrary-offline-token`, go offline before “Verify and restore”, then reload offline. Verification visibly fails, but storage contains `{ "valid": true, "checkedAt": 0 }`; after reload the header says **Casefile unlocked** and the action says **Print / save PDF casefile**. Offline optimism incorrectly trusts a token that never passed verification.

### High — V-03: production checkout returns 404

`https://api.sociobot.in/api/v1/products/quote-payment-trail/checkout` returned HTTP **404** with `{"error":"enabled factory product","status":404}`. No buyer can complete the advertised one-time $19 unlock. This is fresh evidence of the deployment failure.

### High — V-04: required API rate limiting was not observed

A burst of **120** sequential verification requests completed in **1.28 seconds** against `/api/v1/products/quote-payment-trail/verify?license=qa-rate-limit-c1660bbe`. All returned HTTP 200; none returned 429 or `Retry-After`. No threshold was reached through 120 requests (about 94 requests/second).

## Other findings

- **Medium V-05 — caching:** document, SW, hero, and content-hashed JS/CSS all return `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable caching.
- **Medium V-06 — response policy:** HSTS, strict referrer policy, nosniff, X-XSS-Protection, and disabled DNS prefetch are present. CSP (including `frame-ancestors`), Permissions-Policy, and equivalent frame restriction are absent.
- **Low V-07 — mobile targets:** at 390 px, visible footer Privacy and Terms links measured 43×20 and 36×20 CSS px.
- **Low V-08 — manifest MIME:** the manifest is served as `application/octet-stream`; Chrome nevertheless parsed it with zero errors.

## Clean-checkout gates

The checkout was clean and exactly at the candidate before installation.

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 61 packages; zero audit vulnerabilities |
| `npm test` | PASS; 2 files, 5/5 tests |
| `npm run build` | PASS; includes `tsc --noEmit`, Vite build, SW injection |
| `npm run test:e2e` | PASS; 3/3 repository Playwright tests |
| `npm audit --audit-level=low` | PASS; zero known vulnerabilities |
| Lint | Not available in this candidate |

Build output: JS 33.19 KB / 12.00 KB gzip; CSS 16.69 KB / 4.72 KB gzip; 640 px hero 10.17 KB; no font download. Budgets pass.

## Independent end-to-end evidence

- Created a GBP casefile; required and negative values were blocked.
- Added quote, partial delivery, invoice, credit, payment, and zero-value record; verified `600.01 - 100.01 - 500.00 = £0.00` and explicit links.
- Duplicate references produced an announced error and recovered after correction.
- Inspected provenance, deleted/undid, exported exact CSV and a 3,266-byte JSON backup.
- Invalid JSON was rejected without data loss. A valid replacement backup required confirmation and survived reload.
- A simulated previously valid cached license opened the printable five-record casefile; legitimate purchase could not complete due to V-03.
- Normal flows requested only `quote-payment-trail.sociobot.in`; no analytics, trackers, remote fonts, cookies, console errors, or page errors were observed. Data used IndexedDB `deal-thread-v1`.
- License callbacks stripped the token from the URL and used only the Sociobot verifier. Invalid online verification returned `valid:false` with origin-specific CORS and `no-store`.
- Production SW controlled the page; saved data survived offline reload. A controlled SW byte update activated without error and displayed the update-ready toast.
- Axe on landing, populated workspace, paid dialog, and Privacy found **0 serious/critical violations**.
- `lang=en`, title, one h1, one main, skip link, 3 px visible focus, dialog focus return, and reduced-motion behavior passed.
- 1440×1000 desktop and 390×844 mobile rendered without horizontal overflow; mobile dialog width was 352 px.

## Performance

Fresh Lighthouse mobile: Performance 93, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.0 s, TBT 310 ms, CLS 0, transfer 34 KiB. INP was unavailable from the no-interaction synthetic run.

## Deployment identity

`origin/main` resolved to the candidate. Live bytes exactly matched the clean build for the shell, SW, manifest, icon, hero, Privacy, and Terms. Representative SHA-256:

- `index.html`: `52d3069680e04c42581237e9538431b3e52272df1b374093ab94d7dd3cf60d81`
- `sw.js`: `e3aae3efe7cf6a6734dde6bdcc7d932b264f862c6ff9ad4d6a44c9451355bd83`
- manifest: `2155deb5973ac2d8e812ed06b226815af0ae09b4ea722859458f486dd3585bd9`

Sign-in, backend persistence/concurrency/health identity, and library/CLI installation are not applicable to this static account-free PWA. The Sociobot billing endpoint was tested as above.

## Required before PASS

1. Reject blank amounts and impossible dates during CSV review.
2. Require a previously server-valid verdict before offline optimistic unlock.
3. Enable the production checkout product.
4. Return 429 plus `Retry-After` under a documented verification burst threshold.
5. Correct cache/security/MIME policies and mobile footer targets, then repeat live verification.
