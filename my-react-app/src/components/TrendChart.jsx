import { useMemo, useState } from 'react'

const defaultSeries = Array.from({ length: 31 }, (_, index) => ({
  label: `Day ${index + 1}`,
  revenue: 0,
  expenses: 0,
  refunds: 0,
  pending: 0,
  sales: 0,
}))

const metrics = [
  { key: 'revenue', className: 'navy', labelKey: 'totalRevenue' },
  { key: 'expenses', className: 'red', labelKey: 'totalExpenses' },
  { key: 'refunds', className: 'orange', labelKey: 'totalRefunds' },
  { key: 'pending', className: 'purple', labelKey: 'pendingPayments' },
  { key: 'sales', className: 'green', labelKey: 'sales' },
]

const chart = { height: 300, plotHeight: 225, plotLeft: 56, plotTop: 4, plotWidth: 1328, width: 1440 }
const formatValue = (value) => Number(value || 0).toLocaleString()

const buildPoints = (series, key, maxValue) => {
  const step = series.length > 1 ? chart.plotWidth / (series.length - 1) : 0
  return series.map((point, index) => ({
    x: chart.plotLeft + step * index,
    y: chart.plotTop + chart.plotHeight - ((Number(point[key]) || 0) / maxValue) * chart.plotHeight,
    value: Number(point[key]) || 0,
  }))
}

const buildSmoothPath = (points) => {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    const previous = points[index - 1]
    const controlGap = (point.x - previous.x) / 2
    return `${path} C ${(previous.x + controlGap).toFixed(1)} ${previous.y.toFixed(1)}, ${(point.x - controlGap).toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  }, '')
}

const buildAreaPath = (points) => {
  if (!points.length) return ''
  const line = buildSmoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x.toFixed(1)} ${chart.plotTop + chart.plotHeight} L ${first.x.toFixed(1)} ${chart.plotTop + chart.plotHeight} Z`
}

const getActiveIndex = (series) => {
  const index = series.findLastIndex((point) => metrics.some((metric) => Number(point[metric.key]) > 0))
  return index >= 0 ? index : Math.min(2, series.length - 1)
}

function TrendChart({ data = defaultSeries, t }) {
  const series = data.length ? data : defaultSeries
  const [hoverIndex, setHoverIndex] = useState(null)
  const activeIndex = hoverIndex ?? getActiveIndex(series)

  const { plotted, yTicks } = useMemo(() => {
    const maxValue = Math.max(1, ...series.flatMap((point) => metrics.map((metric) => Number(point[metric.key]) || 0)))
    const nextMax = Math.max(1, Math.ceil(maxValue / 500) * 500)
    return {
      plotted: Object.fromEntries(metrics.map((metric) => [metric.key, buildPoints(series, metric.key, nextMax)])),
      yTicks: [nextMax, nextMax * 0.75, nextMax * 0.5, nextMax * 0.25, 0],
    }
  }, [series])

  const activePoint = series[activeIndex] ?? series[0]
  const activeX = plotted.revenue?.[activeIndex]?.x ?? chart.plotLeft
  const labelEvery = Math.max(1, Math.ceil(series.length / 14))
  const tooltipLeft = `${Math.min(82, Math.max(8, (activeX / chart.width) * 100 + 1.2))}%`

  const updateHover = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const chartX = ratio * chart.width
    const progress = (chartX - chart.plotLeft) / chart.plotWidth
    const nextIndex = Math.round(Math.min(1, Math.max(0, progress)) * (series.length - 1))
    setHoverIndex(nextIndex)
  }

  return (
    <section className="panel trend-panel">
      <h2>{t.trends}</h2>
      <div
        className="chart-wrap trend-chart-wrap"
        aria-label={t.trends}
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={updateHover}
      >
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img">
          <title>{t.trends}</title>
          <defs>
            <pattern id="trend-grid" width="120" height="51.25" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 51.25" fill="none" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
            <linearGradient id="trend-revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={chart.plotLeft} y={chart.plotTop} width={chart.plotWidth} height={chart.plotHeight} fill="url(#trend-grid)" />
          <line x1={chart.plotLeft} y1={chart.plotTop} x2={chart.plotLeft} y2={chart.plotTop + chart.plotHeight} stroke="var(--chart-axis)" strokeWidth="1.5" />
          <line x1={chart.plotLeft} y1={chart.plotTop + chart.plotHeight} x2={chart.plotLeft + chart.plotWidth} y2={chart.plotTop + chart.plotHeight} stroke="#10b981" strokeWidth="2" />

          {yTicks.map((tick, index) => (
            <text className="axis-label" x="44" y={chart.plotTop + 4 + index * (chart.plotHeight / 4)} key={`${tick}-${index}`} textAnchor="end">
              {Math.round(tick).toLocaleString()}
            </text>
          ))}

          {series.map((point, index) => (
            index % labelEvery === 0 || index === series.length - 1
              ? <text className="axis-label" x={plotted.revenue[index].x} y={chart.plotTop + chart.plotHeight + 18} key={`${point.label}-${index}`} textAnchor="middle">{point.label}</text>
              : null
          ))}

          <path d={buildAreaPath(plotted.revenue)} fill="url(#trend-revenue-fill)" />
          {metrics.map((metric) => (
            <path className={`trend-line ${metric.className}`} d={buildSmoothPath(plotted[metric.key])} fill="none" key={metric.key} />
          ))}

          <line className="trend-active-line" x1={activeX} x2={activeX} y1={chart.plotTop} y2={chart.plotTop + chart.plotHeight} />
          {metrics.map((metric) => {
            const point = plotted[metric.key]?.[activeIndex]
            if (!point) return null
            return <circle className={`trend-dot active ${metric.className}`} cx={point.x} cy={point.y} key={metric.key} r={metric.key === 'revenue' ? 4.5 : 3.4} />
          })}
        </svg>

        {activePoint && (
          <div className="trend-html-tooltip" style={{ left: tooltipLeft }}>
            <strong>{activePoint.label}</strong>
            {metrics.map((metric) => (
              <span className={`tooltip-line ${metric.className}`} key={metric.key}>
                {t[metric.labelKey] ?? metric.labelKey}: {formatValue(activePoint[metric.key])}
              </span>
            ))}
          </div>
        )}

        <div className="legend trend-legend">
          {metrics.map((metric) => <span className={`legend-item ${metric.className}`} key={metric.key}>{t[metric.labelKey] ?? metric.labelKey}</span>)}
        </div>
      </div>
    </section>
  )
}

export default TrendChart
