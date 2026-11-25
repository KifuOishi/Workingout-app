import { useState } from 'react'
import { annualTrainingStats, dateKey } from './analytics'
import type { Milestone } from './analytics'
import { exerciseLabel } from './exerciseLabels'
import { locales } from './i18n'
import type { Language, Translate } from './i18n'
import ProgressSection from './ProgressSection'
import { TrainingHighlights } from './TrainingHighlights'
import type { WorkoutRecord } from './workouts'

export default function AnnualTrainingReport({ records, timeline, now, language, t }: { records: WorkoutRecord[]; timeline: Milestone[]; now: Date; language: Language; t: Translate }) {
  const currentYear = String(now.getFullYear())
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [showHighlights, setShowHighlights] = useState(false)
  const history = records.filter(record => record.date <= dateKey(now))
  const years = [...new Set([currentYear, ...history.map(record => record.date.slice(0, 4))])].sort().reverse()
  const year = years.includes(selectedYear) ? selectedYear : currentYear
  const stats = annualTrainingStats(history, timeline, year, now)
  const { workouts, days, bestUpdates, months, topSets, topExercises } = stats
  const canViewHighlights = year < currentYear && workouts > 0
  const busiest = Math.max(1, ...months)
  const formatMonth = new Intl.DateTimeFormat(locales[language], { month: 'short' })
  const num = new Intl.NumberFormat(locales[language])

  return <ProgressSection title={t('annualReport')} className="annual-report">
    <label className="annual-year">{t('reportYear')}<select value={year} onChange={event => setSelectedYear(event.target.value)}>
      {years.map(option => <option key={option} value={option}>{option}</option>)}
    </select></label>
    {canViewHighlights && <div className="annual-highlight-actions">
      <button type="button" className="primary" onClick={() => setShowHighlights(true)}>{t('openHighlights')}</button>
    </div>}
    {canViewHighlights && showHighlights && <TrainingHighlights year={year} stats={stats} language={language} t={t} onClose={() => setShowHighlights(false)} />}
    {workouts === 0 ? <p className="analytics-caption">{t('annualEmpty')}</p> : <>
      <div className="annual-report-hero" data-annual="workouts"><strong>{num.format(workouts)}</strong><span>{t('monthlyWorkoutCount')}</span></div>
      <dl className="annual-stats">
        <div data-annual="days"><dt>{t('trainingDays')}</dt><dd>{num.format(days)}</dd></div>
        <div data-annual="bests"><dt>{t('bestUpdates')}</dt><dd>{num.format(bestUpdates)}</dd></div>
        <div data-annual="exercise"><dt>{t('topExercise')}</dt><dd>{topExercises.map(exercise => exerciseLabel(exercise, language)).join(' / ') || '—'}{topSets > 0 && <small>{num.format(topSets)} {t('sets')}</small>}</dd></div>
      </dl>
      <h3>{t('workoutsByMonth')}</h3>
      <ol className="annual-months">{months.map((count, index) => <li key={index}>
        <time dateTime={`${year}-${String(index + 1).padStart(2, '0')}`}>{formatMonth.format(new Date(2000, index, 1))}</time>
        <span className="annual-month-track" aria-hidden="true"><span style={{ width: `${count / busiest * 100}%` }} /></span>
        <strong>{num.format(count)}</strong>
      </li>)}</ol>
    </>}
  </ProgressSection>
}
