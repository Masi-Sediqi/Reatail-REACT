import MetricCard from './MetricCard.jsx'

function Section({ title, cards, variant = 'grid', t }) {
  return (
    <section className="dashboard-section">
      <h2>{title}</h2>
      <div className={`metric-grid ${variant}`}>
        {cards.map((card) => (
          <MetricCard {...card} key={`${title}-${card.labelKey}`} t={t} />
        ))}
      </div>
    </section>
  )
}

export default Section
