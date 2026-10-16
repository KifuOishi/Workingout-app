import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('workingout.records.v1')) return
    const item = { id: 'item-1', exercise: 'Bench press', category: '胸', weight: 50, reps: 8, sets: 2, note: 'Keep this note' }
    localStorage.setItem('workingout.records.v1', JSON.stringify([{ ...item, id: 'record-1', date: '2026-10-15', setDetails: [{ weight: 50, reps: 8 }, { weight: 55, reps: 6 }] }]))
    localStorage.setItem('workingout.exercises.v1', JSON.stringify([{ category: '肩', name: 'My shoulder exercise' }]))
    localStorage.setItem('workingout.settings.v1', JSON.stringify({ language: 'en', unit: 'lb' }))
    const template = { id: 'template-1', name: 'My strength routine', restSeconds: 120, items: [item] }
    localStorage.setItem('workingout.planner.v1', JSON.stringify({ templates: [template], session: { ...template, id: 'session-1', date: '2026-10-15', startedAt: Date.now() - 60000, completed: [], setRows: { 'item-1': [{ id: 'set-1', weight: 50, reps: 8, done: true, restSeconds: 120 }, { id: 'set-2', weight: 55, reps: 6, done: false, restSeconds: 120 }] }, timer: { endAt: Date.now() + 120000, remainingMs: 120000, ringing: false } } }))
  })
})

async function downloadBackup(page) {
  await page.getByRole('button', { name: 'Backup', exact: true }).click()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toMatch(/^lift-log-backup-.*\.json$/)
  return JSON.parse(await fs.readFile(await download.path(), 'utf8'))
}
const file = backup => ({ name: 'lift-log-test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })

test('export, preview, cancel and restore all data including active workout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const backup = await downloadBackup(page)
  expect(backup.version).toBe(1)
  expect(backup.data.records[0].setDetails[1]).toEqual({ weight: 55, reps: 6 })
  expect(backup.data.exercises[0].name).toBe('My shoulder exercise')
  expect(backup.data.planner.session.timer.endAt).toBeNull()
  expect(backup.data.planner.session.timer.remainingMs).toBeGreaterThan(100000)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.evaluate(() => {
    localStorage.setItem('workingout.records.v1', '[]')
    localStorage.setItem('workingout.planner.v1', '{"templates":[],"session":null}')
    localStorage.setItem('workingout.exercises.v1', '[]')
    localStorage.setItem('workingout.settings.v1', '{"language":"en","unit":"kg"}')
  })
  await page.reload()
  await page.getByRole('button', { name: 'Backup', exact: true }).click()
  await page.getByLabel('Choose backup file', { exact: true }).setInputFiles(file(backup))
  await expect(page.getByRole('heading', { name: 'Review backup' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('workingout.records.v1')))).toEqual([])
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('.backup-preview')).toHaveCount(0)
  await page.getByLabel('Choose backup file', { exact: true }).setInputFiles(file(backup))
  await page.locator('.backup-dialog').screenshot({ path: 'test-results/backup-preview.png' })
  await page.getByRole('button', { name: 'Replace data & restore', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Weight unit', { exact: true })).toHaveValue('lb')
  await page.getByRole('button', { name: 'Continue workout', exact: true }).click()
  await expect(page.locator('#current-workout').getByRole('checkbox').first()).toBeChecked()
  await expect(page.locator('#current-workout').getByRole('checkbox').nth(1)).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
  await page.reload()
  const restored = await page.evaluate(() => ({ records: JSON.parse(localStorage.getItem('workingout.records.v1')), planner: JSON.parse(localStorage.getItem('workingout.planner.v1')), exercises: JSON.parse(localStorage.getItem('workingout.exercises.v1')) }))
  expect(restored.records).toEqual(backup.data.records)
  expect(restored.planner.templates).toEqual(backup.data.planner.templates)
  expect(restored.exercises).toEqual(backup.data.exercises)
})

test('invalid files do not change data and failed restoration rolls back before retry', async ({ page }) => {
  await page.goto('/')
  const backup = await downloadBackup(page)
  const before = await page.evaluate(() => ({ ...localStorage }))
  const invalid = [null, { ...backup, version: 99 }, { ...backup, data: { ...backup.data, planner: undefined } }, { ...backup, data: { ...backup.data, records: [{ ...backup.data.records[0], date: '2026-02-30' }] } }, { ...backup, data: { ...backup.data, records: [backup.data.records[0], backup.data.records[0]] } }]
  for (const data of invalid) {
    await page.getByLabel('Choose backup file', { exact: true }).setInputFiles(file(data))
    await expect(page.getByRole('alert')).toContainText('not a valid LIFT LOG backup')
    expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before)
    await expect(page.locator('.backup-preview')).toHaveCount(0)
  }
  const incoming = structuredClone(backup)
  incoming.data.records[0].id = 'imported-record'
  await page.getByLabel('Choose backup file', { exact: true }).setInputFiles(file(incoming))
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'workingout.planner.v1') { Storage.prototype.setItem = original; throw new Error('Simulated quota failure') }
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'Replace data & restore', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('previous saved data was kept')
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before)
  await page.getByRole('button', { name: 'Replace data & restore', exact: true }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('workingout.records.v1'))[0].id)).toBe('imported-record')
})
