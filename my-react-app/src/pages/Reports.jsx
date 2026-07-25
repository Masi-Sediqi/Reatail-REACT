import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { BarChart3, Box, CreditCard, DollarSign, ReceiptText, ShoppingCart, WalletCards } from '../components/Icons.jsx'
import { calculateBusinessMetrics, dateOptionsFor, filterByDate, formatMoney, getExpenseBreakdown, getTopCustomers } from '../utils/businessMetrics.js'
import './Reports.css'

function ReportMetric({ icon: Icon, label, tone = 'green', value }) {
  return (
    <article className="report-metric">
      <Icon className={`tone-${tone}`} size={24} />
      <div><span>{label}</span><strong>{value}</strong></div>
    </article>
  )
}

function MiniBarChart({ expenses, revenue, t }) {
  const max = Math.max(revenue, expenses, 1)
  return (
    <div className="mini-bar-chart" role="img" aria-label={t.revenueVsExpenses ?? 'Revenue vs Expenses'}>
      <div className="chart-axis">{[3000, 2250, 1500, 750, 0].map((tick) => <span key={tick}>{tick}</span>)}</div>
      <div className="bar-stage">
        <div className="bar green" style={{ height: `${Math.max(8, (revenue / max) * 88)}%` }}><span>{t.revenue ?? 'Revenue'}</span></div>
        <div className="bar red" style={{ height: `${Math.max(8, (expenses / max) * 88)}%` }}><span>{t.expenses}</span></div>
      </div>
    </div>
  )
}

function BreakdownPie({ breakdown, t }) {
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
  const top = breakdown[0]
  const percent = total > 0 && top ? Math.round((top.amount / total) * 100) : 0
  return (
    <div className="breakdown-pie">
      <div className="pie-circle"><span>{percent}%</span></div>
      <div>
        <strong>{top?.category || t.noRecordsFound}</strong>
        <span>{top ? formatMoney(top.amount) : formatMoney(0)}</span>
      </div>
    </div>
  )
}

