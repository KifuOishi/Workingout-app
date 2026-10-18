import type { ReactNode } from 'react'

export default function ProgressSection({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return <details className={`progress-disclosure ${className}`}>
    <summary><h2>{title}</h2><span className="progress-chevron" aria-hidden="true" /></summary>
    <div className="progress-disclosure-content" role="region" aria-label={title}>{children}</div>
  </details>
}
