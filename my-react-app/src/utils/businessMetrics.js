import { formatBusinessCurrencyAmount } from './currencyExchange.js'

export const parseNumber = (value) => Number.parseFloat(value || 0) || 0

export const formatMoney = (value, currency = 'AFN') => {
  return formatBusinessCurrencyAmount(value, currency)
}

export const dateOptionsFor = (t) => [
  { value: 'all', label: t.allTime ?? 'All Time' },
  { value: 'today', label: t.today ?? 'Today' },
  { value: 'weekly', label: t.weekly ?? 'Weekly' },
  { value: 'monthly', label: t.monthly ?? 'Monthly' },
  { value: 'annual', label: t.annual ?? 'Annual' },
  { value: 'custom', label: t.custom ?? 'Custom' },
]

export const parseDate = (value) => {
  if (!value) return null
  const normalized = String(value).includes('T') ? value : `${value}T12:00:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export const matchesDateFilter = (dateValue, filter, customStartDate = '', customEndDate = '') => {
  if (filter === 'all') return true
  const date = parseDate(dateValue)
  if (!date) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)
  const daysOld = Math.floor((today - dateOnly) / 86400000)
  const rangeStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
  const rangeEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
  return (filter === 'today' && daysOld === 0)
    || (filter === 'weekly' && daysOld >= 0 && daysOld <= 7)
    || (filter === 'monthly' && daysOld >= 0 && daysOld <= 31)
    || (filter === 'annual' && daysOld >= 0 && daysOld <= 366)
    || (filter === 'custom' && (!rangeStart || date >= rangeStart) && (!rangeEnd || date <= rangeEnd))
}

export const filterByDate = (items, filter, customStartDate, customEndDate, dateKey = 'date') => (
  items.filter((item) => matchesDateFilter(item[dateKey] || item.createdAt, filter, customStartDate, customEndDate))
)

export const getExpenseCategory = (expense) => expense.category || expense.type || expense.name || 'Miscellaneous'

export const calculateBusinessMetrics = ({
  expenses = [],
  products = [],
  sales = [],
  staffMembers = [],
  cashWallet = 0,
  currency = 'AFN',
} = {}) => {
  const revenue = sales.reduce((sum, sale) => sum + parseNumber(sale.total), 0)
  const paidRevenue = sales.reduce((sum, sale) => sum + parseNumber(sale.paidAmount), 0)
  const pendingPayments = sales.reduce((sum, sale) => sum + Math.max(0, parseNumber(sale.balance)), 0)
  const expenseTotal = expenses.reduce((sum, expense) => sum + parseNumber(expense.amount), 0)
  const refundTotal = sales.reduce((sum, sale) => sum + (sale.refundHistory || []).reduce((refundSum, refund) => refundSum + parseNumber(refund.amount), 0), 0)
  const discountTotal = sales.reduce((sum, sale) => sum + parseNumber(sale.discountTotal), 0)
  const stockValue = products.reduce((sum, product) => sum + parseNumber(product.quantity) * parseNumber(product.purchase), 0)
  const stockQuantity = products.reduce((sum, product) => sum + parseNumber(product.quantity), 0)
  const staffPayroll = staffMembers.reduce((sum, staff) => sum + parseNumber(staff.salary), 0)
  const staffPaid = expenses
    .filter((expense) => ['salary', 'payroll', 'staff'].some((word) => getExpenseCategory(expense).toLowerCase().includes(word)))
    .reduce((sum, expense) => sum + parseNumber(expense.amount), 0)
  const grossProfit = Math.max(0, revenue - discountTotal)
  const netProfit = revenue - expenseTotal - refundTotal
  const pureProfit = revenue - expenseTotal - refundTotal - pendingPayments

  return {
    activeProducts: String(products.length),
    cashWallet,
    currentCashWallet: formatMoney(cashWallet, currency),
    discountTotal,
    expenseTotal,
    globalStockValue: formatMoney(stockValue, currency),
    grossProfit,
    netProfit,
    netProfitValue: netProfit,
    paidRevenue,
    pendingPayments,
    pureProfit,
    revenue,
    refundTotal,
    staffPaid,
    staffPayable: Math.max(0, staffPayroll - staffPaid),
    stockQuantity,
    stockValue,
    totalCustomers: String(new Set(sales.map((sale) => sale.customerId || sale.customerName).filter(Boolean)).size),
    totalDiscounts: formatMoney(discountTotal, currency),
    totalExpenses: formatMoney(expenseTotal, currency),
    totalRefunds: formatMoney(refundTotal, currency),
    totalRevenue: formatMoney(revenue, currency),
    totalSales: String(sales.length),
    totalStaff: String(staffMembers.length),
    formatted: {
      discountTotal: formatMoney(discountTotal, currency),
      expenseTotal: formatMoney(expenseTotal, currency),
      grossProfit: formatMoney(grossProfit, currency),
      netProfit: formatMoney(netProfit, currency),
      paidRevenue: formatMoney(paidRevenue, currency),
      pendingPayments: formatMoney(pendingPayments, currency),
      pureProfit: formatMoney(pureProfit, currency),
      revenue: formatMoney(revenue, currency),
      staffPaid: formatMoney(staffPaid, currency),
      staffPayable: formatMoney(Math.max(0, staffPayroll - staffPaid), currency),
      stockValue: formatMoney(stockValue, currency),
    },
  }
}

export const getExpenseBreakdown = (expenses = []) => {
  const totals = new Map()
  expenses.forEach((expense) => {
    const category = getExpenseCategory(expense)
    totals.set(category, (totals.get(category) || 0) + parseNumber(expense.amount))
  })
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export const getTopCustomers = (sales = [], currency = 'AFN') => {
  const totals = new Map()
  sales.forEach((sale) => {
    const name = sale.customerName || 'Walk-in Customer'
    totals.set(name, (totals.get(name) || 0) + parseNumber(sale.total))
  })
  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount, label: formatMoney(amount, currency) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
}
