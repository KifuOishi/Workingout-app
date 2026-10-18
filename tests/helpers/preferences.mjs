import { expect } from '@playwright/test'

// Change preferences through one of the screens where they are available.
export async function selectPreference(page, preference, value) {
  const selector = page.locator('.settings select').nth(preference === 'language' ? 0 : 1)
  if (await selector.count()) {
    await selector.selectOption(value)
    return
  }
  const route = await page.locator('.page-nav a[aria-current="page"]').getAttribute('href')
  const openSections = await page.locator('.progress-disclosure').evaluateAll(elements => elements.map(element => element.open))
  await page.locator('.page-nav a[href="#/home"]').click()
  await selector.selectOption(value)
  await page.locator(`.page-nav a[href="${route}"]`).click()
  await expect(page.locator(`.page-nav a[href="${route}"]`)).toHaveAttribute('aria-current', 'page')
  for (let index = 0; index < openSections.length; index++) {
    if (openSections[index]) await page.locator('.progress-disclosure > summary').nth(index).click()
  }
}
