import { activities } from '../data/dashboardData.js'

function RecentActivity({ t }) {
  return (
    <section className="panel activity-panel rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-6">
      <h2 className="mb-4 text-base font-black text-slate-950 dark:text-white sm:text-lg">{t.recentActivity}</h2>
      <div className="activity-list">
        {activities.map((activity) => {
          const ActivityIcon = activity.icon

          return (
            <article className="activity-item" key={activity.titleKey}>
              <span className={`activity-icon ${activity.tone}`}>
                <ActivityIcon size={18} />
              </span>
              <div>
                <strong>{t[activity.titleKey]}</strong>
                <p>{activity.detailKey ? t[activity.detailKey] : activity.detail}</p>
              </div>
              <time>{activity.time}</time>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default RecentActivity
