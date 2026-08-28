# Deal Thread v1 handoff

## Shipped

- A responsive vanilla TypeScript PWA for maintaining multiple quote-to-payment casefiles entirely in IndexedDB.
- Manual create/edit/delete flows for quotes, deliveries, invoices, credits, and payments, including explicit reference links, source notes, confirmation, and record deletion undo.
- Tolerant CSV import with quoted-field support, header aliases, per-row validation, duplicate-reference protection, staged accepted/rejected counts, and downloadable rejected rows.
- Explainable totals for quoted, invoiced, credited, paid, and still-open values. Missing and unknown links stay visibly unresolved; matching amounts are never inferred as links.
- Free CSV and full JSON backup export/import. JSON restore explicitly confirms replacement.
- One-time $19 Casefile unlock using the Sociobot checkout and verification contract, including callback token capture, daily verdict cache, optimistic offline access, invalid/revoked handling, and paste-to-restore. The paid feature is browser print/save-to-PDF; data portability remains free.
- Installable offline app shell with 192/512/maskable icons, a versioned service-worker cache, an update-ready notice, and verified offline reload of saved IndexedDB data.
- Dedicated `/privacy` and `/terms` routes plus physical static-build fallbacks.
- Original ceramic evidence-chain artwork generated for this product and documented with prompt/provenance in `.factory/design.md`.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deploy command. It produces `dist/index.html`, inlines the small critical JS/CSS into that shell for reliable first-load caching, and also emits `dist/privacy/index.html` and `dist/terms/index.html`.

Verification completed on 2026-08-28:

- Unit: 5/5 passing (CSV parsing/validation and case arithmetic/link diagnostics).
- Playwright 1.58.2: 3/3 passing (creation and persistence, axe serious/critical scan, offline reload, mixed valid/malformed CSV import).
- Factory `verify-url.sh`: HTTP 200, title present, `lang=en`, exactly one h1, main landmark present, all images have alt text, no unlabeled buttons, zero console/page errors.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.8s, LCP 1.2s, TBT 150ms, CLS 0.
- Initial app JS: 33.19 KB uncompressed / 12.00 KB gzip; CSS: 16.69 KB / 4.72 KB gzip; responsive hero: 10 KB (640px) or 20 KB (960px). No font download.
- Visual checks at 1440×1000 and 390×844: no horizontal overflow; one h1 and one main; no console errors.
- `npm audit`: zero known vulnerabilities.

## Known boundaries / next steps

- “PDF export” intentionally uses the browser’s print/save-to-PDF facility, so pagination and the final destination remain under the user’s control.
- The production billing endpoint is wired by slug, but checkout depends on the factory registering `quote-payment-trail` and configuring its return URL.
- There is intentionally no accounting sync, inventory state, payment initiation, or automatic matching. A future version could add optional import mapping for nonstandard CSV headings while preserving review-before-import.
