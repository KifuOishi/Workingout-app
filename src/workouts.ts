import { categories } from './exercises'
import type { Category } from './exercises'

export const setTypes = ['normal', 'warmup', 'drop'] as const
export type SetType = typeof setTypes[number]
export const validSetType = (value: unknown) => value === undefined || setTypes.includes(value as SetType)
export type SetDetail = { weight: number; reps: number; type?: SetType }
export type SessionSet = { id: string; weight: number | null; reps: number | null; done: boolean; restSeconds: number; type?: SetType; weightSource?: 'previous' | 'manual'; repsSource?: 'previous' | 'manual' }
export type PlanItem = { id: string; exercise: string; category?: Category; weight: number; reps: number; sets: number; note: string; setDetails?: SetDetail[] }
export const workoutFeelings = ['easy', 'balanced', 'hard'] as const
export type WorkoutFeeling = typeof workoutFeelings[number]
export type WorkoutReflection = { feeling?: WorkoutFeeling; workoutNote?: string }
export type WorkoutRecord = PlanItem & WorkoutReflection & { date: string; workoutId?: string; durationSeconds?: number; workoutName?: string; finishedAt?: number }
export function groupWorkouts(records: WorkoutRecord[]) {
  const groups = new Map<string, WorkoutRecord[]>()
  for (const record of records) {
    const legacyId = record.id.match(/^session-([a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})-/i)?.[1]
    const key = `${record.date}/${record.workoutId ?? legacyId ?? record.id}`
    const group = groups.get(key)
    if (group) group.push(record)
    else groups.set(key, [record])
  }
  return [...groups].map(([id, records]) => ({ id, records })).sort((a, b) => (b.records[0].finishedAt ?? 0) - (a.records[0].finishedAt ?? 0))
}
export function validWorkoutMetadata(record: WorkoutRecord): boolean {
  if (record.feeling !== undefined && !workoutFeelings.includes(record.feeling)) return false
  if (record.workoutNote !== undefined && (typeof record.workoutNote !== 'string' || record.workoutNote.length > 500)) return false
  return (record.workoutId === undefined || typeof record.workoutId === 'string') && (record.durationSeconds === undefined || Number.isInteger(record.durationSeconds) && record.durationSeconds >= 0) && (record.workoutName === undefined || typeof record.workoutName === 'string') && (record.finishedAt === undefined || Number.isFinite(record.finishedAt) && record.finishedAt >= 0)
}
export type TemplateItem = Pick<PlanItem, 'id' | 'exercise' | 'category' | 'sets'> & Partial<Pick<PlanItem, 'weight' | 'reps' | 'note' | 'setDetails'>>
export type Template = { id: string; name: string; restSeconds: number; items: TemplateItem[] }
export type Session = Omit<Template, 'items'> & { items: PlanItem[]; date: string; startedAt: number; setRows: Record<string, SessionSet[]>; completed: string[]; timer: { endAt: number | null; remainingMs: number; ringing: boolean } }
export function templateOutline(plan: Template): Template {
  return { id: plan.id, name: plan.name, restSeconds: plan.restSeconds, items: plan.items.map(({ id, exercise, category, sets }) => ({ id, exercise, category, sets })) }
}
export type PlannerState = { templates: Template[]; session: Session | null }
export const plannerKey = 'workingout.planner.v1'
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const validItem = (r: PlanItem) => r && typeof r.id === 'string' && typeof r.exercise === 'string' && r.exercise.trim().length > 0 && Number.isFinite(r.weight) && r.weight >= 0 && Number.isInteger(r.reps) && r.reps > 0 && Number.isInteger(r.sets) && r.sets > 0 && r.sets <= 1000 && typeof r.note === 'string' && (r.category === undefined || categories.includes(r.category)) && (r.setDetails === undefined || Array.isArray(r.setDetails) && r.setDetails.length === r.sets && r.setDetails.every(set => set && validSetType(set.type) && Number.isFinite(set.weight) && set.weight >= 0 && Number.isInteger(set.reps) && set.reps > 0))
export function validTemplate(p: Template, allowEmpty = false): boolean {
  return !!p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0 && Number.isInteger(p.restSeconds) && p.restSeconds >= 0 && p.restSeconds <= 3600 && Array.isArray(p.items) && (allowEmpty || p.items.length > 0) && p.items.every(item => item && validItem({ ...item, weight: item.weight ?? 0, reps: item.reps ?? 1, note: item.note ?? '' })) && new Set(p.items.map(i => i.id)).size === p.items.length
}
export function readPlanner(raw?: string): { state: PlannerState; error: boolean } {
  try {
    const data = JSON.parse(raw ?? localStorage.getItem(plannerKey) ?? '{"templates":[],"session":null}')
    if (!data || !Array.isArray(data.templates) || !data.templates.every((plan: Template) => validTemplate(plan))) throw new Error()
    if (data.session !== null) {
      const s = data.session
      if (!validTemplate(s, true) || !s.items.every(validItem) || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || !Array.isArray(s.completed) || !s.completed.every((id: unknown) => s.items.some((i: PlanItem) => i.id === id)) || new Set(s.completed).size !== s.completed.length || !s.timer || !(s.timer.endAt === null || (Number.isFinite(s.timer.endAt) && s.timer.endAt > 0)) || !Number.isFinite(s.timer.remainingMs) || s.timer.remainingMs < 0 || typeof s.timer.ringing !== 'boolean') throw new Error()
    }
    if (data.session) {
      const s = data.session as Session
      s.startedAt ??= Date.now()
      s.setRows ??= Object.fromEntries(s.items.map(item => [item.id, makeSets(item, s.restSeconds, s.completed.includes(item.id))]))
      if (!Number.isFinite(s.startedAt) || !s.items.every(item => Array.isArray(s.setRows[item.id]) && s.setRows[item.id].length > 0 && s.setRows[item.id].every(row => validSetType(row.type) && typeof row.id === 'string' && typeof row.done === 'boolean' && (row.weight === null || Number.isFinite(row.weight) && row.weight >= 0) && (row.reps === null || Number.isInteger(row.reps) && row.reps > 0) && (!row.done || row.weight !== null && row.reps !== null) && Number.isInteger(row.restSeconds) && row.restSeconds >= 0 && row.restSeconds <= 3600))) throw new Error()
    }
    return { state: data, error: false }
  } catch { return { state: { templates: [], session: null }, error: true } }
}
export function startSession(plan: Template, date = localDate()): Session {
  const items: PlanItem[] = plan.items.map(item => ({ ...item, feeling: undefined, workoutNote: undefined, id: crypto.randomUUID(), weight: item.weight ?? 0, reps: item.reps ?? 1, note: item.note ?? '' }))
  return { ...plan, id: crypto.randomUUID(), items, date, startedAt: Date.now(), setRows: Object.fromEntries(items.map((item, index) => [item.id, makeSets(item, plan.restSeconds, false, plan.items[index].weight === undefined || plan.items[index].reps === undefined)])), completed: [], timer: { endAt: null, remainingMs: 0, ringing: false } }
}
function makeSets(item: PlanItem, restSeconds: number, done = false, blank = false): SessionSet[] {
  return Array.from({ length: item.setDetails?.length || item.sets }, (_, index) => ({ id: crypto.randomUUID(), weight: blank ? null : item.setDetails?.[index]?.weight ?? item.weight, reps: blank ? null : item.setDetails?.[index]?.reps ?? item.reps, done, restSeconds, ...(item.setDetails?.[index]?.type ? { type: item.setDetails[index].type } : {}) }))
}
export function workoutVolume(item: PlanItem): number {
  return item.setDetails ? item.setDetails.reduce((sum, set) => sum + set.weight * set.reps, 0) : item.weight * item.reps * item.sets
}
export function previousWorkout(records: (PlanItem & { date: string })[], item: PlanItem, session: Session) {
  return [...records].reverse()
    .filter(record => record.exercise === item.exercise && (!record.category || !item.category || record.category === item.category) && record.date <= session.date && !record.id.startsWith(`session-${session.id}-`))
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}
export function remainingTime(timer: Session['timer'], now: number): number {
  return timer.endAt === null ? timer.remainingMs : Math.max(0, timer.endAt - now)
}
export function completedRecords(session: Session, finishedAt = Date.now()) {
  return session.items.flatMap(item => {
    const details = session.setRows[item.id].filter(row => row.done && row.weight !== null && row.reps !== null).map(row => ({ weight: row.weight!, reps: row.reps!, ...(row.type && row.type !== 'normal' ? { type: row.type } : {}) }))
    return details.length ? [{ ...item, weight: details[0].weight, reps: details[0].reps, sets: details.length, setDetails: details, id: `session-${session.id}-${item.id}`, date: session.date, workoutId: session.id, workoutName: session.name, finishedAt, durationSeconds: Math.max(0, Math.floor((finishedAt - session.startedAt) / 1000)) }] : []
  })
}
