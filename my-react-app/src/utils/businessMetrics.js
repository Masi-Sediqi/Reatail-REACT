import { formatBusinessCurrencyAmount } from './currencyExchange.js'

export const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const payrollPeriodKey = (entry) => `${entry.start || ''}__${entry.end || ''}`
const getPayrollPaidTotal = (staffMembers = []) => staffMembers.reduce((sum, staff) => (
  sum + (staff.payrollHistory || []).reduce((historySum, entry) => historySum + parseNumber(entry.paidAmount), 0)
), 0)
const getPayrollPayableTotal = (staffMembers = []) => staffMembers.reduce((sum, staff) => {
  const latestPayableByPeriod = new Map()
  ;(staff.payrollHistory || []).forEach((entry) => {
    latestPayableByPeriod.set(payrollPeriodKey(entry), parseNumber(entry.payable))
  })
  const historyPayable = [...latestPayableByPeriod.values()].reduce((total, amount) => total + amount, 0)
  return sum + historyPayable
}, 0)

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
  const productPurchaseById = new Map(products.map((product) => [product.id, parseNumber(product.purchase)]))
  const productProfit = sales.reduce((saleSum, sale) => {
    const paidAmount = parseNumber(sale.paidAmount)
    const total = parseNumber(sale.total)
    const paidRatio = total > 0 ? Math.min(1, paidAmount / total) : 1
    const saleProfit = (sale.items || []).reduce((itemSum, item) => {
      const quantity = parseNumber(item.quantity)
      const lineTotal = parseNumber(item.lineTotal || (parseNumber(item.price) * quantity))
      const purchase = parseNumber(item.purchase ?? productPurchaseById.get(item.productId))
      return itemSum + Math.max(0, lineTotal - purchase * quantity)
    }, 0)
    return saleSum + saleProfit * paidRatio
  }, 0)
  const stockValue = products.reduce((sum, product) => sum + parseNumber(product.quantity) * parseNumber(product.purchase), 0)
  const stockQuantity = products.reduce((sum, product) => sum + parseNumber(product.quantity), 0)
  const staffPaid = getPayrollPaidTotal(staffMembers)
  const staffPayable = getPayrollPayableTotal(staffMembers)
  const grossProfit = productProfit
  const netProfit = productProfit - expenseTotal - staffPaid - refundTotal
  const pureProfit = Math.max(0, productProfit - refundTotal)
  const cashWalletValue = cashWallet + paidRevenue - expenseTotal

  return {
    activeProducts: String(products.length),
    cashWallet: cashWalletValue,
    currentCashWallet: formatMoney(cashWalletValue, currency),
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
    staffPayable,
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
      staffPayable: formatMoney(staffPayable, currency),
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
