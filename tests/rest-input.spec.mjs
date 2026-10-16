import { test, expect } from '@playwright/test'

test('rest interval fields can be cleared and replaced with single digits', async ({ page }) => {
  await page.goto('/#/workout')
  await page.getByRole('button', { name: 'Start empty workout', exact: true }).click()
  const active = page.locator('#current-workout')
  await active.locator('.session-exercise-actions').getByRole('button').click()
  await page.getByRole('button', { name: 'Add to workout', exact: true }).click()
  const row = active.getByRole('spinbutton', { name: 'Rest interval 1', exact: true })
  const timer = active.locator('.rest-timer input[type="number"]')
  for (const input of [row, timer]) {
    for (const value of ['2', '3', '4', '9', '0']) {
      await input.focus()
      await input.press('ControlOrMeta+A')
      await input.press('Backspace')
      await expect(input).toHaveValue('')
      await input.press(value)
      await expect(input).toHaveValue(value)
      await input.blur()
      await expect(input).toHaveValue(value)
    }
  }
  await row.fill('2')
  await timer.fill('3')
  await timer.blur()
  await page.reload()
  await expect(row).toHaveValue('2')
  await expect(timer).toHaveValue('3')
  await row.fill('')
  await row.blur()
  await expect(row).toHaveValue('0')
  await expect(active.getByRole('button', { name: 'Start rest', exact: true })).toBeEnabled()
})
