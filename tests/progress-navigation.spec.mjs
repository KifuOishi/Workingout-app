import { test, expect } from '@playwright/test'
test.use({ hasTouch: true })

test('one tap opens progress from every other page without rendering home', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  for (const source of ['templates', 'history', 'calendar', 'workout']) {
    await page.goto(`/#/${source}`)
    await page.evaluate(() => {
      window.homeRendered = false
      window.routeObserver = new MutationObserver(() => { if (document.querySelector('.home-layout')) window.homeRendered = true })
      window.routeObserver.observe(document.querySelector('main'), { childList: true, subtree: true })
    })
    await page.locator('.page-nav a[href="#/progress"]').tap()
    await expect(page.locator('.training-progress')).toBeVisible()
    await expect(page).toHaveURL(/#\/progress$/)
    expect(await page.evaluate(() => { window.routeObserver.disconnect(); return window.homeRendered })).toBe(false)
    await page.goBack()
    await expect(page.locator(`.page-nav a[href="#/${source}"]`)).toHaveAttribute('aria-current', 'page')
    await page.goForward()
    await expect(page.locator('.training-progress')).toBeVisible()
  }
})

test('progress navigation opens its own page with empty records, reload and back on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  for (const language of ['en', 'ja', 'es', 'zh']) {
    await page.locator('.settings select').first().selectOption(language)
    await page.locator('.page-nav a[href="#/progress"]').tap()
    await expect(page).toHaveURL(/#\/progress$/)
    await expect(page.locator('.training-progress')).toBeVisible()
    await expect(page.locator('.home-layout')).toHaveCount(0)
    await page.reload()
    await expect(page.locator('.training-progress')).toBeVisible()
    await page.locator('.page-nav a[href="#/home"]').tap()
    await expect(page.locator('.home-layout')).toBeVisible()
    await page.goBack()
    await expect(page.locator('.training-progress')).toBeVisible()
    await page.locator('.page-nav a[href="#/home"]').tap()
  }
  await page.goto('/#progress')
  await expect(page.locator('.training-progress')).toBeVisible()
  await page.goto('/#/progress/')
  await expect(page.locator('.training-progress')).toBeVisible()
})
