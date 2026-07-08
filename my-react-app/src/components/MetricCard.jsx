function MetricCard({ labelKey, onClick, value, icon: Icon, tone = 'navy', t }) {
  const content = (
    <>
      <div>
        <p>{t[labelKey]}</p>
        <strong>{value}</strong>
      </div>
      <span className="metric-icon">
        <Icon size={21} />
      </span>
    </>
  )

  if (onClick) {
    return (
      <button className={`metric-card metric-card-clickable tone-${tone}`} onClick={() => onClick(labelKey)} type="button">
        {content}
      </button>
    )
  }

  return (
    <article className={`metric-card tone-${tone}`}>
      {content}
    </article>
  )
}

export default MetricCard
