import MetricCard from './MetricCard.jsx'

function Section({ onCardClick, title, cards, variant = 'grid', t }) {
  const gridClass = variant === 'financial'
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'

  return (
    <section className="dashboard-section space-y-3">
      <h2 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">{title}</h2>
      <div className={`metric-grid ${variant} grid ${gridClass} gap-4`}>
        {cards.map((card) => (
          <MetricCard {...card} key={`${title}-${card.labelKey}`} onClick={onCardClick} t={t} />
        ))}
      </div>
    </section>
  )
}

export default Section
