import { signedWeight } from './exercises'
import type { PlanItem, SetDetail, WorkoutRecord } from './workouts'
import { fromKg, locales } from './i18n'
import type { Language, Translate, Unit } from './i18n'

export function previousSet(item: PlanItem | undefined, index: number) {
  return item?.setDetails ? item.setDetails[index] : item && index < item.sets ? item : undefined
}

export function setImprovement(exercise: string, current: { weight: number | null; reps: number | null; type?: SetDetail['type'] }, previous: SetDetail | undefined) {
  if (!previous || current.weight === null || current.reps === null || current.type === 'warmup' || (current.type ?? 'normal') !== (previous.type ?? 'normal')) return null
  const weight = signedWeight(exercise, current.weight) - signedWeight(exercise, previous.weight)
  const reps = current.reps - previous.reps
  // Ignore rounding introduced when a displayed weight is entered again in kg or lb.
  const sameWeight = Math.abs(weight) < 0.005
  if (!sameWeight && weight > 0 && reps >= 0) return { weight, reps: 0 }
  if (sameWeight && reps > 0) return { weight: 0, reps }
  return null
}

export type SetImprovement = NonNullable<ReturnType<typeof setImprovement>>

export function improvementLabel(gain: SetImprovement, language: Language, unit: Unit, t: Translate) {
  const amount = gain.weight ? fromKg(gain.weight, unit) : gain.reps
  const number = amount.toLocaleString(locales[language], { maximumFractionDigits: 2 })
  const suffix = gain.weight ? ` ${unit}` : t(gain.reps === 1 ? 'singleRepSuffix' : 'repSuffix')
  return `${t('beatPrevious')} +${number}${suffix}`
}

export function workingSets(item: PlanItem): SetDetail[] {
  const sets: SetDetail[] = item.setDetails ?? Array.from({ length: item.sets }, () => ({ weight: item.weight, reps: item.reps }))
  return sets.filter(set => set.type !== 'warmup')
}
export function sameExercise(a: Pick<PlanItem, 'exercise' | 'category'>, b: Pick<PlanItem, 'exercise' | 'category'>) {
  return a.exercise === b.exercise && (a.category ?? '') === (b.category ?? '')
}
export function bests(items: PlanItem[]) {
  const sets = items.flatMap(item => workingSets(item).map(set => ({ ...set, weight: signedWeight(item.exercise, set.weight) })))
  return { weight: sets.length ? Math.max(...sets.map(set => set.weight)) : 0, reps: Math.max(0, ...sets.map(set => set.reps)), count: sets.length }
}
export function recordPR(record: WorkoutRecord, records: WorkoutRecord[]) {
  const before = records.filter(other => sameExercise(record, other) && (other.date < record.date || other.date === record.date && (other.finishedAt ?? 0) < (record.finishedAt ?? 0)))
  const prior = bests(before), current = bests([record])
  return current.count > 0 && (prior.count === 0 || current.weight > prior.weight || current.reps > prior.reps)
}
export function moveItem<T>(items: T[], index: number, offset: number): T[] {
  const next = [...items], target = index + offset
  if (target < 0 || target >= items.length) return next
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
