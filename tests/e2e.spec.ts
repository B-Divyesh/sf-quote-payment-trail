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
    const cache = await caches.open('deal-thread-shell-v3')
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
  await expect(page.getByText(/reference is blank/)).toBeVisible()
  await page.getByRole('button', { name: 'Import 1 records' }).click()
  await expect(page.getByRole('button', { name: /Edit Invoice INV-500/ })).toBeVisible()
})
