import { test, expect } from '@playwright/test'

test('perform again replaces an untouched empty workout with the saved sets', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('workingout.records.v1', JSON.stringify([{ id: 'saved', date: '2026-10-14', exercise: 'Saved lift', weight: 82.5, reps: 6, sets: 2, note: 'Saved note', setDetails: [{ weight: 82.5, reps: 6 }, { weight: 85, reps: 5 }] }])))
  await page.reload()
  await page.getByRole('button', { name: 'Start empty workout', exact: true }).click()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  await page.getByRole('button', { name: 'Workout actions', exact: true }).first().click()
  await page.getByRole('button', { name: 'Perform again', exact: true }).click()
  const active = page.locator('#current-workout')
  await expect(active.getByRole('heading', { name: 'Saved lift', exact: true })).toBeVisible({ timeout: 1500 })
  await expect(active.getByRole('checkbox')).toHaveCount(2)
  await expect(active.getByRole('spinbutton', { name: 'Weight 1 (kg)', exact: true })).toHaveValue('82.5')
  await expect(active.getByRole('spinbutton', { name: 'Weight 2 (kg)', exact: true })).toHaveValue('85')
  await expect(active.getByRole('checkbox').first()).not.toBeChecked()
  await page.reload()
  await expect(active.getByRole('checkbox')).toHaveCount(2)
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('workingout.planner.v1')).session)
  expect(persisted.items[0].exercise).toBe('Saved lift')
  expect(persisted.items[0].note).toBe('Saved note')
})

test('repeat this day also fills an empty workout and keeps lb display', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { id: 'one', date: '2026-10-14', exercise: 'First exercise', weight: 45.359237, reps: 8, sets: 2, note: '' },
      { id: 'two', date: '2026-10-14', exercise: 'Second exercise', weight: 20, reps: 12, sets: 3, note: '' },
    ]))
    localStorage.setItem('workingout.settings.v1', '{"language":"en","unit":"lb"}')
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start empty workout', exact: true }).click()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat this day', exact: true }).click()
  const active = page.locator('#current-workout')
  await expect(active.getByRole('heading', { name: 'First exercise', exact: true })).toBeVisible()
  await expect(active.getByRole('heading', { name: 'Second exercise', exact: true })).toBeVisible()
  await expect(active.getByRole('checkbox')).toHaveCount(5)
  await expect(active.getByRole('spinbutton', { name: 'Weight 1 (lb)', exact: true }).first()).toHaveValue('100')
})
