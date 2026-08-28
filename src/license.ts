const SLUG = 'quote-payment-trail'
const API = 'https://api.sociobot.in/api/v1'
const LICENSE_KEY = `sb_license:${SLUG}`
const VERDICT_KEY = `sb_license_verdict:${SLUG}`
const DAY = 86_400_000

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

export const checkoutUrl = `${API}/products/${SLUG}/checkout`

export function captureLicense(): string | null {
  const url = new URL(location.href)
  const token = url.searchParams.get('license')
  if (token) {
    localStorage.setItem(LICENSE_KEY, token)
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 } satisfies Verdict))
    url.searchParams.delete('license')
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }
  return token
}

export function storeLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim())
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 } satisfies Verdict))
}

export function clearLicense(): void {
  localStorage.removeItem(LICENSE_KEY)
  localStorage.removeItem(VERDICT_KEY)
}

export function hasOptimisticUnlock(): boolean {
  const token = localStorage.getItem(LICENSE_KEY)
  if (!token) return false
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as Verdict
    return verdict.valid !== false
  } catch { return true }
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = localStorage.getItem(LICENSE_KEY)
  if (!token) return false
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as Verdict
    if (!force && cached.checkedAt && Date.now() - cached.checkedAt < DAY) return cached.valid
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`)
    if (!response.ok) throw new Error('Verification unavailable')
    const result = await response.json() as { valid: boolean; reason?: string }
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() } satisfies Verdict))
    return result.valid
  } catch { return hasOptimisticUnlock() }
}
