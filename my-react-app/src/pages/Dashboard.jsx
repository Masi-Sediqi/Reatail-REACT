import { useMemo, useState } from 'react'
import QuickActions from '../components/QuickActions.jsx'
import RecentActivity from '../components/RecentActivity.jsx'
import Section from '../components/Section.jsx'
import TrendChart from '../components/TrendChart.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import { X } from '../components/Icons.jsx'
import './Dashboard.css'
import {
  financialCards,
  staffCards,
  stockCards,
  supplierCards,
} from '../data/dashboardData.js'
import { calculateBusinessMetrics, dateOptionsFor, filterByDate, formatMoney, parseDate, parseNumber } from '../utils/businessMetrics.js'

const getSaleBalance = (sale) => {
  const hasBalance = sale.balance !== undefined && sale.balance !== null && sale.balance !== ''
  return Math.max(0, hasBalance ? parseNumber(sale.balance) : parseNumber(sale.total) - parseNumber(sale.paidAmount))
}

const dateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTrendKey = (date, filter) => {
  if (!date) return null
  if (filter === 'today') return `${date.getHours().toString().padStart(2, '0')}:00`
  if (filter === 'weekly' || filter === 'monthly' || filter === 'custom') {
    return dateInput(date)
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const getTrendBuckets = (filter, customStartDate, customEndDate) => {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  if (filter === 'today') {
    return Array.from({ length: 24 }, (_, hour) => ({ key: `${String(hour).padStart(2, '0')}:00`, label: `${hour}:00` }))
  }
  if (filter === 'annual' || filter === 'all') {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), index, 1)
      return { key: getTrendKey(date, 'annual'), label: date.toLocaleDateString(undefined, { month: 'short' }) }
    })
  }
  const start = filter === 'custom' && customStartDate
    ? parseDate(customStartDate)
    : new Date(today.getFullYear(), today.getMonth(), filter === 'weekly' ? today.getDate() - 6 : 1)
  const end = filter === 'custom' && customEndDate
    ? parseDate(customEndDate)
    : filter === 'monthly'
      ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
      : today
  const buckets = []
  const cursor = new Date(start)
  cursor.setHours(12, 0, 0, 0)
  while (cursor <= end && buckets.length < 62) {
    buckets.push({
      key: getTrendKey(cursor, filter),
      label: cursor.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return buckets
}

const buildTrendData = ({ customEndDate, customStartDate, expenses, filter, sales }) => {
  const buckets = getTrendBuckets(filter, customStartDate, customEndDate)
  const totals = new Map(buckets.map((bucket) => [bucket.key, { ...bucket, revenue: 0, expenses: 0, refunds: 0, pending: 0, sales: 0 }]))
  const ensure = (label) => {
    if (!label) return null
    if (!totals.has(label)) totals.set(label, { label, revenue: 0, expenses: 0, refunds: 0, pending: 0, sales: 0 })
    return totals.get(label)
  }

  sales.forEach((sale) => {
    const bucket = ensure(getTrendKey(parseDate(sale.date || sale.createdAt), filter))
    if (!bucket) return
    bucket.revenue += parseNumber(sale.total)
    bucket.pending += getSaleBalance(sale)
    bucket.refunds += (sale.refundHistory || []).reduce((sum, refund) => sum + parseNumber(refund.amount), 0)
    bucket.sales += 1
  })

  expenses.forEach((expense) => {
    const bucket = ensure(getTrendKey(parseDate(expense.date || expense.createdAt), filter))
    if (bucket) bucket.expenses += parseNumber(expense.amount)
  })

  return [...totals.values()]
}

function Dashboard({ cashWallet, customers = [], expenses = [], onNavigate, products = [], sales = [], staffMembers = [], suppliers = [], t }) {
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const filteredSales = useMemo(() => filterByDate(sales, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, sales])
  const filteredExpenses = useMemo(() => filterByDate(expenses, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, expenses])
  const trendData = useMemo(() => buildTrendData({ customEndDate, customStartDate, expenses: filteredExpenses, filter: dateFilter, sales: filteredSales }), [customEndDate, customStartDate, dateFilter, filteredExpenses, filteredSales])
  const dashboardMetrics = useMemo(() => {
    const metrics = calculateBusinessMetrics({ cashWallet, expenses: filteredExpenses, products, sales: filteredSales, staffMembers })
    const totalPayables = suppliers.reduce((sum, supplier) => sum + Math.max(0, parseNumber(supplier.balance)), 0)
    const totalReceivables = customers.reduce((sum, customer) => sum + parseNumber(customer.pending), 0)
    return {
      activeProducts: String(products.length),
      currentCashWallet: metrics.currentCashWallet,
      globalStockValue: metrics.formatted.stockValue,
      netBalance: formatMoney(totalPayables - totalReceivables),
      netProfit: metrics.formatted.netProfit,
      pendingPayments: metrics.formatted.pendingPayments,
      pureProfit: metrics.formatted.pureProfit,
      staffPaid: metrics.formatted.staffPaid,
      staffPayable: metrics.formatted.staffPayable,
      stockQuantity: String(metrics.stockQuantity),
      totalCustomers: String(customers.length),
      totalExpenses: metrics.formatted.expenseTotal,
      totalPayables: formatMoney(totalPayables),
      totalReceivables: formatMoney(totalReceivables),
      totalRefunds: metrics.totalRefunds,
      totalRevenue: metrics.formatted.revenue,
      totalSales: String(filteredSales.length),
      totalStaff: String(staffMembers.length),
    }
  }, [cashWallet, customers, filteredExpenses, filteredSales, products, staffMembers, suppliers])
  const dateOptions = useMemo(() => dateOptionsFor(t), [t])
  const resetDateFilter = () => {
    setDateFilter('monthly')
    setCustomStartDate('')
    setCustomEndDate('')
  }
  const withValues = (cards) => cards.map((card) => ({
    ...card,
    value: dashboardMetrics?.[card.labelKey] ?? card.value,
  }))
  const openMetric = (metricKey) => onNavigate?.(`dashboardMetric:${metricKey}`)

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>{t.dashboard}</h1>
          <p>{t.welcome}</p>
        </div>
        <div className={`heading-actions dashboard-date-actions ${dateFilter === 'custom' ? 'has-custom-range' : ''}`}>
          <div className="dashboard-date-control">
            <CustomSelect
              ariaLabel={t.allTime}
              className="dashboard-filter-select"
              options={dateOptions}
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>
          {dateFilter === 'custom' && (
            <div className="dashboard-range-shell">
              <DateRangePicker
                className="dashboard-date-range"
                end={customEndDate}
                onChange={({ start, end }) => {
                  setCustomStartDate(start)
                  setCustomEndDate(end)
                }}
                start={customStartDate}
                t={t}
              />
              <button className="dashboard-filter-reset" type="button" aria-label={t.resetFilter ?? 'Reset filter'} title={t.resetFilter ?? 'Reset filter'} onClick={resetDateFilter}>
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      <Section title={t.financialOverview} cards={withValues(financialCards)} onCardClick={openMetric} variant="financial" t={t} />
      <Section title={t.suppliersOverview} cards={withValues(supplierCards)} onCardClick={openMetric} variant="three" t={t} />
      <Section title={t.stockOverview} cards={withValues(stockCards)} onCardClick={openMetric} variant="three" t={t} />
      <Section title={t.staffOverview} cards={withValues(staffCards)} onCardClick={openMetric} variant="three" t={t} />
      <TrendChart data={trendData} t={t} />

      <div className="bottom-grid">
        <QuickActions onNavigate={onNavigate} t={t} />
        <RecentActivity t={t} />
      </div>
    </div>
  )
}

export default Dashboard
