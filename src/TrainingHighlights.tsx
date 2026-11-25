import { useEffect, useId, useRef, useState } from 'react'
import { annualTrainingStats, dateKey, demoStats, milestones } from './analytics'
import { exerciseLabel } from './exerciseLabels'
import { locales } from './i18n'
import type { Language, Translate } from './i18n'
import type { WorkoutRecord } from './workouts'

export function TrainingHighlights({ year, stats, language, t, onClose }: { year: string; stats: ReturnType<typeof annualTrainingStats>; language: Language; t: Translate; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [step, setStep] = useState(0)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])

  const num = new Intl.NumberFormat(locales[language])
  const max = Math.max(...stats.months)
  const month = new Intl.DateTimeFormat(locales[language], { month: 'long' })
  const cards = [
    { label: t('monthlyWorkoutCount'), value: num.format(stats.workouts), detail: `${num.format(stats.days)} · ${t('trainingDays')}` },
    { label: t('bestUpdates'), value: num.format(stats.bestUpdates) },
    { label: t('topExercise'), value: stats.topExercises.map(exercise => exerciseLabel(exercise, language)).join(' / ') || '—', detail: stats.topSets ? `${num.format(stats.topSets)} ${t('sets')}` : undefined },
    { label: t('busiestMonth'), value: stats.months.flatMap((count, index) => count === max ? [month.format(new Date(2000, index, 1))] : []).join(' / '), detail: `${num.format(max)} · ${t('monthlyWorkoutCount')}` },
    { label: t('annualTotalSets'), value: num.format(stats.totalSets) },
    { label: t('longestTrainingStreak'), value: `${num.format(stats.longestStreak)}${t(stats.longestStreak === 1 ? 'oneWeekSuffix' : 'weeksSuffix')}` },
  ]
  const card = cards[step]
  return <dialog ref={dialog} className="training-highlights" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }}>
    <header><h2 id={titleId}>{year} · {t('trainingHighlights')}</h2><button type="button" className="secondary" onClick={onClose}>{t('close')}</button></header>
    <progress value={step + 1} max={cards.length} aria-label={t('progress')} />
    <section key={step} className="highlight-card" data-step={step} aria-live="polite">
      <h3>{card.label}</h3><strong>{card.value}</strong>{card.detail && <p>{card.detail}</p>}
    </section>
    <div className="highlight-controls">
      <button type="button" className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{t('highlightBack')}</button>
      <span>{step + 1} / {cards.length}</span>
      <button type="button" className="primary" onClick={step === cards.length - 1 ? onClose : () => setStep(step + 1)}>{t(step === cards.length - 1 ? 'close' : 'highlightNext')}</button>
    </div>
  </dialog>
}

const seenKey = 'workingout.annual-highlights.v1'

function seasonalYear(now: Date) {
  return now.getMonth() === 0 && now.getDate() <= 14 ? String(now.getFullYear() - 1) : null
}

export default function NewYearHighlights({ records, language, t, home }: { records: WorkoutRecord[]; language: Language; t: Translate; home: boolean }) {
  const [opening, setOpening] = useState<Date | null>(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const [homeYear, setHomeYear] = useState(() => seasonalYear(new Date()))
  const shown = useRef('')
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'new-year'
  const hasHighlights = homeYear !== null && records.some(record => record.date.startsWith(`${homeYear}-`))
  useEffect(() => {
    if (preview) return
    function check() {
      const now = new Date()
      const year = seasonalYear(now)
      setHomeYear(year)
      if (!year || document.visibilityState === 'hidden' || document.querySelector('dialog[open]')) return
      if (shown.current === year || !records.some(record => record.date.startsWith(`${year}-`))) return
      try { if (localStorage.getItem(seenKey) === year) return } catch { /* Keep the session-level guard. */ }
      shown.current = year
      try { localStorage.setItem(seenKey, year) } catch { /* The dialog remains available in this session. */ }
      setOpening(now)
    }
    check()
    const interval = window.setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', check) }
  }, [records, preview])
  const year = opening ? String(opening.getFullYear() - 1) : null
  const stats = opening && year ? annualTrainingStats(records, milestones(records, dateKey(opening)), year, opening) : null
  return <>
    {home && (preview || hasHighlights) && <section className="home-highlights">
      <h2>{preview ? t('demoHighlights') : homeYear} · {t('trainingHighlights')}</h2>
      <button type="button" className="primary" onClick={() => {
        if (preview) { setDemoOpen(true); return }
        const now = new Date()
        const year = seasonalYear(now)
        if (!year) { setHomeYear(null); return }
        shown.current = year
        try { localStorage.setItem(seenKey, year) } catch { /* Keep the session-level guard. */ }
        setOpening(now)
      }}>{t('openHighlights')}</button>
    </section>}
    {demoOpen && <TrainingHighlights year={t('demoHighlights')} stats={demoStats} language={language} t={t} onClose={() => setDemoOpen(false)} />}
    {year && stats && stats.workouts > 0 && <TrainingHighlights year={year} stats={stats} language={language} t={t} onClose={() => setOpening(null)} />}
  </>
}
