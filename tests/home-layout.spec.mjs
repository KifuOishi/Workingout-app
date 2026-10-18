import { test, expect } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('home workout actions fit above mobile navigation and preferences stay below content', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  for (const language of ['ja', 'en', 'es', 'zh']) {
    await page.locator('.settings select').first().selectOption(language)
    await page.reload()
    await expect(page.locator('header .settings')).toHaveCount(0)
    for (const action of await page.locator('.home-start .primary, .home-start .secondary').all()) {
      await expect(action).toBeInViewport({ ratio: 1 })
      const button = await action.boundingBox()
      const nav = await page.locator('.page-nav').boundingBox()
      expect(button.y + button.height).toBeLessThan(nav.y)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  }
  await page.locator('.settings select').first().selectOption('ja')
  await page.setViewportSize({ width: 390, height: 760 })
  await page.reload()
  await page.screenshot({ path: 'test-results/home-mobile.png' })
  await page.locator('.settings select').nth(1).selectOption('lb')
  for (const route of ['templates', 'calendar', 'history', 'progress']) {
    await page.locator(`.page-nav a[href="#/${route}"]`).click()
    await expect(page.locator('.preferences-panel')).toHaveCount(0)
  }
  await page.locator('.page-nav a[href="#/home"]').click()
  await expect(page.locator('.settings select').first()).toHaveValue('ja')
  await expect(page.locator('.settings select').nth(1)).toHaveValue('lb')
  await page.locator('.home-start .primary').click()
  await expect(page.locator('#current-workout')).toBeVisible()
  await expect(page.locator('.settings select').nth(1)).toHaveValue('lb')
  await page.locator('.page-nav a').first().click()
  await expect(page.locator('.home-start .primary')).toBeInViewport({ ratio: 1 })
  await page.locator('.home-start .primary').click()
  await expect(page.locator('#current-workout')).toBeVisible()
})
