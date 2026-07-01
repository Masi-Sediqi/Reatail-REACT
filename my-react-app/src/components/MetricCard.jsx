function MetricCard({ labelKey, value, icon: Icon, tone = 'navy', t }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div>
        <p>{t[labelKey]}</p>
        <strong>{value}</strong>
      </div>
      <span className="metric-icon">
        <Icon size={21} />
      </span>
    </article>
  )
}

export default MetricCard
