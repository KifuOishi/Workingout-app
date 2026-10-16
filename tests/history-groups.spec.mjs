import { test, expect } from '@playwright/test'

test('history groups each workout under its date, expands details and repeats the full workout', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const base = { date: '2026-10-14', weight: 30, reps: 10, sets: 3, note: '' }
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { ...base, id: 'one', exercise: 'Morning press', workoutId: 'morning', workoutName: 'Morning session', finishedAt: 100, durationSeconds: 600 },
      { ...base, id: 'two', exercise: 'Morning row', workoutId: 'morning', workoutName: 'Morning session', finishedAt: 100, durationSeconds: 600 },
      { ...base, id: 'three', exercise: 'Evening squat', workoutId: 'evening', workoutName: 'Evening session', finishedAt: 200, durationSeconds: 900 },
      { ...base, id: 'four', exercise: 'Evening lunge', workoutId: 'evening', workoutName: 'Evening session', finishedAt: 200, durationSeconds: 900 },
      { ...base, id: 'manual', date: '2026-10-13', exercise: 'Manual record' },
    ]))
  })
  await page.reload()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  await expect(page.locator('.day')).toHaveCount(2)
  await expect(page.locator('.workout-history-card')).toHaveCount(3)
  const cards = page.locator('.workout-history-card')
  await expect(cards.first().locator('summary')).toContainText('Evening session')
  await expect(cards.first().locator('summary')).toContainText('15:00')
  await expect(cards.first().locator('.record').first()).toBeHidden()
  await cards.first().locator('summary').click()
  await expect(cards.first().getByRole('heading', { name: /^Evening squat/ })).toBeVisible()
  await expect(cards.first().getByRole('heading', { name: /^Evening lunge/ })).toBeVisible()
  await expect(cards.nth(1).locator('.record').first()).toBeHidden()
  await cards.first().locator('summary').click()
  await expect(cards.first().locator('.record').first()).toBeHidden()
  await cards.first().getByRole('button', { name: 'Workout actions', exact: true }).first().click()
  await cards.first().getByRole('button', { name: 'Perform again', exact: true }).click()
  await expect(page.locator('#current-workout').getByRole('checkbox')).toHaveCount(6)
  await expect(page.locator('#current-workout').getByRole('heading', { name: 'Evening lunge', exact: true })).toBeVisible()
})

test('older session IDs are grouped without combining unrelated manual records', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const base = { date: '2026-10-14', weight: 20, reps: 10, sets: 1, note: '' }
    const id = '00000000-0000-4000-8000-000000000001'
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { ...base, id: `session-${id}-a`, exercise: 'Old first' },
      { ...base, id: `session-${id}-b`, exercise: 'Old second' },
      { ...base, id: 'manual-a', exercise: 'Separate manual record' },
    ]))
  })
  await page.reload()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  await expect(page.locator('.workout-history-card')).toHaveCount(2)
  await page.locator('.workout-history-card').first().locator('summary').click()
  await expect(page.locator('.workout-history-card').first().locator('.record')).toHaveCount(2)
  await expect(page.locator('.workout-history-card').first().locator('summary')).not.toContainText('0:00')
})
