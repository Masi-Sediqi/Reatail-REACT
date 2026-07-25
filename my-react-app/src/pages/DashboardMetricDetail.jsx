import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import {
  ChevronLeft,
  DollarSign,
  Printer,
  ReceiptText,
  Search,
  WalletCards,
  X,
} from '../components/Icons.jsx'
import { dateOptionsFor, filterByDate, formatMoney, parseNumber } from '../utils/businessMetrics.js'
import './DashboardMetricDetail.css'

const metricTitles = {
  totalRevenue: { title: 'revenueView', subtitle: 'paidSales', panel: 'revenue' },
  totalSales: { title: 'salesView', subtitle: 'sales', panel: 'sales' },
  totalExpenses: { title: 'expensesView', subtitle: 'expenses', panel: 'expenses' },
  pendingPayments: { title: 'pendingPayments', subtitle: 'remaining', panel: 'pending' },
  totalRefunds: { title: 'refunds', subtitle: 'refunds', panel: 'refunds' },
  totalCustomers: { title: 'customers', subtitle: 'customers', panel: 'customers' },
  totalPayables: { title: 'totalPayables', subtitle: 'suppliers', panel: 'suppliers' },
  totalReceivables: { title: 'totalReceivables', subtitle: 'suppliers', panel: 'suppliers' },
  netBalance: { title: 'netBalance', subtitle: 'suppliers', panel: 'suppliers' },
  activeProducts: { title: 'activeProducts', subtitle: 'products', panel: 'products' },
  stockQuantity: { title: 'stockQuantity', subtitle: 'stock', panel: 'products' },
  globalStockValue: { title: 'globalStockValue', subtitle: 'stock', panel: 'products' },
  totalStaff: { title: 'totalStaff', subtitle: 'staff', panel: 'staff' },
  staffPayable: { title: 'staffPayable', subtitle: 'staff', panel: 'staff' },
  staffPaid: { title: 'staffPaid', subtitle: 'staff', panel: 'staff' },
  currentCashWallet: { title: 'currentCashWallet', subtitle: 'cashWallet', panel: 'wallet' },
  netProfit: { title: 'netProfit', subtitle: 'profit', panel: 'profit' },
  pureProfit: { title: 'pureProfit', subtitle: 'profit', panel: 'profit' },
}

const dateLabel = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).includes('T') ? value : `${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const getSaleCost = (sale, products = []) => (sale.items || []).reduce((sum, item) => {
  const product = products.find((entry) => entry.id === item.productId)
  const cost = parseNumber(item.purchase ?? item.cost ?? product?.purchase ?? 0)
  return sum + cost * parseNumber(item.quantity || 1)
}, 0)

function SummaryCard({ icon: Icon, label, tone = 'blue', value }) {
  return (
    <article className={`detail-summary-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Icon size={22} />
    </article>
  )
}

const normalizeMethod = (value = '') => {
  const method = String(value).toLowerCase()
  if (method.includes('bank')) return 'bank'
  if (method.includes('card') || method.includes('cart')) return 'card'
  if (method.includes('cash')) return 'cash'
  return 'other'
}

