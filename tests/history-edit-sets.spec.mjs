import { test, expect } from '@playwright/test'

for (const legacy of [false, true]) {
  test(`history edits individual sets and persists them (${legacy ? 'legacy' : 'detailed'})`, async ({ page }) => {
    await page.goto('/')
    await page.evaluate(legacy => {
      localStorage.setItem('workingout.records.v1', JSON.stringify([{
        id: 'edit-me', date: '2026-10-14', exercise: 'Press', weight: 30, reps: 10, sets: 3, note: 'Keep note',
        workoutId: 'morning', durationSeconds: 120, feeling: 'balanced',
        ...(!legacy ? { setDetails: [{ weight: 30, reps: 10, type: 'warmup' }, { weight: 40, reps: 8 }, { weight: 45, reps: 6 }] } : {}),
      }]))
    }, legacy)
    await page.reload()
    await page.getByRole('link', { name: 'History', exact: true }).click()
    await page.locator('.workout-history-card summary').click()
    await page.getByRole('button', { name: 'Edit: Press', exact: true }).click()
    const form = page.locator('#record-form')
    const rows = form.locator('.history-edit-sets fieldset')
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(1).getByLabel('Weight (kg)')).toHaveValue(legacy ? '30' : '40')
    await rows.nth(1).getByLabel('Weight (kg)').fill('42.5')
    await rows.nth(1).getByLabel('reps', { exact: true }).fill('7')
    await form.getByRole('button', { name: 'Add set' }).click()
    await expect(rows).toHaveCount(4)
    await rows.nth(2).getByRole('button').click()
    await form.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.locator('.page-nav a[href="#/progress"]').click()
    await page.locator('.exercise-trends summary').click()
    const trend = page.locator('.exercise-trends')
    await expect(trend.locator('.pr-stats strong').nth(0)).toHaveText(legacy ? '42.5 kg' : '45 kg')
    await expect(trend.locator('.pr-stats strong').nth(1)).toHaveText(legacy ? '10' : '7')
    await expect(trend.locator('tbody tr')).toHaveText(`2026-10-14${legacy ? '42.5' : '45'}${legacy ? '10' : '7'}`)
    await page.reload()
    await page.locator('.exercise-trends summary').click()
    await expect(trend.locator('.pr-stats strong').nth(0)).toHaveText(legacy ? '42.5 kg' : '45 kg')
    await expect(trend.locator('.pr-stats strong').nth(1)).toHaveText(legacy ? '10' : '7')
    await page.locator('.page-nav a[href="#/history"]').click()
    await page.reload()
    const record = await page.evaluate(() => JSON.parse(localStorage.getItem('workingout.records.v1'))[0])
    expect(record.sets).toBe(3)
    expect(record.setDetails).toEqual([
      { weight: 30, reps: 10, ...(!legacy ? { type: 'warmup' } : {}) },
      { weight: 42.5, reps: 7 },
      { weight: legacy ? 30 : 45, reps: legacy ? 10 : 6 },
    ])
    expect(record).toMatchObject({ workoutId: 'morning', durationSeconds: 120, feeling: 'balanced', note: 'Keep note' })
    await page.locator('.workout-history-card summary').click()
    await page.getByRole('button', { name: 'Edit: Press', exact: true }).click()
    await rows.nth(0).getByLabel('reps', { exact: true }).fill('99')
    await form.getByRole('button', { name: 'Cancel editing', exact: true }).click()
    await page.getByRole('button', { name: 'Edit: Press', exact: true }).click()
    await expect(rows.nth(0).getByLabel('reps', { exact: true })).toHaveValue('10')
  })
}


