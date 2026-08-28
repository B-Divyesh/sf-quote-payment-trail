# Deal Thread repair handoff

Repaired against independent verifier report `12330f27fc0adaf8653ba29518d92c738b765905` on 2026-08-28 for work order `quote-payment-trail-repair-2`.

## Repaired findings

- Added the direct `/demo` sandbox and the exact first-screen **Try it with sample data** action. Demo records live only in IndexedDB `demo:deal-thread-v1`; real records remain in `deal-thread-v1`. The persistent banner has Reset demo and Start for real. See `.factory/demo.md`.
- Added `.factory/claims.json` with one tagged, direct-demo regression per public claim. All nine claim commands pass.
- Replaced the metaphor landing headline with the plain job, named tiny-business owners, explained the sample action, and added privacy, offline, and purchase-availability facts.
- CSV parsing now holds an unterminated quoted field back rather than importing a corrupted source row. This is covered in `src/csv.test.ts` and an end-to-end import test using the verifier’s exact row.
- Route changes now focus the destination `h1` and announce it. `/privacy`, `/terms`, `/demo`, and unknown routes set route-specific titles and metadata. Unknown routes render a styled casefile 404; `public/404.html` and Static Web Apps 404 override cover server-level misses. Canonical, Open Graph, Twitter, apple-touch, sitemap, and a 1200×630 derived social image are included.
- The real/demonstration handoff check exposed a save timing race: IndexedDB persistence now waits for transaction completion before a route can read it.
- Bumped the service-worker shell cache to V5 so clients move off the pre-repair V4 app shell on update.
- Production checkout for `quote-payment-trail` still returned `404 {"error":"enabled factory product","status":404}` at 10:04 UTC. The static repository cannot register the shared billing product. To avoid advertising an unusable purchase, the $19 checkout links and price claims are removed. Existing-license restoration and verification remain available; CSV/JSON ownership exports remain free. Re-enable the registered Sociobot checkout and restore the paid-tier copy only after `GET /products/quote-payment-trail/checkout` redirects successfully.

## Verification

Clean install and all repository gates passed:

```sh
npm ci
npm test                 # 4 files, 12 tests
npm run lint
npm run typecheck
npm run build            # dist/index.html produced
PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" npm run test:e2e  # 14/14
npm audit --audit-level=low  # 0 vulnerabilities
```

Each command in `.factory/claims.json` was run independently from its `/demo` entry point and passed. Browser coverage includes desktop and 390×844 mobile, keyboard skip/focus/dialog return, no horizontal overflow, route focus/live announcement, serious/critical axe checks on landing/workbench/license/privacy states, same-origin-only demo requests, IndexedDB isolation, CSV/JSON downloads, malformed imports, offline reload, and controlled license failure.

`verify-url.sh http://127.0.0.1:4173/demo <evidence-dir>` passed: HTTP 200, `Demo — Deal Thread`, `lang=en`, one h1, main landmark, image alt text, labelled buttons, and no console/page errors. Lighthouse 13 local mobile `/demo`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0. Initial JavaScript is 35.87 KB (12.90 KB gzip); CSS is 17.93 KB (4.98 KB gzip); the mobile hero is below 300 KB.

## Deploy and live follow-up

Build output remains `dist/` for static deployment. Deploy with:

```sh
/opt/fleet/lib/deploy-static.sh quote-payment-trail dist
```

After deployment, rerun the browser suite against `https://quote-payment-trail.sociobot.in`, verify `/demo`, `/privacy`, `/terms`, and an unknown path, then retain only the no-purchase posture until billing registration is complete.

Package/consumer installation, sign-in, backend persistence/concurrency, and backend health checks do not apply to this account-free static PWA.
