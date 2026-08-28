# Deal Thread

Explain each deal from quote to payment. Deal Thread is for tiny-business owners who need one clear record of deliveries, invoices, credits, and payments.

Live: <https://quote-payment-trail.sociobot.in>

## What it does

- Creates and edits casefiles in IndexedDB.
- Accepts manual records or CSV imports; malformed rows are held back for review.
- Shows quoted, invoiced, credited, paid, and outstanding amounts from visible source records.
- Exports portable CSV and JSON for everyone.
- Exports records as CSV and a full JSON backup.
- Works offline after the first visit.

## Try the isolated demo

Open <https://quote-payment-trail.sociobot.in/demo> or choose **Try it with sample data**. It opens a realistic Riverside shopfit casefile. The demo uses a separate `demo:deal-thread-v1` IndexedDB database, so nothing there is saved to your real casefiles. Use **Reset demo** to restore the sample and **Start for real** to leave it.

This is an explanation aid, not accounting software. It does not sync with ledgers, manage inventory, initiate payments, or claim automated matching.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Production build (the factory work-order command):

```sh
npm run build
```

The static site is written to `dist/`, with `dist/index.html` at its root and physical fallbacks for `/privacy` and `/terms`.

## Verify

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

The browser suite pins Playwright 1.58.2 and checks the core create/import flows, direct isolated demo, unterminated CSV syntax, license trust, serious/critical axe findings, keyboard route focus, 390 px touch targets, responsive overflow, privacy, exports, persisted data, and an offline reload. The browser binaries are expected at `PLAYWRIGHT_BROWSERS_PATH` in the factory worker. Public claims and their exact demo tests are in [`.factory/claims.json`](.factory/claims.json).

## CSV format

Required headers are `type`, `reference`, `date`, and `amount`. Optional headers are `note` and `links`. Types are `quote`, `delivery`, `invoice`, `credit`, or `payment`; dates use `YYYY-MM-DD`; multiple links use semicolons. Download a template inside the app.

## Privacy and deployment

Transaction data is stored only on-device. There are no analytics, third-party scripts, or remote fonts. New Casefile purchases are not advertised while the factory billing product is unavailable. Deploy the contents of `dist/` as a static site; no server environment variables are required.

`public/staticwebapp.config.json` carries the production MIME, cache, CSP, permissions, and frame policies for Azure Static Web Apps.

See [.factory/design.md](.factory/design.md) for the product-specific visual system and generated-art provenance.
See [.factory/demo.md](.factory/demo.md) for the demo boundary and reset behavior.
