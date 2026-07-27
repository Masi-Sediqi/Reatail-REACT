import { useMemo, useState } from 'react'
import QuickActions from '../components/QuickActions.jsx'
import RecentActivity from '../components/RecentActivity.jsx'
import Section from '../components/Section.jsx'
import TrendChart from '../components/TrendChart.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import './Dashboard.css'
import {
  financialCards,
  staffCards,
  stockCards,
  supplierCards,
} from '../data/dashboardData.js'
import { calculateBusinessMetrics, dateOptionsFor, filterByDate, parseDate, parseNumber } from '../utils/businessMetrics.js'
import { convertAndFormatCurrency } from '../utils/currencyExchange.js'

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

const formatWalletLinesByCurrency = ({
  baseCurrency = 'AFN',
  cashWallet = 0,
  entries = [],
  exchangeRates = {},
  expenses = [],
  sales = [],
  targetCurrency = baseCurrency,
}) => {
  const totals = new Map()
  const add = (currency, amount) => {
    const value = parseNumber(amount)
    if (!value) return
    const key = currency || 'AFN'
    totals.set(key, (totals.get(key) || 0) + value)
  }

  sales.forEach((sale) => add(sale.currency, parseNumber(sale.paidAmount)))
  expenses.forEach((expense) => add(expense.currency, -parseNumber(expense.amount)))
  entries.forEach((entry) => add(entry.currency, entry.type === 'deposit' ? entry.amount : -parseNumber(entry.amount)))

  if (!totals.size && parseNumber(cashWallet) !== 0) add('AFN', cashWallet)

  const lines = [...totals.entries()]
    .filter(([, amount]) => Math.abs(amount) > 0.000001)
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
    .map(([currency, amount]) => convertAndFormatCurrency(amount, {
      baseCurrency,
      exchangeRates,
      fromCurrency: currency,
      targetCurrency,
    }))

  return lines.length ? lines : [convertAndFormatCurrency(0, { baseCurrency, exchangeRates, fromCurrency: baseCurrency, targetCurrency })]
}

const getStaffPayableByHistory = (history = []) => {
  const latestPayableByPeriod = new Map()
  history.forEach((entry) => {
    latestPayableByPeriod.set(`${entry.start || ''}__${entry.end || ''}`, parseNumber(entry.payable))
  })
  return [...latestPayableByPeriod.values()].reduce((sum, amount) => sum + amount, 0)
}

const formatStaffLinesByCurrency = (
  staffMembers = [],
  type = 'paid',
  {
    baseCurrency = 'AFN',
    exchangeRates = {},
    targetCurrency = baseCurrency,
  } = {},
) => {
  const totals = new Map()
  const add = (currency, amount) => {
    const value = parseNumber(amount)
    if (!value) return
    const key = currency || 'AFN'
    totals.set(key, (totals.get(key) || 0) + value)
  }

  staffMembers.forEach((staff) => {
    if (type === 'payable') {
      add(staff.currency, getStaffPayableByHistory(staff.payrollHistory || []))
      return
    }
    ;(staff.payrollHistory || []).forEach((entry) => add(entry.currency || staff.currency, entry.paidAmount))
  })

  const lines = [...totals.entries()]
    .filter(([, amount]) => Math.abs(amount) > 0.000001)
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
    .map(([currency, amount]) => convertAndFormatCurrency(amount, {
      baseCurrency,
      exchangeRates,
      fromCurrency: currency,
      targetCurrency,
    }))

  return lines.length ? lines : [convertAndFormatCurrency(0, { baseCurrency, exchangeRates, fromCurrency: baseCurrency, targetCurrency })]
}

