import { describe, expect, it } from 'vitest'
import { summarize } from './calc'
import type { Casefile, DealRecord, RecordType } from './types'

const record = (type: RecordType, reference: string, amount: number, links: string[] = []): DealRecord => ({
  id: reference, type, reference, amount, links, date: '2026-08-01', note: '', source: { kind: 'manual', label: 'test' }, createdAt: '', updatedAt: '',
})

describe('case summary', () => {
  it('shows arithmetic without treating equal amounts as links', () => {
    const casefile: Casefile = { id: 'c', name: 'Case', customer: '', currency: 'USD', createdAt: '', updatedAt: '', records: [
      record('quote', 'Q-1', 1000), record('invoice', 'I-1', 700), record('credit', 'C-1', 100, ['I-1']), record('payment', 'P-1', 600, ['I-1']),
    ] }
    const result = summarize(casefile)
    expect(result).toMatchObject({ quoted: 1000, invoiced: 700, credited: 100, netBilled: 600, paid: 600, outstanding: 0 })
    expect(result.unlinked.map((item) => item.reference)).toEqual(['I-1'])
  })

  it('separately reports references that do not exist', () => {
    const casefile: Casefile = { id: 'c', name: 'Case', customer: '', currency: 'USD', createdAt: '', updatedAt: '', records: [record('payment', 'P-1', 50, ['I-MISSING'])] }
    expect(summarize(casefile).invalidLinks[0].links).toEqual(['I-MISSING'])
  })
})
