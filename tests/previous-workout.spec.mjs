import { test, expect } from '@playwright/test'

test('previous set results convert between lb and kg and use the latest matching exercise', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00') })
  await page.goto('/')
  await page.evaluate(() => {
    const base = { exercise: 'Unit exercise', category: '胸', weight: 45.359237, reps: 8, sets: 2, note: '' }
    const latest = { ...base, id: 'latest', date: '2026-10-14', weight: 61.23496995, reps: 5, setDetails: [{ weight: 61.23496995, reps: 5 }, { weight: 83.91458845, reps: 3 }] }
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { ...base, id: 'older', date: '2026-10-13' }, latest,
      { ...base, id: 'other-group', category: '肩', date: '2026-10-15', weight: 999 },
      { ...base, id: 'future', date: '2026-10-16', weight: 888 },
    ]))
    localStorage.setItem('workingout.exercises.v1', JSON.stringify([{ category: '胸', name: 'Unit exercise' }]))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start empty workout', exact: true }).click()
  const active = page.locator('#current-workout')
  await active.locator('.session-exercise-actions').getByRole('button').click()
  await page.locator('.session-add-form').getByRole('combobox').selectOption({ label: 'Unit exercise' })
  await page.getByRole('button', { name: 'Add to workout', exact: true }).click()
  await expect(active.locator('.previous-set').first()).toHaveText('61.23 kg × 5')
  await expect(active.locator('.previous-summary time').first()).toHaveAttribute('datetime', '2026-10-14')
  await expect(active.locator('.previous-summary').first()).not.toContainText('?')
  await active.getByRole('button', { name: 'Add set', exact: false }).click()
  await expect(active.locator('.previous-set').nth(1)).toHaveText('83.91 kg × 3')
  await page.getByLabel('Weight unit', { exact: true }).selectOption('lb')
  await expect(active.locator('.previous-set').first()).toHaveText('135 lb × 5')
  await expect(active.locator('.previous-set').nth(1)).toHaveText('185 lb × 3')
  await page.reload()
  await expect(active.locator('.previous-set').first()).toHaveText('135 lb × 5')
  await page.getByLabel('Weight unit', { exact: true }).selectOption('kg')
  await expect(active.locator('.previous-set').first()).toHaveText('61.23 kg × 5')
  await active.getByRole('button', { name: 'Add set', exact: false }).click()
  await expect(active.locator('.previous-set').nth(2)).toHaveText('—')
})
