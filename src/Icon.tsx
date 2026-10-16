type Name = 'home' | 'workout' | 'templates' | 'calendar' | 'history' | 'progress' | 'arrow'
export default function Icon({ name, className = '' }: { name: Name; className?: string }) {
  const paths = {
    progress: <><path d="M4 3v17h17M7 15l4-5 4 3 5-7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m6 0h1m-8 3h1" /></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-8h6v8" /></>,
    workout: <><path d="m6 6 12 12M4 8l4-4M2 6l4-4m10 18 4-4m-2 6 4-4M4 4l4 4m8 8 4 4" /></>,
    templates: <><rect x="7" y="3" width="14" height="17" rx="3" /><path d="M3 7v12a4 4 0 0 0 4 4m4-15h6m-6 4h6m-6 4h4" /></>,
    history: <><path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  }
  return <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
