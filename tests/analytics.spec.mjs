import { selectPreference } from './helpers/preferences.mjs'
import { test, expect } from '@playwright/test'

test.use({ timezoneId: 'America/Denver', reducedMotion: 'reduce' })

async function seed(page) {
  await page.clock.install({ time: new Date('2026-10-17T12:00:00-06:00') })
  await page.goto('/#/progress')
  await page.evaluate(async () => {
    const { categories } = await import('/src/exercises.ts')
    const base = { exercise: 'My press', category: categories[0], weight: 50, reps: 8, sets: 1, note: '' }
    localStorage.setItem('workingout.records.v1', JSON.stringify([
      { ...base, id: 'later', date: '2026-10-02', weight: 55, reps: 10 },
      { ...base, id: 'prior', date: '2026-09-10', sets: 2 },
      { ...base, id: 'weight', date: '2026-10-01', weight: 55 },
      { ...base, id: 'warmup', date: '2026-10-03', weight: 999, reps: 999, setDetails: [{ weight: 999, reps: 999, type: 'warmup' }] },
      { ...base, id: 'same', date: '2026-10-04' },
      { ...base, id: 'lower', date: '2026-10-05', weight: 55, reps: 9 },
      { ...base, id: 'future', date: '2026-10-20', weight: 1000 },
      { ...base, id: 'past-cutoff', date: '2026-09-19', sets: 20 },
    ]))
  })
  await page.reload()
}

test('monthly review, interactive muscle map and genuine milestones use recorded working sets', async ({ page }) => {
  await seed(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const sections = page.locator('.training-progress details')
  await expect(sections).toHaveCount(4)
  await expect(page.locator('.training-progress details[open]')).toHaveCount(0)
  const lastTitle = await sections.last().locator('summary').boundingBox()
  const nav = await page.locator('.page-nav').boundingBox()
  expect(lastTitle.y + lastTitle.height).toBeLessThan(nav.y)
  await sections.first().locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(sections.first()).toHaveAttribute('open', '')
  const review = page.getByRole('region', { name: 'This month so far', exact: true })
  await expect(review.locator('[data-metric="days"] strong')).toHaveText('4')
  await expect(review.locator('[data-metric="sets"] strong')).toHaveText('4')
  await expect(review.locator('[data-metric="volume"] strong')).toHaveText('1,885 kg')
  await expect(review.locator('[data-metric="sets"] .review-delta')).toContainText('+2')
  await expect(review.locator('[data-metric="bests"] strong')).toHaveText('2')
  await expect(review.locator('.month-highlight')).toContainText('+5 kg')
  const map = page.getByRole('region', { name: 'Muscle map', exact: true })
  await page.locator('.muscle-section > summary').click()
  await expect(map.locator('.muscle-detail')).toContainText('Chest · 4 sets')
  await map.getByRole('button', { name: 'Legs 0', exact: true }).click()
  await expect(map.locator('.muscle-detail')).toContainText('No working sets in this period')
  await expect(map.getByRole('button', { name: 'Legs 0', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const timeline = page.getByRole('region', { name: 'Personal best timeline', exact: true })
  await page.locator('.milestone-section > summary').click()
  await expect(timeline.locator('li')).toHaveCount(3)
  await expect(timeline.locator('li').nth(0)).toContainText('More reps at the same weight')
  await expect(timeline.locator('li').nth(0)).toContainText('+2 reps')
  await expect(timeline.locator('li').nth(1)).toContainText('Weight best')
  await expect(timeline.locator('li').nth(2)).toContainText('Starting point')
  await selectPreference(page, 'unit', 'lb')
  await expect(review.locator('.month-highlight')).toContainText('+11.02 lb')
  await expect(timeline.locator('li').nth(0)).toContainText('121.25 lb')
  await page.locator('.exercise-trends > summary').click()
  for (const language of ['ja', 'es', 'zh', 'en']) {
    await selectPreference(page, 'language', language)
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 844 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
  await selectPreference(page, 'language', 'ja')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/analytics-mobile.png', fullPage: true })
})

test('analytics handles empty history, assisted weight improvements and year boundaries', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-31T12:00:00-07:00') })
  await page.goto('/#/progress')
  await page.locator('.milestone-section > summary').click()
  await expect(page.getByText('Save a workout to start your timeline.', { exact: true })).toBeVisible()
  const result = await page.evaluate(async () => {
    const { trainingAnalytics } = await import('/src/analytics.ts')
    const { categories } = await import('/src/exercises.ts')
    const base = { exercise: 'Assisted chin-up', weight: 40, reps: 8, sets: 1, note: '' }
    const records = [
      { ...base, id: 'old', date: '2025-12-31' },
      { ...base, id: 'new', date: '2026-01-31', weight: 30 },
    ]
    const data = trainingAnalytics(records, [{ name: 'Assisted chin-up', category: categories[2] }], new Date())
    const february = trainingAnalytics([], [], new Date(2026, 2, 31))
    return { previousStart: data.previousStart, previousEnd: data.previousEnd, previousSets: data.previous.sets, event: data.timeline[0], backSets: data.muscles[2].sets, februaryEnd: february.previousEnd }
  })
  expect(result).toMatchObject({ previousStart: '2025-12-01', previousEnd: '2025-12-31', previousSets: 1, backSets: 1, februaryEnd: '2026-02-28', event: { kind: 'weight', weight: -30, gain: 10 } })
})
