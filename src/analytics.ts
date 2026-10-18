import { categories, signedWeight } from './exercises'
import type { Exercise } from './exercises'
import { workingSets } from './progress'
import { groupWorkouts } from './workouts'
import type { WorkoutRecord } from './workouts'

export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export type Milestone = { id: string; date: string; exercise: string; kind: 'first' | 'weight' | 'reps'; weight: number; reps: number; gain: number }

export function milestones(records: WorkoutRecord[], today: string): Milestone[] {
  const history = new Map<string, { max: number; reps: Map<number, number> }>()
  const events: Milestone[] = []
  const workouts = groupWorkouts(records.filter(record => record.date <= today)).sort((a, b) => a.records[0].date.localeCompare(b.records[0].date) || (a.records[0].finishedAt ?? 0) - (b.records[0].finishedAt ?? 0))
  for (const workout of workouts) {
    const byExercise = new Map<string, WorkoutRecord[]>()
    for (const record of workout.records) {
      const key = JSON.stringify([record.exercise, record.category ?? ''])
      byExercise.set(key, [...(byExercise.get(key) ?? []), record])
    }
    for (const [key, rows] of byExercise) {
      const record = rows[0]
      const sets = rows.flatMap(row => workingSets(row).map(set => ({ ...set, weight: signedWeight(row.exercise, set.weight) })))
      if (!sets.length) continue
      const best = [...sets].sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0]
      const prior = history.get(key)
      let event: Pick<Milestone, 'kind' | 'weight' | 'reps' | 'gain'> | null = null
      if (!prior) event = { kind: 'first', ...best, gain: 0 }
      else if (best.weight > prior.max) event = { kind: 'weight', ...best, gain: best.weight - prior.max }
      else {
        const improved = sets.filter(set => prior.reps.has(set.weight) && set.reps > prior.reps.get(set.weight)!).sort((a, b) => b.reps - prior.reps.get(b.weight)! - (a.reps - prior.reps.get(a.weight)!))[0]
        if (improved) event = { kind: 'reps', ...improved, gain: improved.reps - prior.reps.get(improved.weight)! }
      }
      if (event) events.push({ id: workout.id + key, date: record.date, exercise: record.exercise, ...event })
      const next = prior ?? { max: best.weight, reps: new Map<number, number>() }
      next.max = Math.max(next.max, best.weight)
      for (const set of sets) next.reps.set(set.weight, Math.max(next.reps.get(set.weight) ?? 0, set.reps))
      history.set(key, next)
    }
  }
  return events.reverse()
}

export function trainingAnalytics(records: WorkoutRecord[], exercises: Exercise[], now: Date) {
  const today = dateKey(now)
  const monthStart = dateKey(new Date(now.getFullYear(), now.getMonth(), 1))
  const previousStart = dateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const previousEnd = dateKey(new Date(now.getFullYear(), now.getMonth() - 1, Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth(), 0).getDate())))
  const recentStart = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 27))
  const aggregate = (rows: WorkoutRecord[]) => ({
    days: new Set(rows.filter(row => workingSets(row).length).map(row => row.date)).size,
    sets: rows.reduce((sum, row) => sum + workingSets(row).length, 0),
    volume: rows.reduce((sum, row) => sum + workingSets(row).reduce((total, set) => total + set.weight * set.reps, 0), 0),
  })
  const current = records.filter(row => row.date >= monthStart && row.date <= today)
  const previous = records.filter(row => row.date >= previousStart && row.date <= previousEnd)
  const recent = records.filter(row => row.date >= recentStart && row.date <= today)
  const muscles = categories.map(category => {
    const matching = recent.filter(row => (row.category ?? exercises.find(exercise => exercise.name === row.exercise)?.category ?? categories[6]) === category && workingSets(row).length)
    return { category, sets: aggregate(matching).sets, lastDate: matching.map(row => row.date).sort().at(-1) }
  })
  const timeline = milestones(records, today)
  const gains = timeline.filter(event => event.date >= monthStart && event.kind === 'weight')
  const highlight = [...gains].sort((a, b) => b.gain - a.gain)[0]
  return { current: aggregate(current), previous: aggregate(previous), monthStart, previousStart, previousEnd, today, recentStart, muscles, timeline, highlight, newBests: timeline.filter(event => event.date >= monthStart && event.kind !== 'first').length }
}
