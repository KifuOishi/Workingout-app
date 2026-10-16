import { test, expect } from '@playwright/test'

test('responsive pages across four languages, touch targets and bottom navigation', async ({ page }) => {
  await page.goto('/#/templates')
  await page.getByRole('button', { name: 'Create template', exact: true }).click()
  await page.getByLabel('Template name').fill('Upper body / Strength & movement')
  const editor = page.locator('.template-editor')
  await editor.getByRole('button', { name: 'Add exercise' }).click()
  await editor.getByRole('button', { name: 'Save template' }).click()
  await page.getByRole('button', { name: 'Start workout', exact: true }).click()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    for (const language of ['en', 'ja', 'es', 'zh']) {
      await page.locator('.settings select').first().selectOption(language)
      for (const route of ['home', 'workout', 'templates', 'calendar', 'history', 'progress']) {
        await page.locator(`.page-nav a[href="#/${route}"]`).click()
        await expect(page.locator(`.page-nav a[href="#/${route}"]`)).toHaveAttribute('aria-current', 'page')
        const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
        expect(layout.scrollWidth, `${width}px / ${language} / ${route}`).toBeLessThanOrEqual(layout.width)
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.settings select').first().selectOption('en')
  await page.locator('.page-nav a[href="#/home"]').click()
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true, animations: 'disabled' })
  const nav = await page.locator('.page-nav').boundingBox()
  expect(nav.y).toBeGreaterThan(700)
  expect(nav.y + nav.height).toBeLessThanOrEqual(844)
  await page.locator('.page-nav a[href="#/workout"]').click()
  const check = await page.locator('.set-check').first().boundingBox()
  expect(check.width).toBeGreaterThanOrEqual(44)
  expect(check.height).toBeGreaterThanOrEqual(44)
  const inputSize = await page.locator('.set-card-fields input').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  expect(inputSize).toBeGreaterThanOrEqual(16)
  await page.locator('#current-workout').screenshot({ path: 'test-results/mobile-workout.png', animations: 'disabled' })
})
