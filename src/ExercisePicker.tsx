import { useState } from 'react'
import { categories } from './exercises'
import type { Category, Exercise } from './exercises'

type Props = {
  category: Category
  exercise: string
  exercises: Exercise[]
  onChange: (category: Category, name: string) => void
  onAdd: (category: Category, name: string) => string | null
}
export default function ExercisePicker({ category, exercise, exercises, onChange, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const options = exercises.filter(e => e.category === category)
  function add() {
    const result = onAdd(category, name.trim())
    setError(result ?? '')
    if (!result) { setAdding(false); setName('') }
  }
  return <div className="exercise-picker">
    <fieldset className="category-picker"><legend>部位</legend><div className="category-buttons">{categories.map(c => <button type="button" key={c} aria-pressed={category === c} onClick={() => { onChange(c, exercises.find(e => e.category === c)?.name ?? ''); setError('') }}>{c}</button>)}</div></fieldset>
    <label>種目<select required value={exercise} onChange={e => onChange(category, e.target.value)}><option value="" disabled>種目を選択してください</option>{!options.some(e => e.name === exercise) && exercise && <option value={exercise}>{exercise}（過去の記録）</option>}{options.map(e => <option value={e.name} key={e.name}>{e.name}</option>)}</select></label>
    <button type="button" className="add-exercise-toggle" aria-expanded={adding} onClick={() => { setAdding(!adding); setError('') }}>{adding ? '種目の追加を閉じる' : `＋「${category}」に自分の種目を追加`}</button>
    {adding && <div className="custom-exercise"><label>「{category}」に追加する種目名<input value={name} maxLength={80} onChange={e => { setName(e.target.value); setError('') }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); add() } }} placeholder="例：自分用のトレーニング" /></label><p>追加した種目は、次回からも選べます。</p>{error && <p role="alert" className="exercise-error">{error}</p>}<button type="button" className="secondary" onClick={add}>種目を保存して選択</button></div>}
  </div>
}
