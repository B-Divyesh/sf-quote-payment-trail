import { beforeEach, describe, expect, it, vi } from 'vitest'

const values = new Map<string, string>()
const localStorage = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  removeItem: vi.fn((key: string) => values.delete(key)),
}

vi.stubGlobal('localStorage', localStorage)

const { hasOptimisticUnlock, storeLicense, verifyLicense } = await import('./license')
const tokenKey = 'sb_license:quote-payment-trail'
const verdictKey = 'sb_license_verdict:quote-payment-trail'

describe('license trust', () => {
  beforeEach(() => {
    values.clear()
    vi.restoreAllMocks()
    vi.stubGlobal('localStorage', localStorage)
  })

  it('never optimistically unlocks a newly pasted or legacy unverified token', () => {
    storeLicense('arbitrary-offline-token')
    expect(hasOptimisticUnlock()).toBe(false)

    values.set(verdictKey, JSON.stringify({ valid: true, checkedAt: 0 }))
    expect(hasOptimisticUnlock()).toBe(false)
  })

  it('stays locked when first verification is unavailable, including after reload', async () => {
    storeLicense('arbitrary-offline-token')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(verifyLicense(true)).resolves.toBe(false)
    expect(values.get(tokenKey)).toBe('arbitrary-offline-token')
    expect(hasOptimisticUnlock()).toBe(false)
  })

  it('optimistically retains only the same token after a server-valid verdict', async () => {
    storeLicense('server-valid-token')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, reason: 'ok' }),
    }))

    await expect(verifyLicense(true)).resolves.toBe(true)
    expect(hasOptimisticUnlock()).toBe(true)
    values.set(tokenKey, 'different-token')
    expect(hasOptimisticUnlock()).toBe(false)
  })
})
