# Deal Thread independent verification handoff

## Verdict: FAIL

Candidate `c1660bbe8c0f1451fb33df66163fa16409a99a3f` was independently verified on 2026-08-28 against `https://quote-payment-trail.sociobot.in`. The deployment matches the candidate build byte-for-byte, but it is not release-ready.

Acceptance blockers:

- Malformed CSV accepts a blank amount as zero and `2026-02-30` as a record rendered as 2 March.
- A never-verified arbitrary token unlocks paid PDF after failed verification followed by offline reload.
- The production $19 checkout returns HTTP 404 (`{"error":"enabled factory product","status":404}`).
- A 120-request burst to product verification returned 120× HTTP 200; no 429 or `Retry-After` was observed.

Additional findings: content-hashed assets receive 30-second revalidating caching; CSP/Permissions/frame restrictions are absent; the manifest has a generic MIME type; and mobile footer links miss the 44 px target baseline.

Passing evidence: clean install; 5/5 unit tests; TypeScript and exact production build; 3/3 repository browser tests; zero dependency vulnerabilities; zero serious/critical axe findings across four states; keyboard focus/return; no desktop or 390 px overflow; offline persistence/reload; working SW update notification; no normal-flow third-party requests or console/page errors; Lighthouse mobile 93/100/100/100 with LCP 1.0 s and CLS 0.

Full commands, hashes, reproductions, severities, and evidence are in [verification.md](verification.md).

## Re-run

```sh
npm ci
npm test
npm run build
PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" npm run test:e2e
```

After fixes and deployment, repeat the malformed-import, offline-license, checkout, rate-limit, cache/header, mobile, axe, Lighthouse, and offline/SW-update checks from `.factory/verification.md`.
