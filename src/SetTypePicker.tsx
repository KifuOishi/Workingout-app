import { useId, useRef } from 'react'
import { setTypes } from './workouts'
import type { SetType } from './workouts'
import type { Translate } from './i18n'

function TypeIcon({ type }: { type: SetType }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'warmup' ? <path d="M12 3c1 5 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 3 2 4 2 4s3-4 1-10Z" /> : type === 'drop' ? <><path d="M5 5h5v5h5v5h4M16 12l3 3-3 3" /></> : <><path d="M6 8v8m12-8v8M3 10v4m18-4v4M6 12h12" /></>}
  </svg>
}

export default function SetTypePicker({ value, index, disabled, onChange, t }: { value: SetType; index: number; disabled: boolean; onChange: (type: SetType) => void; t: Translate }) {
  const id = useId()
  const popup = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  return <div className="set-number-control" data-set-type={value}>
    <button ref={trigger} type="button" className="set-type-trigger" popoverTarget={id} disabled={disabled} aria-label={t('setType') + ' ' + index} title={t(value)}>
      {value === 'normal' ? index : <TypeIcon type={value} />}<span className="set-type-caret" aria-hidden="true" />
    </button>
    <div id={id} ref={popup} popover="auto" className="set-type-popup" role="group" aria-label={t('setType') + ' ' + index}>
      <p>{t('set')} {index} <span> / {t('setType')}</span></p>
      {setTypes.map(type => <button key={type} type="button" data-set-type={type} aria-pressed={value === type} onClick={() => { onChange(type); popup.current?.hidePopover(); trigger.current?.focus() }}>
        <span className="set-type-icon"><TypeIcon type={type} /></span><span>{t(type)}</span><span className="set-type-selected" aria-hidden="true">{value === type ? '✓' : ''}</span>
      </button>)}
    </div>
  </div>
}
