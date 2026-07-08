import { quickActions } from '../data/dashboardData.js'

function QuickActions({ onNavigate, t }) {
  return (
    <section className="panel quick-panel">
      <h2>{t.quickActions}</h2>
      <div className="quick-grid">
        {quickActions.map((action) => {
          const ActionIcon = action.icon

          return (
            <button className={action.featured ? 'quick-action featured' : 'quick-action'} type="button" key={action.labelKey} onClick={() => action.page && onNavigate?.(action.page)}>
              <ActionIcon size={22} />
              <span>{t[action.labelKey]}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuickActions
