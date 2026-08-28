import './style.css'
import { loadData, saveData } from './db'
import { formatMoney, summarize } from './calc'
import { csvEscape, parseImport, type CsvResult } from './csv'
import { captureLicense, checkoutUrl, hasOptimisticUnlock, storeLicense, verifyLicense } from './license'
import type { AppData, Casefile, DealRecord, RecordType } from './types'
import { recordTypes } from './types'

const app = document.querySelector<HTMLDivElement>('#app')!
let data: AppData = await loadData()
let premium = hasOptimisticUnlock()
let importResult: CsvResult | null = null
let importFileName = ''
let deletedRecord: { caseId: string; record: DealRecord } | null = null
let dialogReturnFocus: HTMLElement | null = null

captureLicense()
premium = hasOptimisticUnlock()

const typeLabels: Record<RecordType, string> = { quote: 'Quote', delivery: 'Delivery', invoice: 'Invoice', credit: 'Credit', payment: 'Payment' }
const esc = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!)
const activeCase = () => data.cases.find((item) => item.id === data.activeId) ?? null
const today = () => new Date().toISOString().slice(0, 10)
const typeIcon = (type: RecordType) => ({ quote: 'Q', delivery: 'D', invoice: 'I', credit: 'C', payment: 'P' })[type]

function legalPage(kind: 'privacy' | 'terms'): string {
  const privacy = kind === 'privacy'
  return `
    <header class="site-header compact"><a class="brand" href="/" data-route><span class="brand-mark" aria-hidden="true"></span>Deal Thread</a><a href="/" data-route>Back to workbench</a></header>
    <main id="main" class="legal"><p class="eyebrow">Plain-language policy</p><h1>${privacy ? 'Privacy' : 'Terms of use'}</h1>
    ${privacy ? `<p class="lede">Your deal records belong to you. Deal Thread stores casefiles in your browser’s IndexedDB and does not send them to us.</p>
      <h2>What stays on your device</h2><p>Customer names, references, dates, amounts, notes, source rows, and links stay in local browser storage. CSV and JSON files are read locally. Exports are created locally.</p>
      <h2>License checks</h2><p>If you buy or restore the Casefile unlock, the license token is stored in localStorage and sent to the Sociobot billing API only to verify access. Checkout is hosted by Sociobot/Dodo, the merchant of record. We do not receive your card details.</p>
      <h2>Analytics and retention</h2><p>There are no analytics, trackers, advertising cookies, third-party fonts, or runtime scripts. Removing site data in your browser deletes local casefiles and the saved license from that device.</p>` : `<p class="lede">Deal Thread is a record-explanation aid, not accounting, tax, legal, inventory, or payment software.</p>
      <h2>Your responsibility</h2><p>You control the records you enter and must verify them against source documents. Totals are arithmetic summaries, not automated matching claims. Keep your own backups using the JSON export.</p>
      <h2>One-time Casefile unlock</h2><p>The one-time purchase unlocks print-ready casefiles for this product. Sociobot/Dodo is the merchant of record and handles checkout and refunds. A refund or revoked license removes paid access; CSV and JSON export remain available.</p>
      <h2>Warranty</h2><p>The software is provided “as is” without warranty. To the extent permitted by law, the authors are not liable for losses arising from use or inability to use it.</p>`}
    <p class="policy-date">Effective 28 August 2026 · Contact: support@sociobot.in</p></main>${footer()}`
}

function footer(): string {
  return `<footer><span>Private by default · Works offline</span><span><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a></span><span>Original AI-generated ceramic artwork</span></footer>`
}

function header(): string {
  return `<header class="site-header">
    <a class="brand" href="/" data-route aria-label="Deal Thread home"><span class="brand-mark" aria-hidden="true"></span><span>Deal Thread</span></a>
    <nav aria-label="Primary"><button class="text-button" data-action="show-about">How it works</button><a class="buy-link small" href="${checkoutUrl}">${premium ? 'Casefile unlocked' : 'Unlock casefile · $19'}</a></nav>
  </header>`
}

