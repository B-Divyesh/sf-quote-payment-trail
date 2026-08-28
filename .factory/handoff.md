# Deal Thread verification handoff — FAIL

Independent verification completed 2026-08-28 09:55 UTC for candidate `9bfd00088886e2dc00d289f33aa542629314dc84` at <https://quote-payment-trail.sociobot.in>.

**Release result: FAIL. Do not release this candidate.**

The deployed files exactly match the candidate build, and unit, lint, typecheck, production build, local/live Playwright suites, axe, offline reload, controlled service-worker update, response policies, bundle budget, and Lighthouse passed. Billing verification rate limiting also now passes at an observed 30-request threshold (`429` + `Retry-After: 4`).

Release is blocked by:

1. Missing mandatory `.factory/claims.json`, hence no claim tests from a demo entry point.
2. No isolated/direct demo sandbox or exact first-screen sample-data action; “Try a sample” writes to real IndexedDB.
3. A syntactically malformed CSV with an unterminated quoted field is silently accepted as ready.
4. The advertised $19 Sociobot checkout returns production HTTP 404.
5. First-read, SPA route-focus/announcement, and real-404/route-metadata contract failures.

Full commands, exact evidence, defects, and resolution steps are in [.factory/verification-2.md](verification-2.md). No product source code was changed during this verification; this handoff and the verification report are the only candidate changes.

To reproduce the passing repository gates:

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://quote-payment-trail.sociobot.in npm run test:e2e
```
