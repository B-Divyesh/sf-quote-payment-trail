# Deal Thread repair handoff

Verified and deployed 2026-08-28 08:40 UTC for work order `quote-payment-trail-repair-1`.

## Outcome

The app-owned release defects from independent report `cea136f9c438298d4576d5d8ce1ed31b49af332f` are repaired and deployed. The static delivery findings are also repaired. Two release blockers remain in the shared Sociobot billing service and cannot be changed by this static repository or its work-order deployment configuration; exact fresh evidence is below.

Deployed app-code commit: `71be9f2` (`fix: harden imports licensing and release policy`)

### Repaired

- **V-01 malformed CSV:** blank financial amounts no longer coerce to zero. Calendar dates are component-validated, so `2026-02-30` cannot normalize to March. The verifier's exact two rows now show `0 ready` and `2 held back`; a genuine zero on `2026-02-28` remains accepted.
- **V-02 offline license trust:** a callback or pasted token is saved as unverified and stays locked. Offline optimism now requires a positive server verdict with a nonzero check time bound to the same token. The exact `arbitrary-offline-token` flow remains locked after failed offline verification and reload.
- **V-05 caching:** Vite's content-hashed JS/CSS remain external, are precached, and live with `public, max-age=31536000, immutable`; hero assets do too. HTML revalidates and `sw.js` is `no-cache, no-store, must-revalidate`.
- **V-06 response policy:** production now returns CSP with `frame-ancestors 'none'`, Permissions-Policy, `X-Frame-Options: DENY`, HSTS, nosniff, strict referrer policy, and disabled DNS prefetch.
- **V-07 mobile targets:** footer Privacy and Terms links have at least 44×44 CSS px targets at 390 px.
- **V-08 manifest MIME:** production returns `application/manifest+json`.
- Added a real ESLint gate and deploy-policy unit coverage.

### Still blocked outside this repository

- **V-03 checkout:** at 08:37 UTC, `GET https://api.sociobot.in/api/v1/products/quote-payment-trail/checkout` still returned `404 {"error":"enabled factory product","status":404}`. The paid-unlock contract says the factory registers the product once with `fleet/new-paid-product.sh`, but that tool is absent from this worker. The static deployment has no billing registration facility, and repository policy forbids changing shared billing infrastructure from this product repo.
- **V-04 server rate limiting:** a fresh sequential burst of 120 verification requests completed in 1,501 ms with `120×200`, zero `429`, and zero `Retry-After`. This endpoint is owned by `api.sociobot.in`; the static work order deploys no API. A client cannot enforce an abuse boundary on the shared server.

Release must remain blocked until the factory billing owner enables the production product and adds a documented server-side verification limit returning 429 plus `Retry-After`.

## Regression coverage

- `src/csv.test.ts`: exact blank-amount and impossible-date rows, source row/raw preservation, and valid zero control.
- `src/license.test.ts`: new/legacy unverified tokens, first-check offline failure, token-bound cached positive verdict.
- `src/release-config.test.ts`: immutable/static cache policy, SW policy, CSP/frame/permissions, and manifest MIME.
- `tests/e2e.spec.ts`: exact malformed import, exact arbitrary-token offline/reload path, 390 px targets, keyboard focus/return, axe states, privacy requests, offline persistence, and desktop/mobile overflow.

## Clean verification

Run from `/work/repo`:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" npm run test:e2e
npm audit --audit-level=low
PLAYWRIGHT_BASE_URL=https://quote-payment-trail.sociobot.in PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" npm run test:e2e
```

Results:

- Clean install: 141 packages, zero audit vulnerabilities.
- ESLint: pass. TypeScript `tsc --noEmit`: pass.
- Vitest: 4 files, 11/11 tests pass.
- Build: pass; `dist/index.html` exists. Initial JS 33.46 KB / 12.14 KB gzip; CSS 16.79 KB / 4.74 KB gzip; mobile hero 10.17 KB.
- Playwright 1.58.2: local 8/8 and production 8/8 pass. This includes desktop 1440×1000, mobile 390×844, keyboard, axe, privacy, offline, and both verifier reproductions.
- Axe via Playwright on landing, populated workbench, paid dialog, and Privacy: zero serious/critical violations.
- No normal-flow third-party requests, console errors, or page errors.
- Offline: the V4 shell contains hashed JS/CSS; saved IndexedDB data survives offline reload.
- Update: registering a controlled changed SW URL produced the in-app `A Deal Thread update is ready. Reload to use it.` notice.

## Performance and live deployment

Deployment command:

```sh
/opt/fleet/lib/deploy-static.sh quote-payment-trail dist
```

Azure Static Web Apps deployment `c10d00ac-9bcf-42fe-9648-8b3a20a8b0d4` succeeded at <https://quote-payment-trail.sociobot.in>.

`verify-url.sh` returned HTTP 200, title, `lang=en`, one h1, main landmark, all image alt text, no unlabeled buttons, and no console errors. Live mobile Lighthouse 13.0.1: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0.

Live SHA-256 matched `dist/` byte-for-byte for index, SW, manifest, icon, hero, Privacy, and Terms. Representative hashes:

- `index.html`: `71aa28d8c43cffb933646a3a32625a72de318d7255ec4be86e4142b86a14ebdf`
- `sw.js`: `bcf05d0e0ef8b1b4c5c99d3ceed10ebabdf2c8c327420c1c5da345297046fb9f`
- `manifest.webmanifest`: `88dfa439a20484c51dac795d12e88830bf37a3c011f4d5a42fec279bba57481a`

Package/consumer, sign-in, backend persistence/concurrency, and backend health identity checks are not applicable to this account-free static PWA. The shared billing endpoint was tested separately as documented above.
