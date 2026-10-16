import { categories, exerciseStorageKey } from './exercises'
import type { Exercise } from './exercises'
import type { Language, Unit } from './i18n'
import { plannerKey, readPlanner, remainingTime, validItem } from './workouts'
import type { PlanItem, PlannerState } from './workouts'

export const recordsKey = 'workingout.records.v1'
export const settingsKey = 'workingout.settings.v1'
export const backupMaxBytes = 10 * 1024 * 1024
export type Backup = {
  app: 'lift-log'
  version: 1
  exportedAt: string
  data: { records: (PlanItem & { date: string })[]; planner: PlannerState; exercises: Exercise[]; settings: { language: Language; unit: Unit } }
}
export class BackupError extends Error {
  code: 'backupInvalid' | 'backupSaveError' | 'backupRollbackError'
  constructor(code: 'backupInvalid' | 'backupSaveError' | 'backupRollbackError') { super(code); this.code = code }
}
function validDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return Number.isFinite(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}
const uniqueIds = (values: { id: string }[]) => values.every(value => value.id.length > 0) && new Set(values.map(value => value.id)).size === values.length
export function parseBackup(text: string): Backup {
  try {
    if (new TextEncoder().encode(text).length > backupMaxBytes) throw new Error()
    const value = JSON.parse(text)
    if (value?.app !== 'lift-log' || value.version !== 1 || typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))) throw new Error()
    const data = value.data
    if (!data || !Array.isArray(data.records) || !data.records.every((record: PlanItem & { date: string }) => validItem(record) && validDate(record.date)) || !uniqueIds(data.records)) throw new Error()
    if (!Array.isArray(data.exercises) || !data.exercises.every((exercise: Exercise) => exercise && categories.includes(exercise.category) && typeof exercise.name === 'string' && exercise.name.trim().length > 0 && exercise.name.length <= 80)) throw new Error()
    if (!data.settings || !['en', 'ja', 'es', 'zh'].includes(data.settings.language) || !['kg', 'lb'].includes(data.settings.unit)) throw new Error()
    if (!data.planner || typeof data.planner !== 'object') throw new Error()
    const planner = readPlanner(JSON.stringify(data.planner))
    if (planner.error || !uniqueIds(planner.state.templates)) throw new Error()
    if (planner.state.session) {
      const session = planner.state.session
      if (!validDate(session.date) || !uniqueIds(Object.values(session.setRows).flat())) throw new Error()
    }
    return { app: 'lift-log', version: 1, exportedAt: value.exportedAt, data: { records: data.records, exercises: data.exercises, settings: { language: data.settings.language, unit: data.settings.unit }, planner: planner.state } }
  } catch { throw new BackupError('backupInvalid') }
}
export function createBackup(): Backup {
  const now = Date.now()
  const planner = readPlanner()
  if (planner.error) throw new BackupError('backupInvalid')
  if (planner.state.session) {
    const session = planner.state.session
    session.timer = { endAt: null, remainingMs: remainingTime(session.timer, now), ringing: false }
  }
  return parseBackup(JSON.stringify({
    app: 'lift-log', version: 1, exportedAt: new Date(now).toISOString(),
    data: {
      records: JSON.parse(localStorage.getItem(recordsKey) ?? '[]'),
      planner: planner.state,
      exercises: JSON.parse(localStorage.getItem(exerciseStorageKey) ?? '[]'),
      settings: JSON.parse(localStorage.getItem(settingsKey) ?? '{"language":"en","unit":"kg"}'),
    },
  }))
}
export function restoreBackup(backup: Backup) {
  const validated = parseBackup(JSON.stringify(backup))
  const data = validated.data
  if (data.planner.session) {
    const session = data.planner.session
    const elapsed = Math.max(0, Date.parse(validated.exportedAt) - session.startedAt)
    session.startedAt = Date.now() - elapsed
    session.timer = { endAt: null, remainingMs: remainingTime(session.timer, Date.parse(validated.exportedAt)), ringing: false }
  }
  const entries = [[recordsKey, data.records], [plannerKey, data.planner], [exerciseStorageKey, data.exercises], [settingsKey, data.settings]] as const
  const previous = entries.map(([key]) => [key, localStorage.getItem(key)] as const)
  try { for (const [key, value] of entries) localStorage.setItem(key, JSON.stringify(value)) }
  catch {
    let rollbackFailed = false
    for (const [key, value] of previous) {
      try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value) }
      catch { rollbackFailed = true }
    }
    throw new BackupError(rollbackFailed ? 'backupRollbackError' : 'backupSaveError')
  }
}
