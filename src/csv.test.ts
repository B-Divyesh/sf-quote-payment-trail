import { describe, expect, it } from 'vitest'
import { parseCsvRows, parseImport } from './csv'

describe('CSV parser', () => {
  it('keeps commas and newlines inside quoted fields', () => {
    expect(parseCsvRows('type,note\ninvoice,"First, stage\nwith fitting"')).toEqual([
      ['type', 'note'], ['invoice', 'First, stage\nwith fitting'],
    ])
  })

  it('accepts valid rows and holds malformed rows back with source numbers', () => {
    const result = parseImport(`type,reference,date,amount,note,links
quote,Q-1,2026-08-01,"1,200",Original,
invoice,I-1,2026-08-10,600,Part one,Q-1
payment,,08/12/2026,nope,Bad row,I-1`, 'records.csv', '2026-08-28T00:00:00.000Z')
    expect(result.accepted).toHaveLength(2)
    expect(result.accepted[0]).toMatchObject({ type: 'quote', reference: 'Q-1', amount: 1200, source: { row: 2 } })
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0].row).toBe(4)
    expect(result.rejected[0].reason).toContain('reference is blank')
  })

  it('reports missing headers instead of silently guessing', () => {
    const result = parseImport('name,total\nInvoice,20', 'wrong.csv')
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected[0].reason).toContain('Missing columns')
  })

  it('holds blank amounts and impossible calendar dates back without normalizing them', () => {
    const result = parseImport(`type,reference,date,amount,note,links
invoice,INV-BLANK,2026-08-30,,Blank amount,Q-100
invoice,INV-BADDATE,2026-02-30,10,Impossible date,Q-100
invoice,INV-ZERO,2026-02-28,0,Real zero,Q-100`, 'verifier.csv')

    expect(result.accepted).toHaveLength(1)
    expect(result.accepted[0]).toMatchObject({ reference: 'INV-ZERO', date: '2026-02-28', amount: 0 })
    expect(result.rejected).toHaveLength(2)
    expect(result.rejected[0]).toMatchObject({ row: 2, raw: 'invoice,INV-BLANK,2026-08-30,,Blank amount,Q-100' })
    expect(result.rejected[0].reason).toContain('amount must be a number')
    expect(result.rejected[1]).toMatchObject({ row: 3, raw: 'invoice,INV-BADDATE,2026-02-30,10,Impossible date,Q-100' })
    expect(result.rejected[1].reason).toContain('real calendar date')
  })
})