function landing(): string {
  return `${header()}<main id="main">
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">Quote → delivery → invoice → credit → payment</p><h1>Every amount,<br><em>one honest thread.</em></h1>
      <p class="lede">Turn scattered transaction records into a source-linked casefile. Deal Thread shows what happened, what remains, and what still needs your judgment.</p>
      <div class="hero-actions"><button class="primary" data-action="new-case">Start a casefile</button><button data-action="load-example">Try a sample</button></div>
      <p class="privacy-note"><span aria-hidden="true">◌</span> Stored only on this device. No account required.</p></div>
      <picture class="hero-art"><source media="(max-width: 700px)" srcset="/assets/deal-thread-hero-640.webp"><img src="/assets/deal-thread-hero-960.webp" width="960" height="640" alt="Five pale ceramic document tiles joined by cobalt thread, with one unresolved ochre tile nearby" fetchpriority="high" decoding="async"></picture>
    </section>
    <section class="principles" aria-labelledby="principles-title"><p class="eyebrow">Built for explanation, not automation</p><h2 id="principles-title">A casefile you can defend.</h2><div class="principle-grid">
      <article><span>01</span><h3>Sources stay attached</h3><p>Open any record to see whether it was typed or which CSV row it came from.</p></article>
      <article><span>02</span><h3>Ambiguity stays visible</h3><p>Equal amounts are never silently matched. You choose the document links.</p></article>
      <article><span>03</span><h3>Yours, even offline</h3><p>Casefiles live in this browser, with portable JSON and CSV backups.</p></article>
    </div></section>
  </main>${footer()}`
}

function workspace(casefile: Casefile): string {
  const summary = summarize(casefile)
  const sorted = [...casefile.records].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  const unresolvedCount = new Set([...summary.unlinked.map((item) => item.id), ...summary.invalidLinks.map((item) => item.record.id)]).size
  return `${header()}<main id="main" class="workspace">
    <aside class="case-rail" aria-label="Casefiles">
      <div><p class="rail-label">Casefiles</p><button class="icon-button" data-action="new-case" aria-label="Create casefile">+</button></div>
      <ul>${data.cases.map((item) => `<li><button class="case-tab ${item.id === casefile.id ? 'active' : ''}" data-action="switch-case" data-id="${item.id}" ${item.id === casefile.id ? 'aria-current="page"' : ''}><span>${esc(item.name.slice(0, 1).toUpperCase())}</span><span>${esc(item.name)}<small>${item.records.length} records</small></span></button></li>`).join('')}</ul>
      <button class="rail-import" data-action="import-backup">Import JSON backup</button><input id="backup-file" class="visually-hidden" type="file" accept="application/json,.json" aria-label="Choose JSON backup">
    </aside>
    <section class="workbench">
      <div class="work-top"><div><p class="eyebrow">Open casefile</p><h1>${esc(casefile.name)}</h1><p>${esc(casefile.customer || 'No customer set')} · Updated ${new Date(casefile.updatedAt).toLocaleDateString()}</p></div>
      <div class="actions"><button data-action="edit-case">Edit details</button><button class="primary" data-action="add-record">Add record</button></div></div>
      <section class="summary-strip" aria-label="Case totals">
        <div><span>Quoted</span><strong>${formatMoney(summary.quoted, casefile.currency)}</strong></div>
        <div><span>Net invoiced</span><strong>${formatMoney(summary.netBilled, casefile.currency)}</strong><small>${summary.credited ? `${formatMoney(summary.credited, casefile.currency)} credited` : 'No credits'}</small></div>
        <div><span>Paid</span><strong>${formatMoney(summary.paid, casefile.currency)}</strong></div>
        <div class="${summary.outstanding > 0 ? 'amount-open' : 'amount-clear'}"><span>Still open</span><strong>${formatMoney(summary.outstanding, casefile.currency)}</strong></div>
      </section>
      <div class="work-columns">
        <section class="thread-panel" aria-labelledby="thread-title">
          <div class="section-heading"><div><p class="eyebrow">Document trail</p><h2 id="thread-title">What happened</h2></div><button data-action="import-csv">Import CSV</button></div>
          ${sorted.length ? `<ol class="thread">${sorted.map((record) => recordHtml(record, casefile, summary)).join('')}</ol>` : emptyRecords()}
        </section>
        <aside class="explain-panel" aria-labelledby="explain-title">
          <p class="eyebrow">Reconciliation notes</p><h2 id="explain-title">What needs attention</h2>
          ${unresolvedCount ? `<div class="attention"><strong>${unresolvedCount} ${unresolvedCount === 1 ? 'record needs' : 'records need'} a link</strong><p>Open each ochre record and connect it to its source document. Matching amounts alone is not proof.</p></div>` : `<div class="resolved"><strong>All downstream records are linked</strong><p>No missing or unknown document links were found.</p></div>`}
          <dl class="math"><div><dt>Invoices</dt><dd>${formatMoney(summary.invoiced, casefile.currency)}</dd></div><div><dt>minus credits</dt><dd>− ${formatMoney(summary.credited, casefile.currency)}</dd></div><div><dt>minus payments</dt><dd>− ${formatMoney(summary.paid, casefile.currency)}</dd></div><div class="math-total"><dt>Still open</dt><dd>${formatMoney(summary.outstanding, casefile.currency)}</dd></div></dl>
          <p class="source-note">Calculated directly from ${casefile.records.length} visible source ${casefile.records.length === 1 ? 'record' : 'records'}.</p>
          <div class="export-block"><h3>Take the casefile with you</h3><button data-action="export-csv">Export records as CSV</button><button data-action="export-json">Export JSON backup</button><button class="casefile-button" data-action="print-casefile">${premium ? 'Print / save PDF casefile' : 'Unlock PDF casefile'}</button><p>${premium ? 'Your one-time unlock is active.' : 'One-time $19 unlock. CSV and JSON stay free.'}</p></div>
        </aside>
      </div>
    </section>
  </main>${footer()}`
}

