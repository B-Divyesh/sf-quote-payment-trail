export const recordTypes = ['quote', 'delivery', 'invoice', 'credit', 'payment'] as const
export type RecordType = (typeof recordTypes)[number]

export interface DealRecord {
  id: string
  type: RecordType
  reference: string
  date: string
  amount: number
  note: string
  links: string[]
  source: { kind: 'manual' | 'csv'; label: string; row?: number; raw?: string }
  createdAt: string
  updatedAt: string
}

export interface Casefile {
  id: string
  name: string
  customer: string
  currency: string
  createdAt: string
  updatedAt: string
  records: DealRecord[]
}

export interface AppData {
  version: 1
  activeId: string | null
  cases: Casefile[]
}

export const emptyData = (): AppData => ({ version: 1, activeId: null, cases: [] })
