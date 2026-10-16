import { test, expect } from '@playwright/test'

test('history creates an editable template with only exercises and set counts', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const base = { date: '2026-10-14', weight: 30, reps: 10, sets: 3, note: 'History note', workoutId: 'morning', workoutName: 'Morning session' }
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { ...base, id: 'one', exercise: 'Morning press' },
      { ...base, id: 'two', exercise: 'Morning row', sets: 2 },
    ]))
  })
  await page.reload()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  await page.getByRole('button', { name: 'Workout actions', exact: true }).first().click()
  await page.getByRole('button', { name: 'Save as template', exact: true }).click()
  await expect(page).toHaveURL(/#\/templates$/)
  const editor = page.locator('.template-editor')
  await expect(editor.getByLabel('Template name')).toHaveValue('Morning session')
  await expect(editor.locator('.template-item')).toHaveCount(2)
  await expect(editor.getByRole('spinbutton', { name: 'sets', exact: true }).nth(1)).toHaveValue('2')
  await editor.getByLabel('Template name').fill('My routine')
  await editor.getByRole('button', { name: 'Save template', exact: true }).click()
  await page.reload()
  await expect(page.locator('.template-card')).toContainText('My routine')
  const data = await page.evaluate(() => ({ template: JSON.parse(localStorage.getItem('workingout.planner.v1')).templates[0], history: JSON.parse(localStorage.getItem('workingout.records.v1')) }))
  expect(data.template.items.map(({ exercise, sets }) => ({ exercise, sets }))).toEqual([{ exercise: 'Morning press', sets: 3 }, { exercise: 'Morning row', sets: 2 }])
  for (const item of data.template.items) {
    expect(item.weight).toBeUndefined()
    expect(item.reps).toBeUndefined()
    expect(item.note).toBeUndefined()
  }
  expect(data.history).toHaveLength(2)
  await page.getByRole('button', { name: 'Start workout', exact: true }).click()
  await expect(page.locator('#current-workout').getByRole('checkbox')).toHaveCount(5)
  await expect(page.locator('#current-workout').getByRole('spinbutton', { name: /^Weight / }).first()).toHaveValue('30')
  await expect(page.locator('#current-workout').getByRole('spinbutton', { name: /^Weight / }).first()).toHaveClass('suggested-value')
})
