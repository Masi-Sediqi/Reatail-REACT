function MetricCard({ labelKey, onClick, value, icon: Icon, tone = 'navy', t }) {
  const displayValue = Array.isArray(value)
    ? <span className="metric-value-list">{value.map((line) => <b key={line}>{line}</b>)}</span>
    : value

  const toneClasses = {
    blue: {
      card: 'border-l-sky-500 dark:border-l-sky-500',
      icon: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
    },
    green: {
      card: 'border-l-emerald-500 dark:border-l-emerald-500',
      icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
    navy: {
      card: 'border-l-slate-700 dark:border-l-amber-500',
      icon: 'bg-slate-100 text-slate-600 dark:bg-amber-500/15 dark:text-amber-400',
    },
    orange: {
      card: 'border-l-amber-500 dark:border-l-amber-500',
      icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    },
    red: {
      card: 'border-l-red-500 dark:border-l-red-500',
      icon: 'bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400',
    },
  }
  const currentTone = toneClasses[tone] ?? toneClasses.navy

  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">{t[labelKey]}</p>
        <strong className="mt-2 block min-w-0 text-xl font-black leading-none text-slate-950 dark:text-white sm:text-2xl">
          {displayValue}
        </strong>
      </div>
      <span className={`metric-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${currentTone.icon}`}>
        <Icon className="h-5 w-5" size={20} />
      </span>
    </>
  )
  const className = [
    'metric-card',
    'group',
    `tone-${tone}`,
    currentTone.card,
    'flex min-h-[76px] w-full min-w-0 items-center justify-between gap-4',
    'rounded-lg border border-l-[3px] border-slate-200 bg-white px-5 py-4',
    'text-start shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition duration-150',
    'dark:border-slate-800 dark:bg-slate-900 dark:shadow-none',
    onClick ? 'metric-card-clickable hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700' : '',
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button className={className} onClick={() => onClick(labelKey)} type="button">
        {content}
      </button>
    )
  }

  return (
    <article className={className}>
      {content}
    </article>
  )
}

export default MetricCard
