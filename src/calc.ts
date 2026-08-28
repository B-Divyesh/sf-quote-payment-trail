import type { Casefile, DealRecord, RecordType } from './types'

export interface CaseSummary {
  quoted: number
  delivered: number
  invoiced: number
  credited: number
  netBilled: number
  paid: number
  outstanding: number
  unlinked: DealRecord[]
  invalidLinks: { record: DealRecord; links: string[] }[]
}

const sum = (records: DealRecord[], type: RecordType) => records.filter((record) => record.type === type).reduce((total, record) => total + record.amount, 0)

export function summarize(casefile: Casefile): CaseSummary {
  const references = new Set(casefile.records.map((record) => record.reference.toLowerCase()))
  const quoted = sum(casefile.records, 'quote')
  const delivered = sum(casefile.records, 'delivery')
  const invoiced = sum(casefile.records, 'invoice')
  const credited = sum(casefile.records, 'credit')
  const paid = sum(casefile.records, 'payment')
  const invalidLinks = casefile.records.map((record) => ({ record, links: record.links.filter((link) => !references.has(link.toLowerCase())) })).filter((item) => item.links.length)
  const unlinked = casefile.records.filter((record) => record.type !== 'quote' && record.links.length === 0)
  return { quoted, delivered, invoiced, credited, netBilled: invoiced - credited, paid, outstanding: invoiced - credited - paid, unlinked, invalidLinks }
}

export function formatMoney(amount: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount) }
  catch { return `${currency} ${amount.toFixed(2)}` }
}
