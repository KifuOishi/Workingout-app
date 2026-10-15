import { useState } from 'react'
import { locales } from './i18n'
import type { Language, Translate } from './i18n'
import { localDate } from './workouts'

type Props = { records: { date: string }[]; language: Language; t: Translate; selected?: string; onSelect: (date: string) => void }
const monthOf = (date: string) => date.slice(0, 7)
export default function WorkoutCalendar({ records, language, t, selected, onSelect }: Props) {
  const today = localDate()
  const [month, setMonth] = useState(() => monthOf(selected || today))
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(year, monthNumber - 1, 1)
  const days = new Date(year, monthNumber, 0).getDate()
  const counts = new Map<string, number>()
  for (const record of records) counts.set(record.date, (counts.get(record.date) ?? 0) + 1)
  const trainingDays = [...counts.keys()].filter(date => date.startsWith(month)).length
  function move(delta: number) {
    const date = new Date(year, monthNumber - 1 + delta, 1)
    if (date.getFullYear() < 1900 || date.getFullYear() > 9999) return
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  const cells = Math.ceil((first.getDay() + days) / 7) * 7
  return <section className="workout-calendar" aria-label={t('calendar')}>
    <div className="calendar-heading"><div><span className="eyebrow">LIFT LOG / ACTIVITY</span><h2>{t('calendar')}</h2><p>{t('calendarHint')}</p></div><span className="calendar-total"><strong>{trainingDays.toLocaleString(locales[language])}</strong> {t('dayUnit')}</span></div>
    <div className="calendar-controls"><div className="calendar-month-title"><h3 aria-live="polite">{first.toLocaleDateString(locales[language], { year: 'numeric', month: 'long' })}</h3><label className="calendar-month-picker"><span>{t('chooseMonth')}</span><input type="month" aria-label={t('chooseMonth')} min="1900-01" max="9999-12" value={month} onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value) && e.target.value >= '1900-01' && e.target.value <= '9999-12') setMonth(e.target.value) }} /></label></div><div className="calendar-arrows"><button type="button" aria-label={t('previousMonth')} onClick={() => move(-1)}>‹</button><button type="button" className="calendar-today" onClick={() => setMonth(monthOf(today))}>{t('today')}</button><button type="button" aria-label={t('nextMonth')} onClick={() => move(1)}>›</button></div></div>
    <div className="calendar-weekdays" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index}>{new Date(2026, 0, 4 + index).toLocaleDateString(locales[language], { weekday: 'short' })}</span>)}</div>
    <div className="calendar-grid">{Array.from({ length: cells }, (_, index) => {
      const day = index - first.getDay() + 1
      if (day < 1 || day > days) return <span key={index} className="calendar-blank" />
      const date = `${month}-${String(day).padStart(2, '0')}`
      const count = counts.get(date) ?? 0
      const isToday = date === today
      const label = new Date(year, monthNumber - 1, day).toLocaleDateString(locales[language], { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
      return <div key={index} className="calendar-cell">{count ? <button type="button" className={`calendar-day has-workout ${isToday ? 'is-today' : ''} ${date === selected ? 'is-selected' : ''}`} aria-label={`${label}: ${count} ${t('records')}`} aria-current={isToday ? 'date' : undefined} data-date={date} onClick={() => onSelect(date)}><span>{day}</span><span className="calendar-check" aria-hidden="true">✓</span></button> : <span className={`calendar-day ${isToday ? 'is-today' : ''}`} aria-label={label} aria-current={isToday ? 'date' : undefined}><span>{day}</span></span>}</div>
    })}</div>
    <div className="calendar-legend"><span><i className="legend-recorded" />{t('recordedDay')}</span><span><i className="legend-today" />{t('today')}</span></div>
    {trainingDays === 0 && <p className="calendar-empty">{t('noMonthWorkouts')}</p>}
  </section>
}
