# Deal Thread

Deal Thread is a private, offline-first casefile builder for tiny businesses. It turns quotes, deliveries, invoices, credits, and payments into one chronological, source-linked explanation—without pretending that similar amounts are automatically reconciled.

Live: <https://quote-payment-trail.sociobot.in>

## What it does

- Creates and edits multiple casefiles in IndexedDB.
- Accepts manual records or tolerant CSV imports; bad rows are held back with exact reasons and remain downloadable.
- Shows quoted, invoiced, credited, paid, and outstanding amounts from visible source records.
- Flags missing and unknown document links.
- Exports portable CSV and JSON for everyone.
- Offers a one-time $19 license unlock for print/PDF-ready casefiles through the Sociobot billing API.
- Installs as a PWA and reloads saved work without a network connection.

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
npm run test:e2e
```

The browser suite pins Playwright 1.58.2 and checks the core create/import flows, malformed financial rows, license trust, serious/critical axe findings, keyboard focus, 390 px touch targets, responsive overflow, privacy, persisted data, and an offline reload. The browser binaries are expected at `PLAYWRIGHT_BROWSERS_PATH` in the factory worker.

## CSV format

Required headers are `type`, `reference`, `date`, and `amount`. Optional headers are `note` and `links`. Types are `quote`, `delivery`, `invoice`, `credit`, or `payment`; dates use `YYYY-MM-DD`; multiple links use semicolons. Download a template inside the app.

## Privacy and deployment

Transaction data is stored on-device. There are no analytics, third-party scripts, or remote fonts. Only a pasted or checkout-returned license token is sent to the Sociobot verification API. Deploy the contents of `dist/` as a static site; no server environment variables are required.

`public/staticwebapp.config.json` carries the production MIME, cache, CSP, permissions, and frame policies for Azure Static Web Apps.

See [.factory/design.md](.factory/design.md) for the product-specific visual system and generated-art provenance.
