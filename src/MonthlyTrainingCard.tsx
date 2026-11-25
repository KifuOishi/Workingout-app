import { useState } from 'react'
import type { Translate } from './i18n'
import ProgressSection from './ProgressSection'

export default function MonthlyTrainingCard({ month, monthKey, metrics, t }: { month: string; monthKey: string; metrics: { label: string; value: string }[]; t: Translate }) {
  const [exportFailed, setExportFailed] = useState(false)

  function saveImage() {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 960
    const context = canvas.getContext('2d')
    if (!context) { setExportFailed(true); return }
    setExportFailed(false)
    const background = context.createLinearGradient(0, 0, 1080, 960)
    background.addColorStop(0, '#263b5c')
    background.addColorStop(1, '#101c30')
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#e5c991'
    context.fillRect(72, 72, 72, 6)
    context.font = '600 30px system-ui, sans-serif'
    context.fillText(month, 72, 135, 936)
    context.fillStyle = '#edeef2'
    context.font = '700 60px system-ui, sans-serif'
    context.fillText(t('monthlyCard'), 72, 225, 936)
    metrics.forEach(({ label, value }, index) => {
      const y = 280 + index * 200
      context.fillStyle = '#162238'
      context.beginPath()
      context.roundRect(72, y, 936, 172, 24)
      context.fill()
      context.fillStyle = '#c2cde0'
      context.font = '500 30px system-ui, sans-serif'
      context.fillText(label, 108, y + 55, 864)
      context.fillStyle = '#edeef2'
      context.font = '700 58px system-ui, sans-serif'
      context.fillText(value, 108, y + 128, 864)
    })
    canvas.toBlob(blob => {
      if (!blob) { setExportFailed(true); return }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lift-log-${monthKey}.png`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return <ProgressSection className="monthly-card-section" title={t('monthlyCard')}>
    <div className="monthly-card-preview">
      <time dateTime={monthKey}>{month}</time>
      <dl>{metrics.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </div>
    <button type="button" className="primary" onClick={saveImage}>{t('saveCardImage')}</button>
    {exportFailed && <p className="error" role="alert">{t('cardExportFailed')}</p>}
  </ProgressSection>
}
