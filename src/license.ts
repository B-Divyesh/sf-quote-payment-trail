const SLUG = 'quote-payment-trail'
const API = 'https://api.sociobot.in/api/v1'
const LICENSE_KEY = `sb_license:${SLUG}`
const VERDICT_KEY = `sb_license_verdict:${SLUG}`
const DAY = 86_400_000

interface Verdict { valid: boolean; checkedAt: number; token: string; reason?: string }

export function captureLicense(): string | null {
  const url = new URL(location.href)
  const token = url.searchParams.get('license')
  if (token) {
    saveUnverifiedToken(token)
    url.searchParams.delete('license')
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }
  return token
}

export function storeLicense(token: string): void {
  saveUnverifiedToken(token)
}

function saveUnverifiedToken(token: string): void {
  const normalized = token.trim()
  localStorage.setItem(LICENSE_KEY, normalized)
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: false, checkedAt: 0, token: normalized, reason: 'unverified' } satisfies Verdict))
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
    return verdict.valid === true && verdict.checkedAt > 0 && verdict.token === token
  } catch { return false }
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = localStorage.getItem(LICENSE_KEY)
  if (!token) return false
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as Verdict
    if (!force && cached.token === token && cached.checkedAt > 0 && Date.now() - cached.checkedAt < DAY) return cached.valid
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`)
    if (!response.ok) throw new Error('Verification unavailable')
    const result = await response.json() as { valid: boolean; reason?: string }
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now(), token } satisfies Verdict))
    return result.valid
  } catch { return hasOptimisticUnlock() }
}
