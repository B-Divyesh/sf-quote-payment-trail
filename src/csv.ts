import type { DealRecord, RecordType } from './types'
import { recordTypes } from './types'

export interface CsvIssue { row: number; reason: string; raw: string }
export interface CsvResult { accepted: DealRecord[]; rejected: CsvIssue[]; headers: string[] }

interface ParsedRow { fields: string[]; row: number; raw: string }

function parseCsv(input: string): { rows: ParsedRow[]; syntaxIssues: CsvIssue[] } {
  const rows: ParsedRow[] = []
  const syntaxIssues: CsvIssue[] = []
  let fields: string[] = []
  let field = ''
  let quoted = false
  let line = 1
  let rowStart = 1
  let rawStart = 0

  const finishRow = (end: number) => {
    fields.push(field.trim())
    if (fields.some(Boolean)) rows.push({ fields, row: rowStart, raw: input.slice(rawStart, end).replace(/\r$/, '') })
    fields = []
    field = ''
  }

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (quoted && char === '"' && input[i + 1] === '"') { field += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { fields.push(field.trim()); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      finishRow(i)
      if (char === '\r' && input[i + 1] === '\n') i += 1
      line += 1; rowStart = line; rawStart = i + 1
    } else {
      field += char
      if (char === '\n') line += 1
    }
  }
  if (quoted) syntaxIssues.push({ row: rowStart, reason: 'CSV has an unterminated quoted field.', raw: input.slice(rawStart) })
  else if (fields.length || field || rawStart < input.length) finishRow(input.length)
  return { rows, syntaxIssues }
}

export function parseCsvRows(input: string): string[][] {
  return parseCsv(input).rows.map((row) => row.fields)
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
  const parsed = parseCsv(input.replace(/^\uFEFF/, ''))
  const rows = parsed.rows
  if (rows.length === 0) return { accepted: [], rejected: [{ row: 1, reason: 'The file is empty.', raw: '' }], headers: [] }
  const headers = rows[0].fields
  const idx = Object.fromEntries(Object.keys(aliases).map((key) => [key, indexFor(headers, key)])) as Record<string, number>
  const missing = ['type', 'reference', 'date', 'amount'].filter((key) => idx[key] < 0)
  if (missing.length) return { accepted: [], rejected: [{ row: rows[0].row, reason: `Missing columns: ${missing.join(', ')}.`, raw: rows[0].raw }], headers }
  const accepted: DealRecord[] = []
  const rejected: CsvIssue[] = [...parsed.syntaxIssues]
  rows.slice(1).forEach(({ fields, row: rowNumber, raw }) => {
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
      rejected.push({ row: rowNumber, reason: reasons.join('; '), raw })
      return
    }
    accepted.push({
      id: crypto.randomUUID(), type: rawType as RecordType, reference, date, amount,
      note: idx.note >= 0 ? fields[idx.note] ?? '' : '',
      links: idx.links >= 0 ? (fields[idx.links] ?? '').split(/[;|]/).map((value) => value.trim()).filter(Boolean) : [],
      source: { kind: 'csv', label: sourceName, row: rowNumber, raw },
      createdAt: now, updatedAt: now,
    })
  })
  return { accepted, rejected, headers }
}

export function csvEscape(value: unknown): string {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