function Dashboard({
  baseCurrency = 'AFN',
  businessCurrencyFilter = 'all',
  cashWallet,
  cashWalletEntries = [],
  customers = [],
  exchangeCurrency = 'original',
  exchangeRates = {},
  expenses = [],
  onNavigate,
  products = [],
  sales = [],
  staffMembers = [],
  suppliers = [],
  t,
}) {
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const stockAlertCount = useMemo(() => products.filter((product) => {
    const quantity = parseNumber(product.quantity)
    const lowStock = parseNumber(product.lowStock || product.lowStockThreshold)
    return quantity <= 0 || (lowStock > 0 && quantity <= lowStock)
  }).length, [products])
  const filteredSales = useMemo(() => filterByDate(sales, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, sales])
  const filteredExpenses = useMemo(() => filterByDate(expenses, dateFilter, customStartDate, customEndDate), [customEndDate, customStartDate, dateFilter, expenses])
  const trendData = useMemo(() => buildTrendData({ customEndDate, customStartDate, expenses: filteredExpenses, filter: dateFilter, sales: filteredSales }), [customEndDate, customStartDate, dateFilter, filteredExpenses, filteredSales])
  const dashboardMetrics = useMemo(() => {
    const targetCurrency = exchangeCurrency !== 'original'
      ? exchangeCurrency
      : businessCurrencyFilter === 'all'
        ? baseCurrency
        : businessCurrencyFilter
    const money = (value) => convertAndFormatCurrency(value, {
      baseCurrency,
      exchangeRates,
      fromCurrency: baseCurrency,
      targetCurrency,
    })
    const metrics = calculateBusinessMetrics({ cashWallet, expenses: filteredExpenses, products, sales: filteredSales, staffMembers })
    const totalPayables = suppliers.reduce((sum, supplier) => sum + Math.max(0, parseNumber(supplier.balance)), 0)
    const totalReceivables = filteredSales.reduce((sum, sale) => {
      const balance = sale.balance !== undefined && sale.balance !== null && sale.balance !== ''
        ? parseNumber(sale.balance)
        : Math.max(0, parseNumber(sale.total) - parseNumber(sale.paidAmount))
      return sum + Math.max(0, balance)
    }, 0)
    return {
      activeProducts: String(products.length),
      currentCashWallet: formatWalletLinesByCurrency({ baseCurrency, cashWallet, entries: cashWalletEntries, exchangeRates, expenses: filteredExpenses, sales: filteredSales, targetCurrency }),
      globalStockValue: money(metrics.stockValue),
      netBalance: money(totalPayables - totalReceivables),
      netProfit: money(metrics.netProfit),
      pendingPayments: money(metrics.pendingPayments),
      pureProfit: money(metrics.pureProfit),
      staffPaid: formatStaffLinesByCurrency(staffMembers, 'paid', { baseCurrency, exchangeRates, targetCurrency }),
      staffPayable: formatStaffLinesByCurrency(staffMembers, 'payable', { baseCurrency, exchangeRates, targetCurrency }),
      stockQuantity: String(metrics.stockQuantity),
      totalCustomers: String(customers.length),
      totalExpenses: money(metrics.expenseTotal),
      totalPayables: money(totalPayables),
      totalReceivables: money(totalReceivables),
      totalRefunds: money(metrics.refundTotal),
      totalRevenue: money(metrics.revenue),
      totalSales: String(filteredSales.length),
      totalStaff: String(staffMembers.length),
    }
  }, [baseCurrency, businessCurrencyFilter, cashWallet, cashWalletEntries, customers, exchangeCurrency, exchangeRates, filteredExpenses, filteredSales, products, staffMembers, suppliers])
  const dateOptions = useMemo(() => dateOptionsFor(t), [t])

  const withValues = (cards) => cards.map((card) => ({
    ...card,
    value: dashboardMetrics?.[card.labelKey] ?? card.value,
  }))
  const openMetric = (metricKey) => onNavigate?.(`dashboardMetric:${metricKey}`)

  return (
    <div
  className="
    content
    dashboard-page
    min-h-screen
    bg-slate-50
    px-3
    py-4
    text-slate-950
    dark:bg-slate-950
    dark:text-white
    sm:px-4
    lg:px-5
  "
>
      <div
  className="
    page-heading
    mb-5
    flex
    flex-col
    gap-3
    lg:flex-row
    lg:items-start
    lg:justify-between
  "
>
        <div>
          <h1
  className="
    text-[22px]
    font-extrabold
    leading-tight
    tracking-[-0.02em]
    text-slate-950
    dark:text-white
    sm:text-2xl
  "
>
  {t.dashboard}
</h1>

<p
  className="
    mt-1
    text-[13px]
    font-normal
    leading-5
    text-slate-500
    dark:text-slate-400
  "
>
  {t.welcome}
</p>
        </div>
        <div className={`heading-actions dashboard-date-actions flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end ${dateFilter === 'custom' ? 'has-custom-range' : ''}`}>
          <div className="dashboard-date-control w-full sm:w-[150px]">
            <CustomSelect
              ariaLabel={t.allTime}
              className="dashboard-filter-select"
              options={dateOptions}
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>
         {dateFilter === 'custom' && (
  <div className="dashboard-custom-date-group">
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
    </div>
  </div>
)}
        </div>
      </div>

      {stockAlertCount > 0 && (
        <button className="dashboard-stock-alert" type="button" onClick={() => onNavigate?.('products')}>
          <span className="dashboard-stock-alert-icon">
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
              <path d="M12 3 2.5 20h19L12 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M12 9v5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              <path d="M12 17h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
          </span>
          <span>{(t.stockAlertSummary ?? '{count} products are running low on stock').replace('{count}', stockAlertCount)}</span>
          <span className="dashboard-stock-alert-link">View Details →</span>
        </button>
      )}

      <div className="dashboard-sections space-y-4">
  <Section
    title={t.financialOverview}
    cards={withValues(financialCards)}
    onCardClick={openMetric}
    variant="financial"
    t={t}
  />

  <Section
    title={t.suppliersOverview}
    cards={withValues(supplierCards)}
    onCardClick={openMetric}
    variant="three"
    t={t}
  />

  <Section
    title={t.stockOverview}
    cards={withValues(stockCards)}
    onCardClick={openMetric}
    variant="three"
    t={t}
  />

  <Section
    title={t.staffOverview}
    cards={withValues(staffCards)}
    onCardClick={openMetric}
    variant="three"
    t={t}
  />
</div>
      <TrendChart data={trendData} t={t} />

      <div className="bottom-grid grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <QuickActions onNavigate={onNavigate} t={t} />
        <RecentActivity t={t} />
      </div>
    </div>
  )
}

export default Dashboard