function ReportsPage({ cashWallet, companyInfo, expenses = [], printSettings, products = [], sales = [], staffMembers = [], t }) {
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const filteredSales = useMemo(() => filterByDate(sales, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, sales])
  const filteredExpenses = useMemo(() => filterByDate(expenses, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, expenses])
  const metrics = useMemo(() => calculateBusinessMetrics({ cashWallet, expenses: filteredExpenses, products, sales: filteredSales, staffMembers }), [cashWallet, filteredExpenses, filteredSales, products, staffMembers])
  const breakdown = useMemo(() => getExpenseBreakdown(filteredExpenses), [filteredExpenses])
  const topCustomers = useMemo(() => getTopCustomers(filteredSales), [filteredSales])
  const options = useMemo(() => dateOptionsFor(t), [t])
  const paidCount = filteredSales.filter((sale) => Number(sale.balance || 0) <= 0).length
  const pendingCount = filteredSales.length - paidCount
  const printRows = [
    { id: 'revenue', item: t.revenue ?? 'Revenue', amount: metrics.formatted.revenue },
    { id: 'expenses', item: t.expenses, amount: metrics.formatted.expenseTotal },
    { id: 'sales', item: t.totalSales, amount: metrics.totalSales },
    { id: 'net-profit', item: t.netProfit, amount: metrics.formatted.netProfit },
    { id: 'stock', item: t.stock ?? 'Stock', amount: metrics.formatted.stockValue },
  ]

  return (
    <section className="entity-content reports-content">
      <div className="entity-heading reports-heading">
        <div><h1>{t.reports}</h1><p>{t.analyzeBusinessData ?? 'Analyze your business data'}</p></div>
        <div className="entity-actions report-actions">
  <div
    className={`report-date-control ${
      dateFilter === 'custom'
        ? 'has-custom-range'
        : ''
    }`}
  >
    <CustomSelect
      ariaLabel={t.allTime}
      options={options}
      value={dateFilter}
      onChange={setDateFilter}
    />

    {dateFilter === 'custom' && (
      <DateRangePicker
        className="report-date-range"
        end={customEndDate}
        onChange={({ start, end }) => {
          setCustomStartDate(start)
          setCustomEndDate(end)
        }}
        start={customStartDate}
        t={t}
      />
    )}
  </div>

  <button
    className="report-print-btn"
    type="button"
    onClick={() => setPrintOpen(true)}
  >
    <ReceiptText size={15} />
    <span>{t.print}</span>
  </button>
</div>
      </div>

      <div className="report-metric-grid">
        <ReportMetric icon={DollarSign} label={t.revenue ?? 'Revenue'} value={metrics.formatted.revenue} />
        <ReportMetric icon={BarChart3} label={t.expenses} tone="red" value={metrics.formatted.expenseTotal} />
        <ReportMetric icon={ShoppingCart} label={t.totalSales} tone="blue" value={metrics.totalSales} />
        <ReportMetric icon={Box} label={t.netProfit} tone="navy" value={metrics.formatted.netProfit} />
        <ReportMetric icon={BarChart3} label={t.pureProfit} value={metrics.formatted.pureProfit} />
        <ReportMetric icon={CreditCard} label={t.staffPayable} tone="orange" value={metrics.formatted.staffPayable} />
        <ReportMetric icon={DollarSign} label={t.staffPaid} value={metrics.formatted.staffPaid} />
        <ReportMetric icon={WalletCards} label={t.upcomingPayroll ?? 'Upcoming Payroll'} tone="blue" value={t.noUpcoming ?? 'No upcoming'} />
      </div>

      <h2 className="report-section-title">{t.financialStatements ?? 'Financial statements'}</h2>
      <div className="statement-card-grid">
        <article><ReceiptText size={22} /><div><span>{t.profitAndLoss ?? 'Profit & Loss'}</span><strong>{t.profitAndLossHint ?? 'Revenue, costs and profitability for the selected period'}</strong></div></article>
        <article><BarChart3 size={22} /><div><span>{t.balanceSheet ?? 'Balance Sheet'}</span><strong>{t.balanceSheetHint ?? 'Assets, liabilities and equity as of today'}</strong></div></article>
        <article><WalletCards size={22} /><div><span>{t.cashFlow ?? 'Cash Flow'}</span><strong>{t.cashFlowHint ?? 'Cash movements grouped by activity'}</strong></div></article>
      </div>

      <div className="report-chart-grid">
        <section className="report-panel">
          <h2><BarChart3 size={20} /> {t.revenueVsExpenses ?? 'Revenue vs Expenses'}</h2>
          <MiniBarChart expenses={metrics.expenseTotal} revenue={metrics.revenue} t={t} />
        </section>
        <section className="report-panel">
          <h2>{t.categoryBreakdown ?? 'Category Breakdown'}</h2>
          <BreakdownPie breakdown={breakdown} t={t} />
        </section>
        <section className="report-panel">
          <h2>{t.weeklyTrends ?? 'Weekly Trends'}</h2>
          <div className="weekly-trend-line"><span style={{ width: `${Math.min(100, filteredSales.length * 14)}%` }} /></div>
          <p>{filteredSales.length} {t.totalSales}</p>
        </section>
        <section className="report-panel">
          <h2>{t.paymentStatus ?? 'Payment Status'}</h2>
          <div className="payment-donut"><span>{t.paid}: {paidCount}</span><b>{t.pending}: {pendingCount}</b></div>
        </section>
      </div>

      <section className="report-panel top-customers-panel">
        <h2>{t.topCustomers ?? 'Top Customers'}</h2>
        {topCustomers.length === 0 ? <div className="empty-cell">{t.noRecordsFound}</div> : topCustomers.map((customer, index) => (
          <div className="top-customer-row" key={customer.name}>
            <span>{index + 1}</span>
            <strong>{customer.name}</strong>
            <b>{customer.label}</b>
          </div>
        ))}
      </section>

      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printRows} title={t.reports} columns={[{ key: 'item', label: t.item ?? 'Item' }, { key: 'amount', label: t.amount }]} t={t} />}
    </section>
  )
}

export default ReportsPage
