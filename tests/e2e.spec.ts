import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('creates a casefile and record with no serious accessibility issues', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Every amount/)
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

test('previously loaded app and data work offline', async ({ page, context }) => {
  await page.goto('/')
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller))
  await page.waitForFunction(async () => {
    const cache = await caches.open('deal-thread-shell-v4')
    return (await cache.keys()).some((request) => request.url.endsWith('.js'))
  })
  await page.getByRole('button', { name: 'Try a sample' }).click()
  await expect(page.getByRole('heading', { name: 'Riverside shopfit' })).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Offline — your saved casefiles still work on this device.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Riverside shopfit' })).toBeVisible()
})

test('imports good CSV rows while preserving malformed rows for review', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try a sample' }).click()
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
})

test('holds the verifier blank amount and impossible date rows back', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try a sample' }).click()
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

test('an arbitrary token cannot unlock PDF when verification fails offline or after reload', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try a sample' }).click()
  await page.getByRole('button', { name: 'Unlock PDF casefile' }).click()
  await page.getByLabel('Have a license token?').fill('arbitrary-offline-token')
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Verify and restore' }).click()
  await expect(page.getByText('That license is not active for Deal Thread.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Unlock PDF casefile' })).toBeVisible()
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

test('landing, paid dialog, and privacy remain accessible and private', async ({ page }) => {
  const externalRequests = new Set<string>()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname !== '127.0.0.1') externalRequests.add(url.origin)
  })

  await page.goto('/')
  let results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])

  await page.getByRole('button', { name: 'Try a sample' }).click()
  const trigger = page.getByRole('button', { name: 'Unlock PDF casefile' })
  await trigger.focus()
  await trigger.click()
  await expect(page.getByRole('heading', { name: 'Make the casefile printable' })).toBeVisible()
  results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()

  await page.goto('/privacy')
  results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  expect([...externalRequests]).toEqual([])
})

test('desktop and 390px mobile layouts do not overflow', async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.getByRole('button', { name: 'Try a sample' }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await context.close()
  }
})