function DashboardMetricDetail({ cashWallet, companyInfo, customers = [], expenses = [], metricKey = 'totalRevenue', onBack, onNavigate, printSettings, products = [], sales = [], staffMembers = [], suppliers = [], t }) {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [activeTab, setActiveTab] = useState('sales')
  const [customerStatusFilter, setCustomerStatusFilter] = useState('all')
  const [customerPaymentFilter, setCustomerPaymentFilter] = useState('all')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all')
  const [expenseMethodFilter, setExpenseMethodFilter] = useState('all')
  const [printOpen, setPrintOpen] = useState(false)
  const options = useMemo(() => dateOptionsFor(t), [t])
  const filteredSales = useMemo(() => filterByDate(sales, dateFilter, customRange.start, customRange.end), [customRange.end, customRange.start, dateFilter, sales])
  const filteredExpenses = useMemo(() => filterByDate(expenses, dateFilter, customRange.start, customRange.end), [customRange.end, customRange.start, dateFilter, expenses])
  void cashWallet
  const config = metricTitles[metricKey] ?? metricTitles.totalRevenue
  const title = t[config.title] ?? t[metricKey] ?? t.totalRevenue
  const subtitle = t[config.subtitle] ?? config.subtitle

  const salesRows = filteredSales.map((sale) => ({
    id: sale.id,
    invoice: sale.invoiceNumber,
    customer: sale.customerName || t.walkInCustomer || 'Walk-in Customer',
    total: parseNumber(sale.total),
    totalLabel: formatMoney(sale.total, sale.currency),
    date: sale.date,
    dateLabel: dateLabel(sale.date),
  }))
  const refundRows = filteredSales.flatMap((sale) => (sale.refundHistory || []).map((refund) => ({
    id: refund.id,
    invoice: sale.invoiceNumber,
    customer: sale.customerName || t.walkInCustomer || 'Walk-in Customer',
    total: parseNumber(refund.amount),
    totalLabel: formatMoney(refund.amount, sale.currency),
    date: refund.date || sale.date,
    dateLabel: dateLabel(refund.date || sale.date),
  })))
  const usedExpenseCategories = useMemo(() => [...new Set(expenses.map((expense) => expense.category).filter(Boolean))], [expenses])
  const expenseRows = filteredExpenses.map((expense) => ({
    category: expense.category || '-',
    id: expense.id,
    invoice: expense.description || expense.category,
    customer: expense.category,
    method: expense.method || '',
    methodKey: normalizeMethod(expense.method),
    methodLabel: t.paymentMethods?.[expense.method] ?? expense.method ?? '-',
    notes: expense.notes || expense.description || '-',
    total: parseNumber(expense.amount),
    totalLabel: formatMoney(expense.amount, expense.currency),
    date: expense.date,
    dateLabel: dateLabel(expense.date),
  }))
  const productRows = products.map((product) => ({
    id: product.id,
    invoice: product.name || product.code,
    customer: product.category,
    total: parseNumber(product.quantity) * parseNumber(product.purchase),
    totalLabel: formatMoney(parseNumber(product.quantity) * parseNumber(product.purchase), product.currency),
    date: product.createdAt || '',
    dateLabel: dateLabel(product.createdAt),
  }))
  const supplierRows = suppliers.map((supplier) => ({
    id: supplier.id,
    invoice: supplier.name,
    customer: supplier.phone || '-',
    total: parseNumber(supplier.balance),
    totalLabel: formatMoney(supplier.balance, supplier.currency),
    date: supplier.createdAt || '',
    dateLabel: dateLabel(supplier.createdAt),
  }))
  const customerRows = customers.map((customer) => {
    const customerSales = sales.filter((sale) => (
      (customer.id && sale.customerId === customer.id)
      || sale.customerName?.toLowerCase() === customer.name?.toLowerCase()
    ))
    const hasSales = customerSales.length > 0
    const purchases = hasSales ? customerSales.reduce((sum, sale) => sum + parseNumber(sale.total), 0) : parseNumber(customer.purchases)
    const pending = hasSales ? customerSales.reduce((sum, sale) => sum + parseNumber(sale.balance), 0) : parseNumber(customer.pending)
    const latestDate = customer.createdAt?.slice(0, 10) || customerSales[0]?.date || ''
    const status = String(customer.status || 'Active').toLowerCase()
    return {
      customer: customer.phone || customer.email || '-',
      date: latestDate,
      dateLabel: dateLabel(latestDate),
      email: customer.email || '',
      id: customer.id,
      invoice: customer.name,
      paymentState: pending > 0 ? 'loan' : 'paid',
      pending,
      phone: customer.phone || '-',
      status,
      statusLabel: status === 'inactive' ? (t.inactive ?? 'Inactive') : t.active,
      total: purchases,
      totalLabel: formatMoney(purchases),
      vip: Boolean(customer.vip),
    }
  })
  const staffRows = staffMembers.map((staff) => ({
    id: staff.id,
    invoice: staff.name,
    customer: staff.role || '-',
    total: parseNumber(staff.salary),
    totalLabel: formatMoney(staff.salary),
    date: staff.createdAt || '',
    dateLabel: dateLabel(staff.createdAt),
  }))

  const tabs = [
    { key: 'sales', label: `${t.sales} (${salesRows.length})`, rows: salesRows },
    { key: 'refunds', label: `${t.refunds ?? 'Refunds'} (${refundRows.length})`, rows: refundRows },
    { key: 'withdrawals', label: `${t.withdrawals ?? 'Withdrawals'} (0)`, rows: [] },
    { key: 'deposits', label: `${t.deposits ?? 'Deposits'} (0)`, rows: [] },
  ]
  const panelRows = config.panel === 'expenses'
    ? expenseRows
    : config.panel === 'products'
      ? productRows
      : config.panel === 'suppliers'
        ? supplierRows
        : config.panel === 'customers'
          ? customerRows
          : config.panel === 'staff'
            ? staffRows
            : tabs.find((tab) => tab.key === activeTab)?.rows ?? salesRows

  const query = search.trim().toLowerCase()
  const rows = panelRows.filter((row) => !query || `${row.invoice} ${row.customer} ${row.totalLabel} ${row.dateLabel}`.toLowerCase().includes(query))
  const totalValue = rows.reduce((sum, row) => sum + parseNumber(row.total), 0)
  const average = rows.length ? formatMoney(totalValue / rows.length) : '—'
  const printRows = rows.map((row, index) => ({ ...row, number: index + 1 }))
  const printColumns = [
    { key: 'number', label: '#' },
    { key: 'invoice', label: t.invoice ?? 'Invoice' },
    { key: 'customer', label: t.customer ?? 'Customer' },
    { key: 'totalLabel', label: t.total ?? 'Total' },
    { key: 'dateLabel', label: t.date ?? 'Date' },
  ]
  const isRevenueView = config.panel === 'revenue'
  const resetDateFilter = () => {
    setDateFilter('all')
    setCustomRange({ start: '', end: '' })
  }

  if (config.panel === 'customers') {
    const customerStatusOptions = [
      { value: 'all', label: t.allStatuses ?? 'All Statuses' },
      { value: 'active', label: t.active ?? 'Active' },
      { value: 'inactive', label: t.inactive ?? 'Inactive' },
    ]
    const customerPaymentOptions = [
      { value: 'all', label: t.allPayments ?? 'Paid / Loan' },
      { value: 'paid', label: t.paid ?? 'Paid' },
      { value: 'loan', label: t.loan ?? 'Loan' },
    ]
    const customerQuery = search.trim().toLowerCase()
    const visibleCustomers = customerRows.filter((customer) => {
      const matchesSearch = !customerQuery || `${customer.invoice} ${customer.phone} ${customer.email} ${customer.totalLabel}`.toLowerCase().includes(customerQuery)
      const matchesStatus = customerStatusFilter === 'all' || customer.status === customerStatusFilter
      const matchesPayment = customerPaymentFilter === 'all' || customer.paymentState === customerPaymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
    const customerPrintRows = visibleCustomers.map((customer, index) => ({ ...customer, number: index + 1 }))

    return (
  <section
    className={`entity-content metric-detail-content ${
      config.panel === 'revenue' ? 'revenue-view-page' : ''
    }`}
  >
        <div className="entity-heading metric-detail-heading">
          <div className="metric-detail-title">
            <button className="back-icon-btn" type="button" onClick={onBack}><ChevronLeft size={18} /></button>
            <div><h1>{t.customersView ?? 'Customers View'}</h1><p>{t.allCustomers ?? 'All customers'}</p></div>
          </div>
          <div className="entity-actions"><button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.printReport}</button></div>
        </div>

        <div className="summary-grid three metric-detail-summary">
  <SummaryCard
    icon={DollarSign}
    label={t.revenue ?? 'Revenue'}
    tone="green"
    value={formatMoney(totalValue)}
  />

  <SummaryCard
    icon={DollarSign}
    label={t.records ?? 'Records'}
    tone="blue"
    value={rows.length}
  />

  <SummaryCard
    icon={DollarSign}
    label={t.average ?? 'Average'}
    tone="navy"
    value={average}
  />
</div>

        <div
  className={`filter-card metric-detail-filter customer-view-filter ${
    dateFilter === 'custom' ? 'has-custom-range' : ''
  }`}
>
  <div className="search-field">
    <Search size={17} />

    <input
      placeholder={t.searchPlaceholder ?? 'Search...'}
      value={search}
      onChange={(event) => setSearch(event.target.value)}
    />
  </div>

  <CustomSelect
    ariaLabel={t.allTime}
    options={options}
    value={dateFilter}
    onChange={(value) => {
      setDateFilter(value)

      if (value !== 'custom') {
        setCustomRange({
          start: '',
          end: '',
        })
      }
    }}
  />

  {dateFilter === 'custom' && (
    <>
      <DateRangePicker
        className="metric-detail-date-range"
        end={customRange.end}
        onChange={setCustomRange}
        start={customRange.start}
        t={t}
      />

      <button
        className="metric-filter-reset"
        type="button"
        aria-label={t.resetFilter ?? 'Reset filter'}
        title={t.resetFilter ?? 'Reset filter'}
        onClick={() => {
          setDateFilter('all')
          setCustomRange({
            start: '',
            end: '',
          })
        }}
      >
        <X size={16} />
      </button>
    </>
  )}
</div>

        <div className="data-panel metric-detail-panel">
          <h2><WalletCards size={20} /> {t.customers ?? 'Customers'} ({visibleCustomers.length})</h2>
         {rows.length === 0 ? (
  <div className="revenue-empty-state">
    <DollarSign size={46} />

    <strong>
      {activeTab === 'sales'
        ? (t.noPaidSalesInRange ??
          'No paid sales in this range.')
        : activeTab === 'refunds'
          ? (t.noRefundsInRange ??
            'No refunds in this range.')
          : (t.noCashWalletTransactionsInRange ??
            'No cash wallet transactions in this range.')}
    </strong>
  </div>
) : (
  <div className="metric-detail-table-wrap">
    <table className="data-table metric-detail-table">
      <thead>
        <tr>
          <th>{t.invoice ?? 'Invoice'}</th>
          <th>{t.customer ?? 'Customer'}</th>
          <th>{t.total ?? 'Total'}</th>
          <th>{t.date ?? 'Date'}</th>
          <th>{t.actions}</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <strong>{row.invoice}</strong>
            </td>

            <td>{row.customer}</td>

            <td
              className={
                row.total >= 0
                  ? 'success-text'
                  : 'danger-text'
              }
            >
              {row.totalLabel}
            </td>

            <td>{row.dateLabel}</td>
            <td>...</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
        </div>

        {printOpen && <PrintPreviewModal columns={[{ key: 'invoice', label: t.name ?? 'Name' }, { key: 'phone', label: t.phone ?? 'Phone' }, { key: 'totalLabel', label: t.total ?? 'Total' }, { key: 'statusLabel', label: t.status ?? 'Status' }]} companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={customerPrintRows} title={t.customersView ?? 'Customers View'} t={t} />}
      </section>
    )
  }

  if (config.panel === 'expenses') {
    const expenseCategoryOptions = [
      { value: 'all', label: t.allCategories ?? 'All Categories' },
      ...usedExpenseCategories.map((category) => ({ value: category, label: t.expenseCategories?.[category] ?? category })),
    ]
    const expenseMethodOptions = [
      { value: 'all', label: t.allMethods ?? 'All Methods' },
      { value: 'bank', label: t.bank ?? 'Bank' },
      { value: 'card', label: t.cardTransfer ?? 'Card Transfer' },
      { value: 'cash', label: t.cash ?? 'Cash' },
      { value: 'other', label: t.other ?? 'Other' },
    ]
    const expenseQuery = search.trim().toLowerCase()
    const visibleExpenses = expenseRows.filter((expense) => {
      const matchesSearch = !expenseQuery || `${expense.invoice} ${expense.category} ${expense.notes} ${expense.methodLabel}`.toLowerCase().includes(expenseQuery)
      const matchesCategory = expenseCategoryFilter === 'all' || expense.category === expenseCategoryFilter
      const matchesMethod = expenseMethodFilter === 'all' || expense.methodKey === expenseMethodFilter
      return matchesSearch && matchesCategory && matchesMethod
    })
    const expenseTotal = visibleExpenses.reduce((sum, expense) => sum + expense.total, 0)
    const monthlyExpenseTotal = visibleExpenses.filter((expense) => {
      const date = new Date(String(expense.date || '').includes('T') ? expense.date : `${expense.date}T12:00:00`)
      const now = new Date()
      return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).reduce((sum, expense) => sum + expense.total, 0)
    const expensePrintRows = visibleExpenses.map((expense, index) => ({ ...expense, number: index + 1 }))

    return (
      <section className="entity-content metric-detail-content">
        <div className="entity-heading metric-detail-heading">
          <div className="metric-detail-title">
            <button className="back-icon-btn" type="button" onClick={onBack}><ChevronLeft size={18} /></button>
            <div><h1>{t.expensesView ?? 'Expenses View'}</h1><p>{t.allExpenses ?? 'All expenses'}</p></div>
          </div>
          <div className="entity-actions">
  <button
    className="revenue-print-btn"
    type="button"
    onClick={() => setPrintOpen(true)}
  >
    <ReceiptText size={16} />
    <span>{t.printReport ?? 'Print Report'}</span>
  </button>
</div>
        </div>

        <div className="summary-grid three metric-detail-summary">
          <SummaryCard icon={WalletCards} label={t.totalExpenses ?? 'Total Expenses'} tone="red" value={formatMoney(expenseTotal)} />
          <SummaryCard icon={DollarSign} label={t.monthly ?? 'Monthly'} tone="orange" value={formatMoney(monthlyExpenseTotal)} />
          <SummaryCard icon={WalletCards} label={t.records ?? 'Records'} value={visibleExpenses.length} />
        </div>

        <div className="filter-card metric-detail-filter expenses-view-filter">
          <div className="search-field"><Search size={17} /><input placeholder={t.searchPlaceholder ?? 'Search...'} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <CustomSelect
            ariaLabel={t.allTime}
            options={options}
            value={dateFilter}
            onChange={(value) => {
              setDateFilter(value)
              if (value !== 'custom') setCustomRange({ start: '', end: '' })
            }}
          />
          {dateFilter === 'custom' && (
            <>
              <DateRangePicker className="metric-detail-date-range" end={customRange.end} onChange={setCustomRange} start={customRange.start} t={t} />
              <button className="metric-filter-reset" type="button" aria-label={t.resetFilter ?? 'Reset filter'} title={t.resetFilter ?? 'Reset filter'} onClick={resetDateFilter}><X size={16} /></button>
            </>
          )}
          <CustomSelect ariaLabel={t.category ?? 'Category'} options={expenseCategoryOptions} value={expenseCategoryFilter} onChange={setExpenseCategoryFilter} />
          <CustomSelect ariaLabel={t.paymentMethod ?? 'Payment Method'} options={expenseMethodOptions} value={expenseMethodFilter} onChange={setExpenseMethodFilter} />
        </div>

        <div className="data-panel metric-detail-panel">
          <h2><WalletCards size={20} /> {t.expenses ?? 'Expenses'} ({visibleExpenses.length})</h2>
          <div className="metric-detail-table-wrap">
            <table className="data-table metric-detail-table expenses-view-table">
              <thead><tr><th>{t.category ?? 'Category'}</th><th>{t.notes ?? 'Notes'}</th><th>{t.amount ?? 'Amount'}</th><th>{t.paymentMethod ?? 'Payment Method'}</th><th>{t.date ?? 'Date'}</th><th>{t.actions ?? 'Actions'}</th></tr></thead>
              <tbody>
                {visibleExpenses.length === 0 ? <tr><td className="empty-cell" colSpan="6">{t.noRecordsFound}</td></tr> : visibleExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td><span className="soft-pill">{t.expenseCategories?.[expense.category] ?? expense.category}</span></td>
                    <td>{expense.notes}</td>
                    <td className="danger-text">{expense.totalLabel}</td>
                    <td><span className="soft-pill">{expense.methodLabel}</span></td>
                    <td>{expense.dateLabel}</td>
                    <td>...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {printOpen && <PrintPreviewModal columns={[{ key: 'category', label: t.category ?? 'Category' }, { key: 'notes', label: t.notes ?? 'Notes' }, { key: 'totalLabel', label: t.amount ?? 'Amount' }, { key: 'methodLabel', label: t.paymentMethod ?? 'Payment Method' }, { key: 'dateLabel', label: t.date ?? 'Date' }]} companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={expensePrintRows} title={t.expensesView ?? 'Expenses View'} t={t} />}
      </section>
    )
  }

  if (metricKey === 'netProfit' || metricKey === 'pureProfit') {
    const revenue = filteredSales.reduce((sum, sale) => sum + parseNumber(sale.total), 0)
    const cogs = filteredSales.reduce((sum, sale) => sum + getSaleCost(sale, products), 0)
    const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + parseNumber(expense.amount), 0)
    const refundTotal = filteredSales.reduce((sum, sale) => sum + (sale.refundHistory || []).reduce((refundSum, refund) => refundSum + parseNumber(refund.amount), 0), 0)
    const pendingPayments = filteredSales.reduce((sum, sale) => sum + Math.max(0, parseNumber(sale.balance)), 0)
    const grossProfit = revenue - cogs
    const netProfit = grossProfit - expenseTotal - refundTotal - pendingPayments
    const unrealizedStockProfit = products.reduce((sum, product) => sum + Math.max(0, parseNumber(product.sell || product.price || product.salePrice) - parseNumber(product.purchase)) * parseNumber(product.quantity), 0)
    const netRows = filteredSales.map((sale) => {
      const cost = getSaleCost(sale, products)
      const refunded = (sale.refundHistory || []).reduce((sum, refund) => sum + parseNumber(refund.amount), 0)
      return {
        cogs: formatMoney(cost, sale.currency),
        customer: sale.customerName || t.walkInCustomer || 'Walk-in Customer',
        date: dateLabel(sale.date),
        gross: formatMoney(sale.total, sale.currency),
        grossProfit: formatMoney(parseNumber(sale.total) - cost - refunded, sale.currency),
        id: sale.id,
        invoice: sale.invoiceNumber,
        net: formatMoney(parseNumber(sale.total) - refunded, sale.currency),
        refunded: refunded ? formatMoney(refunded, sale.currency) : '-',
      }
    })
    const cogsRows = filteredSales.flatMap((sale) => (sale.items || []).map((item, index) => {
      const product = products.find((entry) => entry.id === item.productId)
      const cost = parseNumber(item.purchase ?? item.cost ?? product?.purchase ?? 0)
      return {
        amount: formatMoney(cost * parseNumber(item.quantity || 1), sale.currency),
        date: dateLabel(sale.date),
        id: `${sale.id}-cogs-${item.productId || index}`,
        invoice: sale.invoiceNumber,
        name: item.name || product?.name || '-',
        quantity: item.quantity || 1,
      }
    }))
    const expenseSourceRows = filteredExpenses.map((expense) => ({
      amount: formatMoney(expense.amount, expense.currency),
      category: expense.category || expense.type || '-',
      date: dateLabel(expense.date || expense.createdAt),
      id: expense.id,
      name: expense.description || expense.category || '-',
    }))
    const sourceTabs = [
      { key: 'sales', label: `${t.sales ?? 'Sales'} (${netRows.length})`, rows: netRows },
      { key: 'cogs', label: `${t.cogsBreakdown ?? 'COGS breakdown'} (${cogsRows.length})`, rows: cogsRows },
      { key: 'expenses', label: `${t.expenses ?? 'Expenses'} (${expenseSourceRows.length})`, rows: expenseSourceRows },
      { key: 'deposits', label: `${t.deposits ?? 'Deposits'} (0)`, rows: [] },
      { key: 'withdrawals', label: `${t.withdrawals ?? 'Withdrawals'} (0)`, rows: [] },
    ]
    const activeSource = sourceTabs.find((tab) => tab.key === activeTab) ?? sourceTabs[0]
    const netQuery = search.trim().toLowerCase()
    const sourceRows = activeSource.rows.filter((row) => !netQuery || Object.values(row).join(' ').toLowerCase().includes(netQuery))
    const breakdownRows = [
      { id: 'revenue', name: t.revenuePaidSales ?? 'Revenue (Paid Sales)', amount: `+${formatMoney(revenue)}` },
      { id: 'cogs', name: t.costOfGoodsSoldFormula ?? 'Cost of Goods Sold (Purchase Price × Qty Sold)', amount: `-${formatMoney(cogs)}` },
      { id: 'gross', name: `= ${t.grossProfit ?? 'Gross Profit'}`, amount: formatMoney(grossProfit), strong: true },
      { id: 'expenses', name: t.allExpensesFormula ?? 'All Expenses (Rent, Utilities, Salaries, etc.)', amount: `-${formatMoney(expenseTotal)}` },
      ...(refundTotal ? [{ id: 'refunds', name: t.refunds ?? 'Refunds', amount: `-${formatMoney(refundTotal)}` }] : []),
      ...(pendingPayments ? [{ id: 'pending', name: t.pendingPayments ?? 'Pending Payments', amount: `-${formatMoney(pendingPayments)}` }] : []),
      { id: 'net', name: `= ${t.netProfitPure ?? 'Net Profit (Pure Profit)'}`, amount: formatMoney(netProfit), success: true },
      { id: 'stock', name: t.unrealizedStockProfit ?? 'Unrealized Stock Profit (if all stock sold at selling price)', amount: formatMoney(unrealizedStockProfit), muted: true },
    ]
    const netPrintRows = breakdownRows.map((row, index) => ({ ...row, number: index + 1 }))

    return (
      <section className="entity-content metric-detail-content net-profit-detail">
        <div className="entity-heading metric-detail-heading">
          <div className="metric-detail-title">
            <button className="back-icon-btn" type="button" onClick={onBack}><ChevronLeft size={18} /></button>
            <div><h1>{t.netProfit ?? 'Net Profit'}</h1><p>{t.netProfitSubtitle ?? 'Pure profit after all costs and expenses'}</p></div>
          </div>
          <div className="entity-actions"><button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.print ?? 'Print'}</button></div>
        </div>

        <div className="summary-grid three metric-detail-summary">
          <SummaryCard icon={DollarSign} label={t.revenue ?? 'Revenue'} tone="green" value={formatMoney(revenue)} />
          <SummaryCard icon={WalletCards} label={t.totalCosts ?? 'Total Costs'} tone="red" value={formatMoney(cogs + expenseTotal + refundTotal)} />
          <SummaryCard icon={DollarSign} label={t.netProfit ?? 'Net Profit'} tone="green" value={formatMoney(netProfit)} />
        </div>

        <div className="data-panel net-profit-breakdown">
          <h2>{t.howNetProfitCalculated ?? 'How Net Profit is Calculated'}</h2>
          <div className="net-profit-rows">
            {breakdownRows.map((row) => (
              <div className={`${row.strong ? 'strong' : ''} ${row.success ? 'success' : ''} ${row.muted ? 'muted' : ''}`} key={row.id}>
                <span>{row.name}</span>
                <strong>{row.amount}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="data-panel net-profit-source">
          <h2>{t.sourceRecords ?? 'Source records'}</h2>
          <div className="metric-detail-tabs net-source-tabs">
            {sourceTabs.map((tab) => <button className={activeSource.key === tab.key ? 'active' : ''} key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
          </div>
          <div className="net-profit-search"><input placeholder={t.search ?? 'Search'} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="metric-detail-table-wrap">
            {activeSource.key === 'sales' ? (
              <table className="data-table metric-detail-table net-source-table">
                <thead><tr><th>{t.invoice ?? 'Invoice'}</th><th>{t.customer ?? 'Customer'}</th><th>{t.gross ?? 'Gross'}</th><th>{t.refunded ?? 'Refunded'}</th><th>{t.net ?? 'Net'}</th><th>COGS</th><th>{t.grossProfit ?? 'Gross Profit'}</th><th>{t.date ?? 'Date'}</th></tr></thead>
                <tbody>{sourceRows.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noRecordsFound}</td></tr> : sourceRows.map((row) => <tr key={row.id}><td><strong>{row.invoice}</strong></td><td>{row.customer}</td><td>{row.gross}</td><td className="danger-text">{row.refunded}</td><td><strong>{row.net}</strong></td><td>{row.cogs}</td><td className="success-text">{row.grossProfit}</td><td>{row.date}</td></tr>)}</tbody>
              </table>
            ) : (
              <table className="data-table metric-detail-table net-source-table">
                <thead><tr><th>{activeSource.key === 'cogs' ? (t.item ?? 'Item') : (t.name ?? 'Name')}</th><th>{t.invoice ?? 'Invoice'}</th><th>{t.category ?? 'Category'}</th><th>{t.quantity ?? 'Quantity'}</th><th>{t.amount ?? 'Amount'}</th><th>{t.date ?? 'Date'}</th></tr></thead>
                <tbody>{sourceRows.length === 0 ? <tr><td className="empty-cell" colSpan="6">{t.noRecordsFound}</td></tr> : sourceRows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.invoice || '-'}</td><td>{row.category || '-'}</td><td>{row.quantity || '-'}</td><td className={activeSource.key === 'expenses' ? 'danger-text' : ''}>{row.amount}</td><td>{row.date}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        </div>

        {printOpen && <PrintPreviewModal columns={[{ key: 'name', label: t.name ?? 'Name' }, { key: 'amount', label: t.amount ?? 'Amount' }]} companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={netPrintRows} title={t.netProfitBreakdown ?? 'Net Profit Breakdown'} t={t} />}
      </section>
    )
  }

  return (
    <section className={`entity-content metric-detail-content ${isRevenueView ? 'revenue-view-page' : ''}`.trim()}>
      <div className="entity-heading metric-detail-heading">
        <div className="metric-detail-title">
          <button className="back-icon-btn" type="button" onClick={onBack}><ChevronLeft size={18} /></button>
          <div><h1>{title}</h1><p>{subtitle}</p></div>
        </div>
        <div className="entity-actions">
          <button className={isRevenueView ? 'revenue-print-btn' : ''} type="button" onClick={() => setPrintOpen(true)}>
            {isRevenueView ? <Printer size={16} /> : <ReceiptText size={16} />}
            <span>{t.printReport ?? 'Print Report'}</span>
          </button>
        </div>
      </div>

      <div className="summary-grid three metric-detail-summary">
        <SummaryCard icon={DollarSign} label={isRevenueView ? (t.revenue ?? 'Revenue') : title} tone={isRevenueView ? 'green' : 'red'} value={formatMoney(totalValue)} />
        <SummaryCard icon={DollarSign} label={t.records ?? 'Records'} tone="blue" value={rows.length} />
        <SummaryCard icon={DollarSign} label={t.average ?? 'Average'} tone="navy" value={average} />
      </div>

      <div className={`filter-card metric-detail-filter ${isRevenueView ? 'revenue-view-filter' : ''} ${dateFilter === 'custom' ? 'has-custom-range' : ''}`.trim()}>
        <div className="search-field"><Search size={17} /><input placeholder={t.searchPlaceholder ?? 'Search...'} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <CustomSelect
          ariaLabel={t.allTime}
          options={options}
          value={dateFilter}
          onChange={(value) => {
            setDateFilter(value)
            if (value !== 'custom') setCustomRange({ start: '', end: '' })
          }}
        />
        {dateFilter === 'custom' && <DateRangePicker className="metric-detail-date-range" end={customRange.end} onChange={setCustomRange} start={customRange.start} t={t} />}
        {dateFilter === 'custom' && (
          <button
            className={isRevenueView ? 'revenue-filter-reset' : 'metric-filter-reset'}
            type="button"
            aria-label={t.resetFilter ?? 'Reset filter'}
            title={t.resetFilter ?? 'Reset filter'}
            onClick={resetDateFilter}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="data-panel metric-detail-panel">
        <h2><DollarSign size={20} /> {title}</h2>
        {config.panel === 'revenue' && (
          <div className="metric-detail-tabs">
            {tabs.map((tab) => <button className={activeTab === tab.key ? 'active' : ''} key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
          </div>
        )}
        {isRevenueView && rows.length === 0 ? (
          <div className="revenue-empty-state">
            <DollarSign size={46} />
            <strong>{t.noResultsFound ?? 'No results found'}</strong>
          </div>
        ) : (
          <div className="metric-detail-table-wrap">
          <table className="data-table metric-detail-table">
            <thead><tr><th>{t.invoice ?? 'Invoice'}</th><th>{t.customer ?? 'Customer'}</th><th>{t.total ?? 'Total'}</th><th>{t.date ?? 'Date'}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td className="empty-cell" colSpan="5">{t.noRecordsFound}</td></tr> : rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.invoice}</strong></td>
                  <td>{row.customer}</td>
                  <td className={row.total >= 0 ? 'success-text' : 'danger-text'}>{row.totalLabel}</td>
                  <td>{row.dateLabel}</td>
                  <td>...</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {printOpen && <PrintPreviewModal columns={printColumns} companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printRows} title={`${title} ${t.printReport}`} t={t} />}
    </section>
  )
}

export default DashboardMetricDetail
