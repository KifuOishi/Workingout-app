import { test, expect } from '@playwright/test'

test('collapsed history exposes editing and confirmed workout deletion', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const base = { date: '2026-10-14', weight: 30, reps: 10, sets: 3, note: '' }
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { ...base, id: 'one', exercise: 'Press', workoutId: 'morning' },
      { ...base, id: 'two', exercise: 'Row', workoutId: 'morning' },
      { ...base, id: 'other', exercise: 'Squat', workoutId: 'evening' },
    ]))
  })
  await page.reload()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  const card = page.locator('.workout-history-card').first()
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(card.getByRole('button', { name: 'Perform again', exact: true })).toBeHidden()
  await card.getByRole('button', { name: 'Workout actions', exact: true }).click()
  await expect(card.getByRole('button', { name: 'Perform again', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(card.getByRole('button', { name: 'Perform again', exact: true })).toBeHidden()
  await expect(card.locator('details')).not.toHaveAttribute('open')
  await card.getByRole('button', { name: 'Workout actions', exact: true }).first().click()
  await card.locator('.workout-history-actions').getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(card.locator('details')).toHaveAttribute('open', '')
  await card.getByRole('button', { name: 'Edit: Press', exact: true }).click()
  await expect(page.locator('#record-form')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel editing', exact: true }).click()
  await card.locator('summary').click()
  await card.getByRole('button', { name: 'Workout actions', exact: true }).first().click()
  await card.locator('.workout-history-actions').getByRole('button', { name: 'Delete', exact: true }).click()
  await card.getByRole('alert').getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('.workout-history-card')).toHaveCount(2)
  await card.getByRole('button', { name: 'Workout actions', exact: true }).first().click()
  await card.locator('.workout-history-actions').getByRole('button', { name: 'Delete', exact: true }).click()
  await card.getByRole('alert').getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.locator('.workout-history-card')).toHaveCount(1)
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('workingout.records.v1')))
  expect(records.map(record => record.id)).toEqual(['other'])
})
