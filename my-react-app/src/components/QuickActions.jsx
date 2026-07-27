import { quickActions } from '../data/dashboardData.js'

function QuickActions({ onNavigate, t }) {
  return (
    <section className="panel quick-panel rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-6">
      <h2 className="mb-4 text-base font-black text-slate-950 dark:text-white sm:text-lg">{t.quickActions}</h2>
      <div className="quick-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
        {quickActions.map((action) => {
          const ActionIcon = action.icon

          return (
            <button
              className={[
                'quick-action flex min-h-14 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition',
                'border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800',
                action.featured ? 'featured border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-400 dark:border-amber-500 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              key={action.labelKey}
              onClick={() => action.page && onNavigate?.(action.page)}
            >
              <ActionIcon className="h-5 w-5" size={20} />
              <span>{t[action.labelKey]}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuickActions
