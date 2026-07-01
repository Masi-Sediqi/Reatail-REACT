import { activities } from '../data/dashboardData.js'

function RecentActivity({ t }) {
  return (
    <section className="panel activity-panel">
      <h2>{t.recentActivity}</h2>
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