function recordHtml(record: DealRecord, casefile: Casefile, summary: ReturnType<typeof summarize>): string {
  const missingLinks = summary.invalidLinks.find((item) => item.record.id === record.id)?.links ?? []
  const unlinked = summary.unlinked.some((item) => item.id === record.id) || missingLinks.length > 0
  return `<li class="thread-item ${unlinked ? 'unresolved' : ''}">
    <button class="record-button" data-action="edit-record" data-id="${record.id}" aria-label="Edit ${typeLabels[record.type]} ${esc(record.reference)}">
      <span class="record-icon type-${record.type}" aria-hidden="true">${typeIcon(record.type)}</span>
      <span class="record-core"><span><strong>${typeLabels[record.type]}</strong> <b>${esc(record.reference)}</b></span><time datetime="${record.date}">${new Date(`${record.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</time></span>
      <span class="record-amount">${formatMoney(record.amount, casefile.currency)}<small>${unlinked ? 'Needs a link' : record.links.length ? `Linked to ${record.links.map(esc).join(', ')}` : 'Starting record'}</small></span>
      <span class="chevron" aria-hidden="true">›</span>
    </button>
  </li>`
}

function emptyRecords(): string {
  return `<div class="empty-records"><span class="empty-knot" aria-hidden="true"></span><h3>The thread is ready.</h3><p>Add the quote first, or import a CSV with several records at once.</p><div><button class="primary" data-action="add-record">Add first record</button><button data-action="import-csv">Import CSV</button></div></div>`
}

function render(): void {
  const path = location.pathname.replace(/\/$/, '')
  if (path === '/privacy' || path === '/terms') app.innerHTML = legalPage(path.slice(1) as 'privacy' | 'terms')
  else app.innerHTML = activeCase() ? workspace(activeCase()!) : landing()
  updateNetworkStatus()
}

function showDialog(content: string, className = ''): HTMLDialogElement {
  document.querySelector('dialog')?.remove()
  dialogReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const dialog = document.createElement('dialog')
  dialog.className = className
  dialog.innerHTML = `<div class="dialog-shell">${content}</div>`
  document.body.append(dialog)
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(dialog) })
  dialog.showModal()
  dialog.querySelector<HTMLElement>('input, button, select')?.focus()
  return dialog
}

function closeDialog(dialog = document.querySelector<HTMLDialogElement>('dialog')): void {
  if (!dialog) return
  dialog.close()
  dialog.remove()
  dialogReturnFocus?.focus()
  dialogReturnFocus = null
}

function caseDialog(casefile?: Casefile): void {
  const dialog = showDialog(`<form method="dialog" id="case-form">
    <div class="dialog-heading"><div><p class="eyebrow">${casefile ? 'Casefile details' : 'New casefile'}</p><h2>${casefile ? 'Edit the cover' : 'Start a clear trail'}</h2></div><button class="close-button" value="cancel" aria-label="Close">×</button></div>
    <label>Case name<input name="name" required maxlength="80" value="${esc(casefile?.name ?? '')}" placeholder="e.g. Riverside shopfit"></label>
    <label>Customer or counterparty<input name="customer" maxlength="100" value="${esc(casefile?.customer ?? '')}"></label>
    <label>Currency<select name="currency">${['USD', 'GBP', 'EUR', 'INR', 'AUD', 'CAD'].map((currency) => `<option ${currency === (casefile?.currency ?? 'USD') ? 'selected' : ''}>${currency}</option>`).join('')}</select></label>
    <p class="form-error" role="alert"></p><div class="dialog-actions"><button value="cancel">Cancel</button><button class="primary" value="default">${casefile ? 'Save details' : 'Create casefile'}</button></div>
    ${casefile ? `<button type="button" class="danger-link" data-action="delete-case">Delete this casefile</button>` : ''}
  </form>`)
  dialog.querySelector<HTMLFormElement>('#case-form')!.addEventListener('submit', async (event) => {
    event.preventDefault()
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null
    if (submitter?.value === 'cancel') { closeDialog(dialog); return }
    const form = event.currentTarget as HTMLFormElement
    const fields = new FormData(form)
    const name = String(fields.get('name') ?? '').trim()
    if (!name) return
    const now = new Date().toISOString()
    if (casefile) { casefile.name = name; casefile.customer = String(fields.get('customer') ?? '').trim(); casefile.currency = String(fields.get('currency')); casefile.updatedAt = now }
    else { const item: Casefile = { id: crypto.randomUUID(), name, customer: String(fields.get('customer') ?? '').trim(), currency: String(fields.get('currency')), createdAt: now, updatedAt: now, records: [] }; data.cases.push(item); data.activeId = item.id }
    await persist(); closeDialog(dialog); render()
  })
}

function recordDialog(record?: DealRecord): void {
  const casefile = activeCase()!
  const dialog = showDialog(`<form method="dialog" id="record-form">
    <div class="dialog-heading"><div><p class="eyebrow">${record ? 'Source record' : 'Add to thread'}</p><h2>${record ? `Edit ${esc(record.reference)}` : 'Add a record'}</h2></div><button class="close-button" value="cancel" aria-label="Close">×</button></div>
    <div class="form-grid"><label>Document type<select name="type">${recordTypes.map((type) => `<option value="${type}" ${type === record?.type ? 'selected' : ''}>${typeLabels[type]}</option>`).join('')}</select></label>
    <label>Reference<input name="reference" required maxlength="60" value="${esc(record?.reference ?? '')}" placeholder="e.g. INV-104"></label>
    <label>Date<input name="date" type="date" required value="${record?.date ?? today()}"></label>
    <label>Amount<input name="amount" inputmode="decimal" type="number" required min="0" step="0.01" value="${record?.amount ?? ''}"></label></div>
    <label>Links to document references <span class="label-hint">Separate several with semicolons</span><input name="links" value="${esc(record?.links.join('; ') ?? '')}" placeholder="e.g. QUO-101; INV-104" list="case-references"></label>
    <datalist id="case-references">${casefile.records.filter((item) => item.id !== record?.id).map((item) => `<option value="${esc(item.reference)}"></option>`).join('')}</datalist>
    <label>Note <span class="label-hint">What changed or why?</span><textarea name="note" maxlength="500" rows="3">${esc(record?.note ?? '')}</textarea></label>
    ${record ? `<div class="source-box"><strong>Source</strong><span>${record.source.kind === 'csv' ? `${esc(record.source.label)}, row ${record.source.row}` : 'Entered manually'}</span>${record.source.raw ? `<code>${esc(record.source.raw)}</code>` : ''}</div>` : ''}
    <p class="form-error" role="alert"></p><div class="dialog-actions"><button value="cancel">Cancel</button><button class="primary" value="default">${record ? 'Save record' : 'Add to thread'}</button></div>
    ${record ? `<button type="button" class="danger-link" data-action="delete-record" data-id="${record.id}">Delete this record</button>` : ''}
  </form>`)
  dialog.querySelector<HTMLFormElement>('#record-form')!.addEventListener('submit', async (event) => {
    event.preventDefault()
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null
    if (submitter?.value === 'cancel') { closeDialog(dialog); return }
    const form = event.currentTarget as HTMLFormElement
    const fields = new FormData(form)
    const reference = String(fields.get('reference') ?? '').trim()
    const amount = Number(fields.get('amount'))
    const duplicate = casefile.records.some((item) => item.id !== record?.id && item.reference.toLowerCase() === reference.toLowerCase())
    const error = dialog.querySelector<HTMLElement>('.form-error')!
    if (duplicate) { error.textContent = 'That reference already exists in this casefile. Use a distinct document reference.'; return }
    if (!reference || !Number.isFinite(amount) || amount < 0) { error.textContent = 'Add a reference and a valid non-negative amount.'; return }
    const now = new Date().toISOString()
    const values = { type: String(fields.get('type')) as RecordType, reference, date: String(fields.get('date')), amount, links: String(fields.get('links') ?? '').split(';').map((value) => value.trim()).filter(Boolean), note: String(fields.get('note') ?? '').trim(), updatedAt: now }
    if (record) Object.assign(record, values)
    else casefile.records.push({ id: crypto.randomUUID(), ...values, source: { kind: 'manual', label: 'Entered manually' }, createdAt: now })
    casefile.updatedAt = now; await persist(); closeDialog(dialog); render(); announce(record ? 'Record saved.' : 'Record added to the thread.')
  })
}

function importDialog(): void {
  importResult = null; importFileName = ''
  const dialog = showDialog(`<div class="dialog-heading"><div><p class="eyebrow">Tolerant import</p><h2>Bring in a CSV</h2></div><button class="close-button" data-action="close-dialog" aria-label="Close">×</button></div>
    <p>Required columns: <code>type, reference, date, amount</code>. Optional: <code>note, links</code>. Dates use YYYY-MM-DD; links use semicolons.</p>
    <label class="file-drop" for="csv-file"><strong>Choose a CSV file</strong><span>Malformed rows will be held back for review.</span></label><input id="csv-file" class="visually-hidden" type="file" accept="text/csv,.csv">
    <a class="template-link" href="data:text/csv;charset=utf-8,type%2Creference%2Cdate%2Camount%2Cnote%2Clinks%0Aquote%2CQUO-101%2C2026-08-01%2C2500%2COriginal%20quote%2C" download="deal-thread-template.csv">Download a CSV template</a>
    <div id="import-preview" aria-live="polite"></div>`, 'import-dialog')
  dialog.querySelector<HTMLInputElement>('#csv-file')!.addEventListener('change', async (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    importFileName = file.name
    importResult = parseImport(await file.text(), file.name)
    const seen = new Set(activeCase()!.records.map((record) => record.reference.toLowerCase()))
    const unique: DealRecord[] = []
    importResult.accepted.forEach((record) => {
      const key = record.reference.toLowerCase()
      if (seen.has(key)) importResult!.rejected.push({ row: record.source.row ?? 0, reason: 'reference already exists in this casefile or file', raw: record.source.raw ?? '' })
      else { seen.add(key); unique.push(record) }
    })
    importResult.accepted = unique
    renderImportPreview(dialog)
  })
}

function renderImportPreview(dialog: HTMLDialogElement): void {
  const preview = dialog.querySelector<HTMLElement>('#import-preview')!
  if (!importResult) return
  preview.innerHTML = `<div class="import-counts"><span class="accepted">${importResult.accepted.length} ready</span><span class="rejected">${importResult.rejected.length} held back</span></div>
    ${importResult.rejected.length ? `<details><summary>Review held-back rows</summary><ul class="issue-list">${importResult.rejected.slice(0, 20).map((issue) => `<li><strong>Row ${issue.row}</strong> ${esc(issue.reason)}<code>${esc(issue.raw)}</code></li>`).join('')}</ul>${importResult.rejected.length > 20 ? '<p>Only the first 20 are shown.</p>' : ''}</details><button data-action="download-rejected">Download held-back rows</button>` : '<p class="success-message">Every row passed the format checks.</p>'}
    <div class="dialog-actions"><button data-action="close-dialog">Cancel</button><button class="primary" data-action="commit-import" ${importResult.accepted.length ? '' : 'disabled'}>Import ${importResult.accepted.length} records</button></div>`
}

function aboutDialog(): void {
  showDialog(`<div class="dialog-heading"><div><p class="eyebrow">How it works</p><h2>A narrative, not a ledger</h2></div><button class="close-button" data-action="close-dialog" aria-label="Close">×</button></div><ol class="how-list"><li><strong>Add or import source records.</strong><span>Quotes, deliveries, invoices, credits, and payments.</span></li><li><strong>Link only what you know.</strong><span>Use document references; ambiguous amounts stay visible.</span></li><li><strong>Read and share the trail.</strong><span>Inspect source rows, export your data, or unlock a print-ready casefile.</span></li></ol>`)
}

function payDialog(): void {
  showDialog(`<div class="dialog-heading"><div><p class="eyebrow">One-time unlock</p><h2>Make the casefile printable</h2></div><button class="close-button" data-action="close-dialog" aria-label="Close">×</button></div><p class="lede small-lede">For $19 once, turn any thread into a polished print/PDF casefile with its arithmetic, links, notes, and source trail.</p><ul class="unlock-list"><li>All current and future casefiles</li><li>No subscription or account</li><li>Free CSV and JSON exports stay free</li></ul><a class="primary button-link" href="${checkoutUrl}">Buy the $19 unlock</a><hr><form id="license-form"><label>Have a license token?<input name="license" required autocomplete="off"></label><p class="form-error" role="alert"></p><button>Verify and restore</button></form><p class="fine-print">Checkout and refunds are handled by Sociobot/Dodo, the merchant of record. See <a href="/terms" data-route>terms</a> and <a href="/privacy" data-route>privacy</a>.</p>`)
  document.querySelector<HTMLFormElement>('#license-form')!.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const fields = new FormData(form); storeLicense(String(fields.get('license') ?? '')); const error = form.querySelector<HTMLElement>('.form-error')!; error.textContent = 'Checking license…'
    const valid = await verifyLicense(true)
    if (valid) { premium = true; closeDialog(); render(); announce('Casefile export unlocked.') } else error.textContent = 'That license is not active for Deal Thread. Check the token and try again.'
  })
}

async function persist(): Promise<void> { await saveData(data) }

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500)
}

function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'casefile' }

function exportCsv(casefile: Casefile): void {
  const header = ['type', 'reference', 'date', 'amount', 'note', 'links', 'source']
  const rows = casefile.records.map((record) => [record.type, record.reference, record.date, record.amount.toFixed(2), record.note, record.links.join('; '), record.source.kind === 'csv' ? `${record.source.label} row ${record.source.row}` : record.source.label])
  download(`${slug(casefile.name)}-records.csv`, [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'), 'text/csv;charset=utf-8')
}

function printCasefile(casefile: Casefile): void {
  const summary = summarize(casefile); const sorted = [...casefile.records].sort((a, b) => a.date.localeCompare(b.date)); const popup = window.open('', '_blank')
  if (!popup) { announce('Allow pop-ups to open the printable casefile.'); return }
  popup.document.write(`<!doctype html><html lang="en"><head><title>${esc(casefile.name)} — Deal Thread casefile</title><style>body{font:15px/1.5 system-ui;color:#1e2927;margin:48px}h1,h2{font-family:Georgia,serif}header{border-bottom:3px solid #315b75;padding-bottom:24px}dl{display:grid;grid-template-columns:1fr 1fr;max-width:440px}dt,dd{padding:8px;border-bottom:1px solid #dce4df;margin:0}li{padding:14px 0;border-bottom:1px solid #dce4df}.meta{color:#52615e}.warn{color:#70470f}@media print{body{margin:16mm}button{display:none}}</style></head><body><header><small>DEAL THREAD · EXPLAINABLE CASEFILE</small><h1>${esc(casefile.name)}</h1><p>${esc(casefile.customer)} · Generated ${new Date().toLocaleDateString()}</p></header><h2>Arithmetic</h2><dl><dt>Quoted</dt><dd>${formatMoney(summary.quoted, casefile.currency)}</dd><dt>Invoiced</dt><dd>${formatMoney(summary.invoiced, casefile.currency)}</dd><dt>Credits</dt><dd>− ${formatMoney(summary.credited, casefile.currency)}</dd><dt>Payments</dt><dd>− ${formatMoney(summary.paid, casefile.currency)}</dd><dt><strong>Still open</strong></dt><dd><strong>${formatMoney(summary.outstanding, casefile.currency)}</strong></dd></dl><h2>Document trail</h2><ol>${sorted.map((record) => `<li><strong>${typeLabels[record.type]} · ${esc(record.reference)}</strong> — ${formatMoney(record.amount, casefile.currency)}<br><span class="meta">${esc(record.date)} · ${record.links.length ? `Linked to ${record.links.map(esc).join(', ')}` : record.type === 'quote' ? 'Starting record' : '<span class="warn">No document link recorded</span>'} · ${record.source.kind === 'csv' ? `${esc(record.source.label)}, row ${record.source.row}` : 'Entered manually'}</span>${record.note ? `<br>${esc(record.note)}` : ''}</li>`).join('')}</ol><p class="meta">This casefile reports user-entered source records and explicit links. It does not claim automatic accounting reconciliation.</p><button onclick="window.print()">Print / save PDF</button></body></html>`)
  popup.document.close(); popup.focus(); setTimeout(() => popup.print(), 250)
}

function announce(message: string): void {
  let live = document.querySelector<HTMLElement>('#live-region')
  if (!live) { live = document.createElement('div'); live.id = 'live-region'; live.className = 'visually-hidden'; live.setAttribute('aria-live', 'polite'); document.body.append(live) }
  live.textContent = ''; setTimeout(() => { if (live) live.textContent = message }, 20)
  const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.textContent = message; document.body.append(toast); setTimeout(() => toast.remove(), 4000)
}

function updateNetworkStatus(): void {
  document.querySelector('.offline-banner')?.remove()
  if (!navigator.onLine) { const banner = document.createElement('div'); banner.className = 'offline-banner'; banner.setAttribute('role', 'status'); banner.textContent = 'Offline — your saved casefiles still work on this device.'; document.body.prepend(banner) }
}

document.addEventListener('click', async (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-route]')
  if (!target) return
  if (target.hasAttribute('data-route')) { event.preventDefault(); closeDialog(); history.pushState({}, '', (target as HTMLAnchorElement).href); render(); scrollTo(0, 0); return }
  const action = target.dataset.action
  if (action === 'new-case') caseDialog()
  else if (action === 'edit-case') caseDialog(activeCase()!)
  else if (action === 'add-record') recordDialog()
  else if (action === 'edit-record') recordDialog(activeCase()!.records.find((item) => item.id === target.dataset.id))
  else if (action === 'show-about') aboutDialog()
  else if (action === 'import-csv') importDialog()
  else if (action === 'close-dialog') closeDialog(target.closest('dialog'))
  else if (action === 'switch-case') { data.activeId = target.dataset.id ?? null; await persist(); render() }
  else if (action === 'load-example') await loadExample()
  else if (action === 'export-csv') exportCsv(activeCase()!)
  else if (action === 'export-json') download(`deal-thread-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
  else if (action === 'print-casefile') premium ? printCasefile(activeCase()!) : payDialog()
  else if (action === 'commit-import' && importResult) { const item = activeCase()!; item.records.push(...importResult.accepted); item.updatedAt = new Date().toISOString(); await persist(); closeDialog(); render(); announce(`${importResult.accepted.length} records imported. ${importResult.rejected.length} held back.`) }
  else if (action === 'download-rejected' && importResult) { download(`${importFileName.replace(/\.csv$/i, '')}-held-back.csv`, ['row,reason,source', ...importResult.rejected.map((issue) => [issue.row, issue.reason, issue.raw].map(csvEscape).join(','))].join('\n'), 'text/csv') }
  else if (action === 'delete-record') await deleteRecord(target.dataset.id!)
  else if (action === 'delete-case') await deleteCase()
  else if (action === 'import-backup') document.querySelector<HTMLInputElement>('#backup-file')?.click()
})

document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-undo]')
  if (button && deletedRecord) { const item = data.cases.find((entry) => entry.id === deletedRecord!.caseId); item?.records.push(deletedRecord.record); await persist(); deletedRecord = null; button.closest('.undo-toast')?.remove(); render(); announce('Record restored.') }
})

app.addEventListener('change', async (event) => {
  const input = event.target as HTMLInputElement
  if (input.id !== 'backup-file' || !input.files?.[0]) return
  try {
    const parsed = JSON.parse(await input.files[0].text()) as AppData
    if (parsed.version !== 1 || !Array.isArray(parsed.cases)) throw new Error('format')
    if (!confirm(`Import ${parsed.cases.length} casefiles and replace the data currently on this device? Export a backup first if needed.`)) return
    data = parsed; await persist(); render(); announce('JSON backup imported.')
  } catch { announce('That file is not a valid Deal Thread backup.') }
})

async function deleteRecord(id: string): Promise<void> {
  const item = activeCase()!; const record = item.records.find((entry) => entry.id === id); if (!record) return
  if (!confirm(`Delete ${record.reference}? You can undo this briefly.`)) return
  item.records = item.records.filter((entry) => entry.id !== id); item.updatedAt = new Date().toISOString(); deletedRecord = { caseId: item.id, record }; await persist(); closeDialog(); render()
  const toast = document.createElement('div'); toast.className = 'undo-toast'; toast.setAttribute('role', 'status'); toast.innerHTML = `<span>${esc(record.reference)} deleted.</span><button data-undo>Undo</button>`; document.body.append(toast); setTimeout(() => { toast.remove(); deletedRecord = null }, 8000)
}

async function deleteCase(): Promise<void> {
  const item = activeCase()!; if (!confirm(`Delete “${item.name}” and all ${item.records.length} records? This cannot be undone.`)) return
  data.cases = data.cases.filter((entry) => entry.id !== item.id); data.activeId = data.cases[0]?.id ?? null; await persist(); closeDialog(); render()
}

async function loadExample(): Promise<void> {
  const now = new Date().toISOString(); const id = crypto.randomUUID()
  const records: DealRecord[] = [
    ['quote', 'QUO-204', '2026-07-02', 4800, [], 'Original counter and shelving quote.'],
    ['delivery', 'DEL-204-A', '2026-07-18', 3000, ['QUO-204'], 'Counter and first shelving batch delivered.'],
    ['invoice', 'INV-318', '2026-07-19', 3000, ['QUO-204', 'DEL-204-A'], 'First-stage invoice.'],
    ['payment', 'PAY-882', '2026-07-25', 1800, ['INV-318'], 'Bank transfer received.'],
    ['credit', 'CR-044', '2026-08-03', 250, [], 'Shelf returned; the invoice link still needs confirming.'],
  ].map(([type, reference, date, amount, links, note]) => ({ id: crypto.randomUUID(), type: type as RecordType, reference: String(reference), date: String(date), amount: Number(amount), links: links as string[], note: String(note), source: { kind: 'manual', label: 'Sample record' }, createdAt: now, updatedAt: now }))
  data.cases.push({ id, name: 'Riverside shopfit', customer: 'Riverside Provisions', currency: 'USD', records, createdAt: now, updatedAt: now }); data.activeId = id; await persist(); render(); announce('Sample casefile added. Edit or delete it freely.')
}

window.addEventListener('popstate', render)
window.addEventListener('online', updateNetworkStatus)
window.addEventListener('offline', updateNetworkStatus)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) announce('A Deal Thread update is ready. Reload to use it.') })
    })
  }).catch(() => {})
}

render()
if (localStorage.getItem('sb_license:quote-payment-trail')) verifyLicense().then((valid) => { if (premium !== valid) { premium = valid; render() } })
