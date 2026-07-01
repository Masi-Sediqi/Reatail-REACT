import QuickActions from '../components/QuickActions.jsx'
import RecentActivity from '../components/RecentActivity.jsx'
import Section from '../components/Section.jsx'
import TrendChart from '../components/TrendChart.jsx'
import { CalendarDays, ChevronDown } from '../components/Icons.jsx'
import {
  financialCards,
  staffCards,
  stockCards,
  supplierCards,
} from '../data/dashboardData.js'

function Dashboard({ t }) {
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>{t.dashboard}</h1>
          <p>{t.welcome}</p>
        </div>
        <div className="heading-actions">
          <button className="period-control" type="button">
            <CalendarDays size={18} />
            <span>{t.monthly}</span>
            <ChevronDown size={16} />
          </button>
          <button className="close-filter" type="button" aria-label="Close filter">
            ×
          </button>
        </div>
      </div>

      <Section title={t.financialOverview} cards={financialCards} variant="financial" t={t} />
      <Section title={t.suppliersOverview} cards={supplierCards} variant="three" t={t} />
      <Section title={t.stockOverview} cards={stockCards} variant="three" t={t} />
      <Section title={t.staffOverview} cards={staffCards} variant="three" t={t} />
      <TrendChart t={t} />

      <div className="bottom-grid">
        <QuickActions t={t} />
        <RecentActivity t={t} />
      </div>
    </div>
  )
}

export default Dashboard
