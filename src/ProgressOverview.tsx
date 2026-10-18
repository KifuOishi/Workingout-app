import ProgressSection from './ProgressSection'
import { useState } from 'react'
import { categories } from './exercises'
import type { Category, Exercise } from './exercises'
import { categoryLabel, exerciseLabel } from './exerciseLabels'
import { fromKg, locales } from './i18n'
import type { Language, Translate, Unit } from './i18n'
import { trainingAnalytics } from './analytics'
import type { WorkoutRecord } from './workouts'

// Broad regions match the app's exercise categories rather than inferred muscles.
const front = [
  ['M44 50L57 46V66L44 69 35 60Z', 'M60 46L73 50 82 60 73 69 60 66Z'],
  ['M33 48L43 49 34 62 27 61Z', 'M74 49L84 48 90 61 83 62Z'],
  [],
  ['M43 108L57 110 54 159 44 174 36 163Z', 'M60 110L74 108 81 163 73 174 63 159Z', 'M44 177L53 165 51 210 42 210Z', 'M64 165L73 177 75 210 66 210Z'],
  ['M26 64L35 65 33 92 22 110 16 105Z', 'M83 65L91 64 101 105 95 110 84 92Z'],
  ['M45 73L57 71V104L44 102Z', 'M60 71L72 73 73 102 60 104Z'],
]
const back = [[], front[1], ['M43 49L57 45 74 49 77 69 69 94 59 106 48 94 39 69Z'], front[3], front[4], []]

export default function ProgressOverview({ records, exercises, language, unit, t }: { records: WorkoutRecord[]; exercises: Exercise[]; language: Language; unit: Unit; t: Translate }) {
  const [now] = useState(() => new Date())
  const data = trainingAnalytics(records, exercises, now)
  const [selected, setSelected] = useState<Category>(categories[0])
  const [limit, setLimit] = useState(8)
  const muscle = data.muscles.find(item => item.category === selected)!
  const maximum = Math.max(1, ...data.muscles.map(item => item.sets))
  const num = (amount: number) => amount.toLocaleString(locales[language], { maximumFractionDigits: 2 })
  const date = (value: string) => new Date(value + 'T00:00:00').toLocaleDateString(locales[language], { month: 'short', day: 'numeric' })
  const color = (index: number) => {
    const count = data.muscles[index].sets
    return !count ? '#dce4d5' : count / maximum < .34 ? '#b7d699' : count / maximum < .67 ? '#78a96b' : '#356b4b'
  }
  return <div className="progress-overview">
    <ProgressSection className="monthly-review" title={t('monthlyReview')}>
      <time className="review-period" dateTime={data.monthStart.slice(0, 7)}>{new Date(data.monthStart + 'T00:00:00').toLocaleDateString(locales[language], { year: 'numeric', month: 'long' })}</time>
      <p className="analytics-caption">{t('samePeriod')} · {date(data.previousStart)} – {date(data.previousEnd)}</p>
      <div className="review-metrics">{([
        ['days', t('trainingDays')], ['sets', t('sets')], ['volume', t('totalVolume')],
      ] as const).map(([metric, label]) => {
        const amount = metric === 'volume' ? fromKg(data.current[metric], unit) : data.current[metric]
        const change = metric === 'volume' ? fromKg(data.current[metric] - data.previous[metric], unit) : data.current[metric] - data.previous[metric]
        return <div key={metric} data-metric={metric}><span>{label}</span><strong>{num(amount)}{metric === 'volume' && <small> {unit}</small>}</strong><span className="review-delta" data-direction={change > 0 ? 'up' : change < 0 ? 'down' : 'same'}>{change > 0 ? '↗ +' : change < 0 ? '↘ ' : '— '}{num(change)}{metric === 'volume' ? ' ' + unit : ''}</span></div>
      })}<div data-metric="bests"><span>{t('bestUpdates')}</span><strong>{data.newBests}</strong><span className="review-delta">{date(data.monthStart)} – {date(data.today)}</span></div></div>
      {data.highlight && <div className="month-highlight"><span aria-hidden="true">↗</span><div><small>{t('weightHighlight')}</small><p>{exerciseLabel(data.highlight.exercise, language)} <strong>+{num(fromKg(data.highlight.gain, unit))} {unit}</strong></p></div></div>}
      {!data.current.sets && <p className="analytics-caption">{t('reviewEmpty')}</p>}
    </ProgressSection>
    <div className="analytics-sections">
      <ProgressSection className="muscle-section" title={t('muscleMap')}><p className="analytics-caption">{t('muscleMapHint')}</p>
        <div className="body-figures" aria-hidden="true">{[front, back].map((regions, view) => <div key={view}><svg viewBox="0 0 118 226" focusable="false"><circle cx="59" cy="23" r="14" fill="#dce4d5" /><path d="M51 38H67L70 48H48ZM38 106H79L73 115H44Z" fill="#dce4d5" />{regions.map((paths, index) => <g key={index} fill={color(index)} stroke={selected === categories[index] ? '#203f2e' : '#f1f5ec'} strokeWidth={selected === categories[index] ? 2 : 1}>{paths.map(path => <path key={path} d={path} />)}</g>)}<path d="M41 213H52V220H36ZM65 213H76L82 220H65Z" fill="#dce4d5" /></svg><span>{t(view === 0 ? 'frontView' : 'backView')}</span></div>)}</div>
        <div className="muscle-legend"><span>{t('fewerSets')}</span><i /><span>{t('moreSets')}</span></div>
        <div className="muscle-categories">{data.muscles.map((item, index) => <button type="button" key={item.category} aria-pressed={selected === item.category} onClick={() => setSelected(item.category)}><i style={{ background: color(index) }} /><span>{categoryLabel(item.category, language)}</span><strong>{item.sets}</strong></button>)}</div>
        <div className="muscle-detail" aria-live="polite"><strong>{categoryLabel(selected, language)} · {muscle.sets} {t('sets')}</strong><p>{muscle.lastDate ? `${t('lastTrained')}: ${date(muscle.lastDate)}` : t('noRecentSets')}</p></div>
        <p className="analytics-footnote">{t('analyticsMethod')}</p>
      </ProgressSection>
      <ProgressSection className="milestone-section" title={t('bestTimeline')}><p className="analytics-caption">{t('bestTimelineHint')}</p>
        {!data.timeline.length ? <p className="analytics-empty">{t('timelineEmpty')}</p> : <ol className="milestone-list">{data.timeline.slice(0, limit).map(event => <li key={event.id} data-kind={event.kind}><span className="milestone-symbol" aria-hidden="true">{event.kind === 'first' ? '⚑' : event.kind === 'weight' ? '↗' : '+'}</span><div><div className="milestone-meta"><span>{t(event.kind === 'first' ? 'firstMilestone' : event.kind === 'weight' ? 'weightMilestone' : 'repsMilestone')}</span><time dateTime={event.date}>{date(event.date)}</time></div><h3>{exerciseLabel(event.exercise, language)}</h3><p>{num(fromKg(event.weight, unit))} {unit} × {event.reps}{event.kind !== 'first' && <strong>+{num(event.kind === 'weight' ? fromKg(event.gain, unit) : event.gain)} {event.kind === 'weight' ? unit : t('reps')}</strong>}</p></div></li>)}</ol>}
        {data.timeline.length > limit && <button className="secondary milestone-more" onClick={() => setLimit(limit + 8)}>{t('showMore')}</button>}
      </ProgressSection>
    </div>
  </div>
}
