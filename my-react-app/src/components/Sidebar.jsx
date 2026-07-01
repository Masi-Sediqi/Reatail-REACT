import { ChevronLeft } from './Icons.jsx'
import { sidebarItems } from '../data/dashboardData.js'

function Sidebar({ activePage, companyInfo, onNavigate, t }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          {companyInfo.logo ? (
            <img src={companyInfo.logo} alt="" />
          ) : (
            <span>▣</span>
          )}
        </div>
        <div>
          <strong>{companyInfo.name || 'RetailPro'}</strong>
          <small>{companyInfo.tagline || t.retailManagement}</small>
        </div>
        <button className="collapse-btn" aria-label="Collapse sidebar">
          <ChevronLeft size={18} />
        </button>
      </div>

      <nav className="side-nav" aria-label="Main navigation">
        {sidebarItems.map((item) => {
          const ItemIcon = item.icon

          return (
            <button
              className={activePage === item.page ? 'active' : ''}
              type="button"
              key={item.key}
              onClick={() => item.page && onNavigate(item.page)}
            >
              <ItemIcon size={20} />
              <span>{t[item.key]}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <span>v6.5.0 • {t.retailManagement}</span>
        <span className="info-dot">i</span>
      </div>
    </aside>
  )
}

export default Sidebar
