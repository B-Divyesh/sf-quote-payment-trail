import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('@claim:casefile-workflow creates a casefile and record with no serious accessibility issues', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Explain each deal/)
  await page.getByRole('button', { name: 'Start a casefile' }).click()
  await page.getByLabel('Case name').fill('Oak Street repair')
  await page.getByLabel('Customer or counterparty').fill('Oak Street Café')
  await page.getByRole('button', { name: 'Create casefile' }).click()
  await page.getByRole('button', { name: 'Add record', exact: true }).first().click()
  await page.getByLabel('Reference', { exact: true }).fill('Q-100')
  await page.getByLabel('Amount').fill('1250')
  await page.getByRole('button', { name: 'Add to thread' }).click()
  await expect(page.getByRole('button', { name: /Edit Quote Q-100/ })).toBeVisible()
  const results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
})

test('@claim:offline-reload works offline after the first visit', async ({ page, context }) => {
  await page.goto('/demo')
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller))
  await page.waitForFunction(async () => {
    const cache = await caches.open('deal-thread-shell-v5')
    return (await cache.keys()).some((request) => request.url.endsWith('.js'))
  })
  await expect(page.getByRole('heading', { name: 'Riverside shopfit' })).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Offline — your saved casefiles still work on this device.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Riverside shopfit' })).toBeVisible()
})

test('@claim:source-provenance imports source rows that remain visible', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Import CSV' }).click()
  await page.locator('#csv-file').setInputFiles({
    name: 'mixed-records.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('type,reference,date,amount,note,links\ninvoice,INV-500,2026-08-20,400,Second stage,QUO-204\npayment,,20/08/2026,nope,Broken,INV-500'),
  })
  await expect(page.getByText('1 ready')).toBeVisible()
  await expect(page.getByText('1 held back')).toBeVisible()
  await page.getByText('Review held-back rows').click()
  await expect(page.getByText(/reference is blank/)).toBeVisible()
  await page.getByRole('button', { name: 'Import 1 records' }).click()
  await expect(page.getByRole('button', { name: /Edit Invoice INV-500/ })).toBeVisible()
  await page.getByRole('button', { name: /Edit Invoice INV-500/ }).click()
  await expect(page.getByText('mixed-records.csv, row 2')).toBeVisible()
})

test('@claim:ambiguity-visible shows sample records that still need a link', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('1 record needs a link')).toBeVisible()
  await expect(page.getByText('Needs a link').last()).toBeVisible()
})

test('@claim:csv-malformed-held holds malformed CSV rows back', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Import CSV' }).click()
  await page.locator('#csv-file').setInputFiles({
    name: 'verifier-malformed.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('type,reference,date,amount,note,links\ninvoice,INV-BLANK,2026-08-30,,Blank amount,Q-100\ninvoice,INV-BADDATE,2026-02-30,10,Impossible date,Q-100'),
  })
  await expect(page.getByText('0 ready')).toBeVisible()
  await expect(page.getByText('2 held back')).toBeVisible()
  await page.getByText('Review held-back rows').click()
  await expect(page.getByText(/amount must be a number/)).toBeVisible()
  await expect(page.getByText(/real calendar date/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import 0 records' })).toBeDisabled()
})

test('regression: holds an unterminated quoted CSV field back', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Import CSV' }).click()
  await page.locator('#csv-file').setInputFiles({
    name: 'unterminated.csv', mimeType: 'text/csv',
    buffer: Buffer.from('type,reference,date,amount,note\ninvoice,INV-UNTERMINATED,2026-08-20,42,"Unclosed note'),
  })
  await expect(page.getByText('0 ready')).toBeVisible()
  await expect(page.getByText('1 held back')).toBeVisible()
  await page.getByText('Review held-back rows').click()
  await expect(page.getByText('CSV has an unterminated quoted field.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import 0 records' })).toBeDisabled()
})

test('an arbitrary token cannot unlock PDF when verification fails offline or after reload', async ({ page, context }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Restore casefile license' }).click()
  await page.getByLabel('Casefile license token').fill('arbitrary-offline-token')
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Verify and restore' }).click()
  await expect(page.getByText('That license is not active for Deal Thread.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Restore casefile license' })).toBeVisible()
  await expect(page.getByText('Casefile unlocked')).toHaveCount(0)
})

test('390px footer links meet the touch target baseline and keyboard focus remains visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/privacy')
  const targets = await page.locator('footer a').evaluateAll((links) => links.map((link) => {
    const bounds = link.getBoundingClientRect()
    return { width: bounds.width, height: bounds.height }
  }))
  expect(targets.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true)

  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  const outline = await page.locator('.skip-link').evaluate((link) => getComputedStyle(link).outlineWidth)
  expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(3)
})

test('@claim:local-only demo data stays on this device without third-party requests', async ({ page }) => {
  const externalRequests = new Set<string>()
  const appOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173').origin
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin !== appOrigin) externalRequests.add(url.origin)
  })

  await page.goto('/demo')
  let results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])

  const trigger = page.getByRole('button', { name: 'Restore casefile license' })
  await trigger.focus()
  await trigger.click()
  await expect(page.getByRole('heading', { name: 'Restore casefile printing' })).toBeVisible()
  results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()

  await page.goto('/privacy?demo=1')
  results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  expect([...externalRequests]).toEqual([])
})

test('@claim:demo-isolated sample data is direct, resettable, and separate from real data', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start a casefile' }).click()
  await page.getByLabel('Case name').fill('Real data only')
  await page.getByRole('button', { name: 'Create casefile' }).click()
  await page.goto('/demo')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Riverside shopfit' })).toBeVisible()
  await expect(page.getByText('Real data only')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByRole('heading', { name: 'Riverside shopfit' })).toBeVisible()
  await page.getByRole('link', { name: 'Start for real' }).click()
  await expect(page.getByRole('heading', { name: 'Real data only' })).toBeVisible()
})

test('@claim:csv-export exports one source row per record', async ({ page }) => {
  await page.goto('/demo')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export records as CSV' }).click()
  const download = await downloadPromise
  const text = await (await download.createReadStream())?.toArray()
  const csv = Buffer.concat(text ?? []).toString('utf8').trim().split('\n')
  expect(csv[0]).toContain('type,reference,date,amount')
  expect(csv).toHaveLength(6)
})

test('@claim:json-export exports the demo casefile as JSON', async ({ page }) => {
  await page.goto('/demo')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON backup' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const content = Buffer.concat(stream ? await stream.toArray() : []).toString('utf8')
  expect(JSON.parse(content)).toMatchObject({ version: 1, cases: [expect.objectContaining({ name: 'Riverside shopfit', records: expect.any(Array) })] })
})

test('route navigation focuses and announces the new page, with a styled unknown route', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('link', { name: 'Privacy' }).focus()
  await page.getByRole('link', { name: 'Privacy' }).press('Enter')
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeFocused()
  await expect(page.locator('#live-region')).toContainText('Privacy page loaded.')
  await expect(page).toHaveTitle('Privacy — Deal Thread')
  await page.goto('/not-a-real-page')
  await expect(page.getByRole('heading', { name: 'That page is not in this casefile.' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found — Deal Thread')
})

test('desktop and 390px mobile layouts do not overflow', async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto('/demo')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await context.close()
  }
})
