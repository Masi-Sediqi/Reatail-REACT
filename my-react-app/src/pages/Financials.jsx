import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { BarChart3, CalendarDays, CreditCard, DollarSign, ReceiptText, WalletCards } from '../components/Icons.jsx'
import { calculateBusinessMetrics, dateOptionsFor, filterByDate, formatMoney } from '../utils/businessMetrics.js'
import './Financials.css'

function FinancialMetric({ icon: Icon, label, tone = 'green', value }) {
  return (
    <article className={`financial-metric tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Icon size={22} />
    </article>
  )
}

function StatementRow({ amount, label, note, tone = '' }) {
  return (
    <div className={`statement-row ${tone}`.trim()}>
      <div><strong>{label}</strong><span>{note}</span></div>
      <b>{amount}</b>
    </div>
  )
}

function FinancialsPage({ cashWallet, companyInfo, expenses = [], printSettings, products = [], sales = [], staffMembers = [], t }) {
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const filteredSales = useMemo(() => filterByDate(sales, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, sales])
  const filteredExpenses = useMemo(() => filterByDate(expenses, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, expenses])
  const metrics = useMemo(() => calculateBusinessMetrics({ cashWallet, expenses: filteredExpenses, products, sales: filteredSales, staffMembers }), [cashWallet, filteredExpenses, filteredSales, products, staffMembers])
  const options = useMemo(() => dateOptionsFor(t), [t])
  const printRows = [
    { id: 'revenue', item: t.revenue ?? 'Revenue', amount: metrics.formatted.revenue },
    { id: 'expenses', item: t.expenses, amount: metrics.formatted.expenseTotal },
    { id: 'net-profit', item: t.netProfit, amount: metrics.formatted.netProfit },
    { id: 'pending', item: t.pendingPayments, amount: metrics.formatted.pendingPayments },
    { id: 'stock', item: t.stock ?? 'Stock', amount: metrics.formatted.stockValue },
    { id: 'staff-paid', item: t.staffPaid, amount: metrics.formatted.staffPaid },
  ]

  return (
    <section className="entity-content financials-content">
      <div className="entity-heading financials-heading">
        <div><h1>{t.financials}</h1><p>{t.trackFinancialPerformance ?? 'Track your financial performance'}</p></div>
        <div className="entity-actions financial-actions">
  <div
    className={`financial-date-control ${
      dateFilter === 'custom' ? 'has-custom-range' : ''
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
        className="financial-date-range"
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
    className="financial-print-btn"
    type="button"
    onClick={() => setPrintOpen(true)}
  >
    <ReceiptText size={15} />
    <span>{t.print}</span>
  </button>
</div>
      </div>

      <div className="financial-metric-grid">
        <FinancialMetric icon={DollarSign} label={t.revenue ?? 'Revenue'} value={metrics.formatted.revenue} />
        <FinancialMetric icon={WalletCards} label={t.expenses} tone="red" value={metrics.formatted.expenseTotal} />
        <FinancialMetric icon={BarChart3} label={t.grossProfit ?? 'Gross Profit'} value={metrics.formatted.grossProfit} />
        <FinancialMetric icon={BarChart3} label={t.netProfit} value={metrics.formatted.netProfit} />
        <FinancialMetric icon={BarChart3} label={t.pureProfit} value={metrics.formatted.pureProfit} />
        <FinancialMetric icon={CreditCard} label={t.totalDiscounts ?? 'Total Discounts'} tone="red" value={metrics.formatted.discountTotal} />
        <FinancialMetric icon={WalletCards} label={t.stock ?? 'Stock'} tone="blue" value={metrics.formatted.stockValue} />
        <FinancialMetric icon={CreditCard} label={t.staffPayable} tone="orange" value={metrics.formatted.staffPayable} />
        <FinancialMetric icon={DollarSign} label={t.staffPaid} value={metrics.formatted.staffPaid} />
        <FinancialMetric icon={CalendarDays} label={t.upcomingPayroll ?? 'Upcoming Payroll'} tone="navy" value={t.noUpcoming ?? 'No upcoming'} />
      </div>

      <div className="financial-layout">
        <section className="financial-panel">
          <h2>{t.revenue ?? 'Revenue'}</h2>
          <StatementRow amount={metrics.formatted.paidRevenue} label={t.paid} note={t.sales} tone="success" />
          <StatementRow amount={metrics.formatted.pendingPayments} label={t.pendingPayments} note={t.remaining} tone="warning" />
          <StatementRow amount={formatMoney(metrics.paidRevenue + metrics.pendingPayments)} label={t.total} note={t.revenue ?? 'Revenue'} />
        </section>
        <section className="financial-panel">
          <h2>{t.financialSummary ?? 'Financial Summary'}</h2>
          <StatementRow amount={`+${metrics.formatted.revenue}`} label={t.revenue ?? 'Revenue'} note={t.sales} tone="success fill" />
          <StatementRow amount={`-${metrics.formatted.expenseTotal}`} label={t.expenses} note={t.expenses} tone="danger fill" />
          <StatementRow amount={`+${metrics.formatted.netProfit}`} label={t.netProfit} note={`${t.revenue ?? 'Revenue'} - ${t.expenses}`} tone="success outline" />
        </section>
      </div>

      <section className="financial-panel total-stock-panel">
        <h2>{t.totalStock ?? 'Total Stock'}</h2>
        <div className="stock-mini-grid">
          <div><span>{t.revenue ?? 'Revenue'}</span><strong>{metrics.formatted.revenue}</strong></div>
          <div><span>{t.pendingPayments}</span><strong>{metrics.formatted.pendingPayments}</strong></div>
          <div><span>{t.stock ?? 'Stock'}</span><strong>{metrics.formatted.stockValue}</strong></div>
        </div>
      </section>

      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printRows} title={t.financials} columns={[{ key: 'item', label: t.item ?? 'Item' }, { key: 'amount', label: t.amount }]} t={t} />}
    </section>
  )
}

export default FinancialsPage
