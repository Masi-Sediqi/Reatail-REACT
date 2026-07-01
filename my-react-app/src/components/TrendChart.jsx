const days = Array.from({ length: 30 }, (_, index) => `Jun ${index + 1}`)
const yTicks = [120, 90, 60, 30, 0]

function TrendChart({ t }) {
  return (
    <section className="panel trend-panel">
      <h2>{t.trends}</h2>
      <div className="chart-wrap" aria-label="Monthly trends chart">
        <svg viewBox="0 0 1440 260" role="img">
          <title>{t.trends}</title>
          <defs>
            <pattern id="grid" width="51.5" height="51.5" patternUnits="userSpaceOnUse">
              <path d="M 51.5 0 L 0 0 0 51.5" fill="none" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect x="36" y="16" width="1368" height="205" fill="url(#grid)" />
          <line x1="36" y1="16" x2="36" y2="221" stroke="var(--chart-axis)" strokeWidth="1.5" />
          <line x1="36" y1="221" x2="1404" y2="221" stroke="#16c27a" strokeWidth="2" />
          {yTicks.map((tick, index) => (
            <text className="axis-label" x="28" y={20 + index * 51.25} key={tick} textAnchor="end">
              {tick}
            </text>
          ))}
          {days.map((day, index) => (
            <text className="axis-label" x={36 + index * 47.2} y="238" key={day} textAnchor="middle">
              {day}
            </text>
          ))}
          <path
            d="M 1215 221 C 1234 219, 1245 79, 1262 17 C 1281 6, 1308 204, 1324 221"
            fill="none"
            stroke="var(--chart-line)"
            strokeWidth="2.5"
          />
          <path d="M 1220 221 C 1240 220, 1260 218, 1290 221" fill="none" stroke="#14c6cf" strokeWidth="2" />
        </svg>

        <div className="legend">
          <span className="legend-item navy">{t.totalRevenue}</span>
          <span className="legend-item red">{t.totalExpenses}</span>
          <span className="legend-item orange">{t.totalRefunds}</span>
          <span className="legend-item purple">{t.pendingPayments}</span>
          <span className="legend-item green">{t.sales}</span>
        </div>
      </div>
    </section>
  )
}

export default TrendChart
