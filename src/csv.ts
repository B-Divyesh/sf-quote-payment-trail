import type { DealRecord, RecordType } from './types'
import { recordTypes } from './types'

export interface CsvIssue { row: number; reason: string; raw: string }
export interface CsvResult { accepted: DealRecord[]; rejected: CsvIssue[]; headers: string[] }

export function parseCsvRows(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (quoted && char === '"' && input[i + 1] === '"') { field += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { row.push(field.trim()); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1
      row.push(field.trim()); field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else field += char
  }
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const aliases: Record<string, string[]> = {
  type: ['type', 'document type', 'kind'],
  reference: ['reference', 'ref', 'document', 'number', 'id'],
  date: ['date', 'issued', 'transaction date'],
  amount: ['amount', 'total', 'value'],
  note: ['note', 'notes', 'description', 'memo'],
  links: ['links', 'linked to', 'related', 'related refs'],
}

function indexFor(headers: string[], field: string): number {
  return headers.findIndex((header) => aliases[field].includes(header.toLowerCase().trim()))
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

export function parseImport(input: string, sourceName: string, now = new Date().toISOString()): CsvResult {
  const rows = parseCsvRows(input.replace(/^\uFEFF/, ''))
  if (rows.length === 0) return { accepted: [], rejected: [{ row: 1, reason: 'The file is empty.', raw: '' }], headers: [] }
  const headers = rows[0]
  const idx = Object.fromEntries(Object.keys(aliases).map((key) => [key, indexFor(headers, key)])) as Record<string, number>
  const missing = ['type', 'reference', 'date', 'amount'].filter((key) => idx[key] < 0)
  if (missing.length) return { accepted: [], rejected: [{ row: 1, reason: `Missing columns: ${missing.join(', ')}.`, raw: headers.join(',') }], headers }
  const accepted: DealRecord[] = []
  const rejected: CsvIssue[] = []
  rows.slice(1).forEach((fields, offset) => {
    const rowNumber = offset + 2
    const rawType = (fields[idx.type] ?? '').toLowerCase().trim()
    const amountText = (fields[idx.amount] ?? '').replace(/[£$€,\s]/g, '').replace(/^\((.+)\)$/, '-$1')
    const amount = amountText === '' ? Number.NaN : Number(amountText)
    const dateText = (fields[idx.date] ?? '').trim()
    const date = isCalendarDate(dateText) ? dateText : ''
    const reference = (fields[idx.reference] ?? '').trim()
    const reasons: string[] = []
    if (!recordTypes.includes(rawType as RecordType)) reasons.push('type must be quote, delivery, invoice, credit, or payment')
    if (!reference) reasons.push('reference is blank')
    if (!date) reasons.push('date must be a real calendar date in YYYY-MM-DD')
    if (!Number.isFinite(amount) || amount < 0) reasons.push('amount must be a number that is zero or more')
    if (reasons.length) {
      rejected.push({ row: rowNumber, reason: reasons.join('; '), raw: fields.join(',') })
      return
    }
    accepted.push({
      id: crypto.randomUUID(), type: rawType as RecordType, reference, date, amount,
      note: idx.note >= 0 ? fields[idx.note] ?? '' : '',
      links: idx.links >= 0 ? (fields[idx.links] ?? '').split(/[;|]/).map((value) => value.trim()).filter(Boolean) : [],
      source: { kind: 'csv', label: sourceName, row: rowNumber, raw: fields.join(',') },
      createdAt: now, updatedAt: now,
    })
  })
  return { accepted, rejected, headers }
}

export function csvEscape(value: unknown): string {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
