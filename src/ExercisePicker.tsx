import { useState } from 'react'
import { categories, equipmentTypes } from './exercises'
import type { Category, Equipment, Exercise } from './exercises'
import type { Language, MessageKey, Translate } from './i18n'
import { categoryLabel, exerciseLabel } from './exerciseLabels'

type Props = {
  category: Category
  exercise: string
  exercises: Exercise[]
  language: Language
  t: Translate
  onChange: (category: Category, name: string) => void
  onAdd: (category: Category, name: string, equipment?: Equipment) => MessageKey | null
}
export default function ExercisePicker({ category, exercise, exercises, language, t, onChange, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [part, setPart] = useState<Category>(category)
  const [equipment, setEquipment] = useState<Equipment>('machine')
  const [error, setError] = useState<MessageKey | null>(null)
  const options = exercises.filter(e => e.category === category)
  function add() {
    const result = onAdd(part, name.trim(), equipment)
    setError(result)
    if (!result) { setAdding(false); setName(''); onChange(part, name.trim()) }
  }
  return <div className="exercise-picker">
    <fieldset className="category-picker"><legend>{t('category')}</legend><div className="category-buttons">{categories.map(c => <button type="button" key={c} aria-pressed={category === c} onClick={() => { onChange(c, exercises.find(e => e.category === c)?.name ?? ''); setError(null) }}>{categoryLabel(c, language)}</button>)}</div></fieldset>
    <label>{t('exercise')}<select required value={exercise} onChange={e => onChange(category, e.target.value)}><option value="" disabled>{t('choose')}</option>{!options.some(e => e.name === exercise) && exercise && <option value={exercise}>{exerciseLabel(exercise, language)} ({t('past')})</option>}{equipmentTypes.map(type => { const group = options.filter(e => (e.equipment ?? 'machine') === type); return group.length ? <optgroup key={type} label={t(type)}>{group.map(e => <option value={e.name} key={e.name}>{exerciseLabel(e.name, language)}</option>)}</optgroup> : null })}</select></label>
    <button type="button" className="add-exercise-toggle" aria-expanded={adding} onClick={() => { setAdding(!adding); setPart(category); setError(null) }}>{adding ? t('closeAdd') : `${t('customAdd')} ${categoryLabel(category, language)}`}</button>
    {adding && <div className="custom-exercise"><label>{t('customName')} ({categoryLabel(part, language)})<input value={name} maxLength={80} onChange={e => { setName(e.target.value); setError(null) }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); add() } }} placeholder={t('customPlaceholder')} /></label><fieldset className="category-picker"><legend>{t('category')}</legend><div className="category-buttons">{categories.map(c => <button type="button" key={c} aria-pressed={part === c} onClick={() => setPart(c)}>{categoryLabel(c, language)}</button>)}</div></fieldset><label>{t('equipment')}<select aria-label={t('equipment')} value={equipment} onChange={event => setEquipment(event.target.value as Equipment)}>{equipmentTypes.map(type => <option key={type} value={type}>{t(type)}</option>)}</select></label><p>{t('customHint')}</p>{error && <p role="alert" className="exercise-error">{t(error)}</p>}<button type="button" className="secondary" onClick={add}>{t('customSave')}</button></div>}
  </div>
}
