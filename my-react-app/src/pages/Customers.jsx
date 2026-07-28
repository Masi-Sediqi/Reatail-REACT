import { useEffect, useMemo, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import CustomFieldInputs from '../components/CustomFieldInputs.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  CreditCard,
  DollarSign,
  Eye,
  History,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  SquareMenu,
  Trash2,
  Users,
  WalletCards,
  X,
} from '../components/Icons.jsx'
import { formatBusinessCurrencyAmount } from '../utils/currencyExchange.js'
import './Customers.css'

const emptyCustomer = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  vip: false,
  purchases: '0.00',
  pending: '0.00',
  status: 'Active',
  customFields: {},
}

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const parseDateInput = (value) => (value ? new Date(`${value}T12:00:00`) : null)
const formatMoney = (value, currency = 'AFN') => formatBusinessCurrencyAmount(value, currency)
const getDateLabel = (value) => {
  const date = parseDateInput(value)
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
}

const getSaleCost = (sale, products = []) => sale.items.reduce((sum, item) => {
  const product = products.find((current) => current.id === item.productId)
  const cost = parseNumber(item.purchase ?? item.cost ?? product?.purchase ?? 0)
  return sum + cost * parseNumber(item.quantity)
}, 0)

const getCustomerSales = (customer, sales = []) => sales.filter((sale) => (
  (customer.id && sale.customerId === customer.id)
  || (!sale.customerId && sale.customerName?.toLowerCase() === customer.name?.toLowerCase())
  || sale.customerName?.toLowerCase() === customer.name?.toLowerCase()
))

const getDateMatches = (dateValue, filter, customStartDate, customEndDate) => {
  const date = parseDateInput(dateValue)
  if (!date) return true
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const daysOld = Math.floor((now - new Date(date.toDateString())) / 86400000)
  const rangeStart = parseDateInput(customStartDate)
  const rangeEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
  return filter === 'all'
    || (filter === 'today' && daysOld === 0)
    || (filter === 'weekly' && daysOld <= 7)
    || (filter === 'monthly' && daysOld <= 31)
    || (filter === 'annual' && daysOld <= 366)
    || (filter === 'custom' && (!rangeStart || date >= rangeStart) && (!rangeEnd || date <= rangeEnd))
}

function CustomerActionMenu({ customer, onDelete, onEdit, onViewProfile, t }) {
  return <FloatingActionMenu ariaLabel={t.actions} actions={[
    { icon: <Eye size={15} />, label: t.viewProfile ?? 'View profile', onClick: () => onViewProfile(customer) },
    { icon: <SquareMenu size={15} />, label: t.edit, onClick: onEdit },
    { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => onDelete(customer) },
  ]} />
}

function CustomerModal({ customFields = [], initialCustomer, onClose, onSave, t }) {
  const [form, setForm] = useState(() => ({ ...emptyCustomer, ...(initialCustomer ?? {}), customFields: { ...(initialCustomer?.customFields ?? {}) } }))
  const [closing, setClosing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const requiredMessage = t.requiredFieldMessage ?? 'This field is required.'
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateCustomField = (fieldId, value) => setForm((current) => ({
    ...current,
    customFields: { ...(current.customFields ?? {}), [fieldId]: value },
  }))
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <form
        className="entity-modal customer-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          const missingCustomField = customFields.some((field) => field.required && !String(form.customFields?.[field.id] ?? '').trim())
          if (!form.name.trim() || missingCustomField) return
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), status: form.status || 'Active' })
        }}
      >
        <div className="customer-modal-header">
          <div className="customer-modal-title">
            <h2>
              {initialCustomer
                ? t.editCustomer
                : t.addNewCustomer}
            </h2>

            <p>
              {initialCustomer
                ? (
                  t.editCustomerHint ??
                  'Update the customer information and account settings.'
                )
                : (
                  t.addCustomerHint ??
                  'Enter the customer information and account settings.'
                )}
            </p>
          </div>

          <button
            className="customer-modal-close"
            type="button"
            onClick={requestClose}
            aria-label={t.close ?? 'Close'}
            title={t.close ?? 'Close'}
          >
            <X size={16} />
          </button>
        </div>

   <label className="wide customer-main-field">
  <span className="customer-field-label customer-required-label">
    <span className="customer-label-text">
      {t.name}
      <em className="customer-required-star">*</em>
    </span>
  </span>

  <input
    autoFocus
    className={
      submitted && !form.name.trim()
        ? 'field-invalid'
        : ''
    }
    placeholder={t.customerNamePlaceholder}
    value={form.name}
    onChange={(event) =>
      update('name', event.target.value)
    }
  />

  {submitted && !form.name.trim() && (
    <small className="validation-error">
      {requiredMessage}
    </small>
  )}
</label>
<div className="customer-contact-row wide">
  <label>
    <span className="customer-field-label">
      <span>{t.phoneNumber}</span>
    </span>

    <input
      inputMode="tel"
      placeholder={t.phonePlaceholder}
      value={form.phone}
      onChange={(event) =>
        update('phone', event.target.value)
      }
    />
  </label>

  <label>
    <span className="customer-field-label">
      <span>{t.email}</span>
    </span>

    <input
      type="email"
      placeholder={t.emailAddress}
      value={form.email}
      onChange={(event) =>
        update('email', event.target.value)
      }
    />
  </label>
</div>
      <label className="wide">
  <span className="customer-field-label">
    <span>{t.address}</span>
    <small>{t.optional ?? 'Optional'}</small>
  </span>

  <input
    placeholder={t.address}
    value={form.address}
    onChange={(event) =>
      update('address', event.target.value)
    }
  />
</label>

<label className="wide">
  <span className="customer-field-label">
    <span>{t.notes}</span>
    <small>{t.optional ?? 'Optional'}</small>
  </span>

  <textarea
    rows="3"
    placeholder={t.additionalNotes}
    value={form.notes}
    onChange={(event) =>
      update('notes', event.target.value)
    }
  />
</label>
        <div className={`customer-vip-field wide ${form.vip ? 'is-active' : ''}`}>
          <div className="customer-vip-info">
            <strong>{t.vipCustomer}</strong>

            <small>
              {form.vip
                ? (t.vipCustomerActive ?? 'VIP customer is active')
                : (t.vipCustomerInactive ?? 'VIP customer is inactive')}
            </small>
          </div>

          <button
            className={`customer-vip-toggle ${form.vip ? 'is-on' : ''}`}
            type="button"
            role="switch"
            aria-checked={form.vip}
            aria-label={t.vipCustomer}
            onClick={() => update('vip', !form.vip)}
          >
            <span className="customer-vip-toggle-track">
              <span className="customer-vip-toggle-thumb" />
            </span>

            <strong>{form.vip ? 'ON' : 'OFF'}</strong>
          </button>
        </div>
        <div className="customer-status-choice wide">
          <span>{t.status}</span>
          <label><input checked={(form.status || 'Active') === 'Active'} name="customer-status" type="radio" onChange={() => update('status', 'Active')} /> {t.active}</label>
          <label><input checked={(form.status || 'Active') === 'Inactive'} name="customer-status" type="radio" onChange={() => update('status', 'Inactive')} /> {t.inactive ?? 'Inactive'}</label>
        </div>
        <CustomFieldInputs fields={customFields} onChange={updateCustomField} requiredMessage={requiredMessage} submitted={submitted} values={form.customFields} />
        <div className="customer-modal-footer wide">
  <button
    className="customer-cancel-btn"
    type="button"
    onClick={requestClose}
  >
    {t.cancel ?? 'Cancel'}
  </button>

  <button
    className="customer-save-btn"
    type="submit"
  >
    {initialCustomer
      ? t.saveChanges
      : t.addCustomer}
  </button>
</div>
      </form>
    </div>
  )
}

function CustomerProfile({ companyInfo, customer, onBack, onEdit, printSettings, products, sales, t }) {
  const [activeTab, setActiveTab] = useState('orders')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [printRows, setPrintRows] = useState(null)

  const customerSales = useMemo(() => getCustomerSales(customer, sales), [customer, sales])
  const filteredSales = useMemo(() => customerSales.filter((sale) => {
    const needle = query.trim().toLowerCase()
    const matchesQuery = !needle
      || sale.invoiceNumber?.toLowerCase().includes(needle)
      || sale.items?.some((item) => [item.name, item.code].some((value) => String(value || '').toLowerCase().includes(needle)))
    const isLoan = parseNumber(sale.balance) > 0 || sale.paymentStatus === 'loan'
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'paid' && !isLoan)
      || (statusFilter === 'loan' && isLoan)
    const matchesDate = getDateMatches(sale.date, dateFilter, customStartDate, customEndDate)
    return matchesQuery && matchesStatus && matchesDate
  }), [customEndDate, customStartDate, customerSales, dateFilter, query, statusFilter])

  const totals = useMemo(() => {
    const totalRevenue = customerSales.reduce((sum, sale) => sum + parseNumber(sale.total), 0)
    const totalSpent = customerSales.reduce((sum, sale) => sum + parseNumber(sale.paidAmount), 0)
    const pendingBalance = customerSales.reduce((sum, sale) => sum + parseNumber(sale.balance), 0)
    const totalDiscounts = customerSales.reduce((sum, sale) => sum + parseNumber(sale.discountTotal), 0)
    const totalCost = customerSales.reduce((sum, sale) => sum + getSaleCost(sale, products), 0)
    return {
      totalCost,
      totalDiscounts,
      totalOrders: customerSales.length,
      totalRevenue,
      totalSpent,
      pendingBalance,
      profit: totalRevenue - totalCost,
    }
  }, [customerSales, products])

  const paymentRows = filteredSales.flatMap((sale) => {
    const explicitPayments = (sale.paymentHistory || []).map((payment) => ({
      id: payment.id,
      invoice: sale.invoiceNumber,
      amount: payment.amount,
      total: sale.total,
      date: payment.createdAt?.slice(0, 10) || sale.date,
      status: sale.paymentStatus,
      description: payment.notes || t.paymentRecorded,
      currency: sale.currency,
    }))
    if (explicitPayments.length > 0) return explicitPayments
    return parseNumber(sale.paidAmount) > 0 ? [{
      id: `${sale.id}-initial-payment`,
      invoice: sale.invoiceNumber,
      amount: sale.paidAmount,
      total: sale.total,
      date: sale.date,
      status: sale.paymentStatus,
      description: t.paymentRecorded,
      currency: sale.currency,
    }] : []
  })

  const loanRows = filteredSales.filter((sale) => parseNumber(sale.balance) > 0)
  const profitRows = filteredSales.map((sale) => {
    const cost = getSaleCost(sale, products)
    return { ...sale, cost, profit: parseNumber(sale.total) - cost }
  })
  const activityRows = filteredSales.flatMap((sale) => [
    ...(sale.updatedAt ? [{ id: `${sale.id}-updated`, action: t.billUpdated ?? 'Bill Updated', description: `${sale.invoiceNumber} - ${formatMoney(sale.total, sale.currency)}`, date: sale.updatedAt.slice(0, 10), currency: sale.currency }] : []),
    { id: `${sale.id}-created`, action: t.newSaleCreated ?? 'New Sale Created', description: `${sale.invoiceNumber} - ${formatMoney(sale.total, sale.currency)}`, date: sale.date, currency: sale.currency },
    ...(parseNumber(sale.balance) > 0 ? [{ id: `${sale.id}-loan`, action: t.loanCreated ?? 'Loan Created', description: `${t.loan} - ${formatMoney(sale.balance, sale.currency)}`, date: sale.date, currency: sale.currency }] : []),
  ])

  const tabOptions = [
    { id: 'orders', icon: <ShoppingCart size={16} />, label: t.orders ?? 'Orders', count: filteredSales.length },
    { id: 'payments', icon: <CreditCard size={16} />, label: t.paymentHistory, count: paymentRows.length },
    { id: 'loans', icon: <WalletCards size={16} />, label: t.loans, count: loanRows.length },
    { id: 'profit', icon: <BarChart3 size={16} />, label: t.profitAnalysis ?? 'Profit Analysis' },
    { id: 'activity', icon: <History size={16} />, label: t.activityLog ?? 'Activity Log' },
  ]
  const statusOptions = [
    { value: 'all', label: t.allStatus ?? t.allStatuses },
    { value: 'paid', label: t.paid },
    { value: 'loan', label: t.loan },
  ]
  const dateOptions = [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ]
  const displayCurrency = customerSales[0]?.currency || 'AFN'
  const printConfig = (() => {
    if (activeTab === 'payments') return { rows: paymentRows, title: `${customer.name} - ${t.paymentHistory}`, columns: [{ key: 'invoice', label: t.invoice }, { key: 'amount', label: t.paidAmount }, { key: 'description', label: t.description }, { key: 'date', label: t.date }] }
    if (activeTab === 'loans') return { rows: loanRows.map((sale) => ({ ...sale, remaining: formatMoney(sale.balance, sale.currency) })), title: `${customer.name} - ${t.loans}`, columns: [{ key: 'invoiceNumber', label: t.invoice }, { key: 'remaining', label: t.remaining }, { key: 'date', label: t.date }] }
    if (activeTab === 'profit') return { rows: profitRows.map((sale) => ({ id: sale.id, invoice: sale.invoiceNumber, revenue: formatMoney(sale.total, sale.currency), cost: formatMoney(sale.cost, sale.currency), profit: formatMoney(sale.profit, sale.currency), date: sale.date })), title: `${customer.name} - ${t.profitAnalysis ?? 'Profit Analysis'}`, columns: [{ key: 'invoice', label: t.invoice }, { key: 'revenue', label: t.revenue ?? 'Revenue' }, { key: 'cost', label: t.cost ?? 'Cost' }, { key: 'profit', label: t.profit }, { key: 'date', label: t.date }] }
    if (activeTab === 'activity') return { rows: activityRows, title: `${customer.name} - ${t.activityLog ?? 'Activity Log'}`, columns: [{ key: 'action', label: t.actions }, { key: 'description', label: t.description }, { key: 'date', label: t.date }] }
    return { rows: filteredSales.map((sale) => ({ ...sale, totalLabel: formatMoney(sale.total, sale.currency), paidLabel: formatMoney(sale.paidAmount, sale.currency), balanceLabel: formatMoney(sale.balance, sale.currency) })), title: `${customer.name} - ${t.orders ?? 'Orders'}`, columns: [{ key: 'invoiceNumber', label: t.invoice }, { key: 'totalLabel', label: t.total }, { key: 'paidLabel', label: t.paid }, { key: 'balanceLabel', label: t.balanceDue ?? 'Balance Due' }, { key: 'date', label: t.date }] }
  })()

  return (
    <div className="entity-content customer-profile-content">
      <div className="customer-profile-head">
        <button
          className="staff-profile-back-btn"
          type="button"
          onClick={onBack}
          aria-label={t.back ?? 'Back'}
          title={t.back ?? 'Back'}
        >
          <ChevronLeft size={19} />
        </button>
        <div className="customer-avatar"><Users size={25} /></div>
        <div>
          <h1>{customer.name}</h1>
          <p>{[customer.phone, customer.email, `${t.memberSince} ${getDateLabel((customer.createdAt || customerSales[0]?.createdAt || customerSales[0]?.date || '').slice(0, 10))}`].filter(Boolean).join('   ')}</p>
        </div>
        <div className="customer-profile-actions">
          <button
            className="customer-profile-edit-btn"
            type="button"
            onClick={() => onEdit(customer)}
          >
            <SquareMenu size={16} />
            <span>{t.edit}</span>
          </button>

          <button
            className="customer-profile-print-btn"
            type="button"
            onClick={() => setPrintRows(printConfig)}
          >
            <Printer size={16} />
            <span>{t.printStatement}</span>
          </button>
        </div>
      </div>

      <div className="summary-grid six customer-profile-summary">
        <article className="tone-green"><span>{t.totalSpent ?? 'Total Spent'}</span><strong>{formatMoney(totals.totalSpent, displayCurrency)}</strong><DollarSign size={22} /></article>
        <article className="tone-blue"><span>{t.totalRevenue}</span><strong>{formatMoney(totals.totalRevenue, displayCurrency)}</strong><ReceiptText size={22} /></article>
        <article className="tone-blue"><span>{t.totalOrders ?? 'Total Orders'}</span><strong>{totals.totalOrders}</strong><ShoppingCart size={22} /></article>
        <article className="tone-orange"><span>{t.pendingBalance ?? 'Pending Balance'}</span><strong>{formatMoney(totals.pendingBalance, displayCurrency)}</strong><CalendarDays size={22} /></article>
        <article className="tone-orange"><span>{t.totalDiscounts ?? 'Total Discounts'}</span><strong>{formatMoney(totals.totalDiscounts, displayCurrency)}</strong><CreditCard size={22} /></article>
        <article className="tone-green"><span>{t.profitEarned ?? 'Profit Earned'}</span><strong>{formatMoney(totals.profit, displayCurrency)}</strong><BarChart3 size={22} /></article>
      </div>

      <div className="filter-card customer-profile-filter">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder={t.searchInvoices ?? 'Search invoices...'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="customer-date-filter">
          <CustomSelect
            ariaLabel={t.allTime}
            options={dateOptions}
            value={dateFilter}
            onChange={setDateFilter}
          />

          {dateFilter === 'custom' && (
            <DateRangePicker
              className="customer-inline-date-range"
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
      </div>

      <div className="customer-profile-tabs">
        {tabOptions.map((tab) => (
          <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>
            {tab.icon}<span>{tab.label}{typeof tab.count === 'number' ? ` (${tab.count})` : ''}</span>
          </button>
        ))}
      </div>

      <div className="data-panel customer-profile-panel">
        {activeTab === 'orders' && (
          <table className="data-table">
            <thead><tr><th>{t.invoice}</th><th>{t.items}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.balanceDue ?? 'Balance Due'}</th><th>{t.status}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>{filteredSales.length === 0 ? <tr><td colSpan="8" className="empty-cell">{t.noSalesFound ?? t.noRecordsFound}</td></tr> : filteredSales.map((sale) => (
              <tr key={sale.id}><td>{sale.invoiceNumber}</td><td>{sale.items.length}</td><td><strong>{formatMoney(sale.total, sale.currency)}</strong></td><td>{formatMoney(sale.paidAmount, sale.currency)}</td><td className="warning-text">{formatMoney(sale.balance, sale.currency)}</td><td><span className={parseNumber(sale.balance) > 0 ? 'status-pill warning' : 'status-pill active'}>{parseNumber(sale.balance) > 0 ? t.loan : t.paid}</span></td><td>{getDateLabel(sale.date)}</td><td>...</td></tr>
            ))}</tbody>
          </table>
        )}
        {activeTab === 'payments' && (
          <div className="customer-payment-list">{paymentRows.length === 0 ? <div className="empty-cell">{t.noPaymentEntries ?? 'No payment entries'}</div> : paymentRows.map((payment) => (
            <article key={payment.id}><div><strong>{payment.invoice}</strong><span>{getDateLabel(payment.date)}</span></div><div><strong className="success-text">{formatMoney(payment.amount, payment.currency)}</strong><span>{t.of ?? 'of'} {formatMoney(payment.total, payment.currency)}</span></div><span className={payment.status === 'paid' ? 'status-pill active' : 'status-pill warning'}>{payment.status === 'paid' ? t.paid : t.loan}</span></article>
          ))}</div>
        )}
        {activeTab === 'loans' && (
          <table className="data-table">
            <thead><tr><th>{t.invoice}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.status}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>{loanRows.length === 0 ? <tr><td colSpan="7" className="empty-cell">{t.noLoansFound}</td></tr> : loanRows.map((sale) => (
              <tr key={sale.id}><td>{sale.invoiceNumber}</td><td>{formatMoney(sale.total, sale.currency)}</td><td className="success-text">{formatMoney(sale.paidAmount, sale.currency)}</td><td className="warning-text">{formatMoney(sale.balance, sale.currency)}</td><td><span className="status-pill warning">{t.loan} / {t.partially ?? 'Partially'}</span></td><td>{getDateLabel(sale.date)}</td><td>...</td></tr>
            ))}</tbody>
          </table>
        )}
        {activeTab === 'profit' && (
          <>
            <div className="customer-profit-strip">
              <div><span>{t.revenueFromCustomer ?? 'Revenue from Customer'}</span><strong className="success-text">{formatMoney(totals.totalRevenue, displayCurrency)}</strong></div>
              <div><span>{t.costOfGoodsSold ?? 'Cost of Goods Sold'}</span><strong>{formatMoney(totals.totalCost, displayCurrency)}</strong></div>
              <div><span>{t.netProfit}</span><strong className="success-text">{formatMoney(totals.profit, displayCurrency)}</strong></div>
            </div>
            <h2>{t.profitByOrder ?? 'Profit by Order'}</h2>
            <table className="data-table"><thead><tr><th>{t.invoice}</th><th>{t.revenue ?? 'Revenue'}</th><th>{t.cost ?? 'Cost'}</th><th>{t.profit}</th><th>{t.date}</th></tr></thead><tbody>{profitRows.map((sale) => <tr key={sale.id}><td>{sale.invoiceNumber}</td><td>{formatMoney(sale.total, sale.currency)}</td><td>{formatMoney(sale.cost, sale.currency)}</td><td className="success-text">{formatMoney(sale.profit, sale.currency)}</td><td>{getDateLabel(sale.date)}</td></tr>)}</tbody></table>
          </>
        )}
        {activeTab === 'activity' && (
          <div className="customer-activity-list">{activityRows.length === 0 ? <div className="empty-cell">{t.noRecordsFound}</div> : activityRows.map((activity) => (
            <article key={activity.id}><span><ShoppingCart size={17} /></span><div><strong>{activity.action}</strong><small>{activity.description}</small><small>{getDateLabel(activity.date)}</small></div></article>
          ))}</div>
        )}
      </div>

      {printRows && (
        <PrintPreviewModal
          columns={printRows.columns}
          companyInfo={companyInfo}
          onClose={() => setPrintRows(null)}
          printSettings={printSettings}
          rows={printRows.rows}
          title={printRows.title}
          t={t}
        />
      )}
    </div>
  )
}

function CustomersPage({ companyInfo, customers, initialProfileCustomerId = '', onCustomersChange, onMoveToRecycle, onNotify, printSettings, products = [], sales = [], t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [profileCustomerId, setProfileCustomerId] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const customerCustomFields = companyInfo?.customFormFields?.customers ?? []
  const profileCustomer = customers.find((customer) => customer.id === profileCustomerId)

  useEffect(() => {
    setProfileCustomerId(initialProfileCustomerId || '')
  }, [initialProfileCustomerId])

  const customerSummaries = useMemo(() => customers.map((customer) => {
    const customerSales = getCustomerSales(customer, sales)
    const hasSales = customerSales.length > 0
    const purchases = hasSales ? customerSales.reduce((sum, sale) => sum + parseNumber(sale.total), 0) : parseNumber(customer.purchases)
    const pending = hasSales ? customerSales.reduce((sum, sale) => sum + parseNumber(sale.balance), 0) : parseNumber(customer.pending)
    const latestDate = customer.createdAt?.slice(0, 10) || customerSales[0]?.date || ''
    return { ...customer, purchases, pending, latestDate }
  }), [customers, sales])

  const filteredCustomers = useMemo(() => customerSummaries.filter((customer) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = !needle || `${customer.name} ${customer.phone} ${customer.email}`.toLowerCase().includes(needle)
    const status = String(customer.status || 'Active').toLowerCase()
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    const hasLoan = parseNumber(customer.pending) > 0
    const matchesPayment = paymentFilter === 'all' || (paymentFilter === 'paid' && !hasLoan) || (paymentFilter === 'loan' && hasLoan)
    const matchesDate = getDateMatches(customer.latestDate, dateFilter, customStartDate, customEndDate)
    return matchesSearch && matchesStatus && matchesPayment && matchesDate
  }), [customEndDate, customStartDate, customerSummaries, dateFilter, paymentFilter, search, statusFilter])

  const totalPurchases = customerSummaries.reduce((sum, customer) => sum + parseNumber(customer.purchases), 0)
  const totalPending = customerSummaries.reduce((sum, customer) => sum + parseNumber(customer.pending), 0)
  const statusOptions = [
    { value: 'all', label: t.allStatuses },
    { value: 'active', label: t.active },
    { value: 'inactive', label: t.inactive ?? 'Inactive' },
  ]
  const paymentOptions = [
    { value: 'all', label: t.all },
    { value: 'paid', label: t.paid },
    { value: 'loan', label: t.loan },
  ]
  const dateOptions = [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ]

  const saveCustomer = (customer) => {
    onCustomersChange((current) => {
      const exists = current.some((item) => item.id === customer.id)
      const nextCustomer = { ...customer, createdAt: customer.createdAt || new Date().toISOString() }
      return exists ? current.map((item) => (item.id === customer.id ? nextCustomer : item)) : [...current, nextCustomer]
    })
    setModalOpen(false)
    setEditingCustomer(null)
    onNotify?.(t.savedSuccessfully)
  }

  const deleteCustomer = (customer) => {
    onMoveToRecycle('customers', customer)
  }

  if (profileCustomer) {
    return (
      <>
        <CustomerProfile
          companyInfo={companyInfo}
          customer={profileCustomer}
          onBack={() => setProfileCustomerId('')}
          onEdit={(customer) => { setEditingCustomer(customer); setModalOpen(true) }}
          printSettings={printSettings}
          products={products}
          sales={sales}
          t={t}
        />
        {modalOpen && <CustomerModal customFields={customerCustomFields} initialCustomer={editingCustomer} onClose={() => { setModalOpen(false); setEditingCustomer(null) }} onSave={saveCustomer} t={t} />}
      </>
    )
  }

  return (
    <div className="entity-content customer-content">
      <div className="entity-heading">
        <div><h1>{t.customerManagement}</h1><p>{t.manageCustomerRelationships}</p></div>
        <div className="entity-actions customer-header-actions">
          <button
            className="app-print-action-btn customer-print-btn"
            type="button"
            onClick={() => setPrintOpen(true)}
          >
            <Printer size={16} />
            <span>{t.printReport}</span>
          </button>

          <button
            className="primary-btn customer-add-btn"
            type="button"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={16} />
            <span>{t.addCustomer}</span>
          </button>
        </div>
      </div>

      <div className="summary-grid four">
        <article className="tone-blue"><span>{t.totalCustomers}</span><strong>{customers.length}</strong><Users size={22} /></article>
        <article className="tone-green"><span>{t.vipCustomers}</span><strong>{customers.filter((customer) => customer.vip).length}</strong><Users size={22} /></article>
        <article className="tone-navy"><span>{t.totalPurchases}</span><strong>{formatMoney(totalPurchases)}</strong><ShoppingCart size={22} /></article>
        <article className="tone-orange"><span>{t.totalPending}</span><strong>{formatMoney(totalPending)}</strong><WalletCards size={22} /></article>
      </div>

      <div className="filter-card customer-filter">
        <div className="search-field"><Search size={17} /><input placeholder={t.searchCustomers} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <CustomSelect ariaLabel={t.status} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <CustomSelect ariaLabel={t.paymentStatus} options={paymentOptions} value={paymentFilter} onChange={setPaymentFilter} />
        <div className="customer-date-filter">
          <CustomSelect
            ariaLabel={t.allTime}
            options={dateOptions}
            value={dateFilter}
            onChange={setDateFilter}
          />

          {dateFilter === 'custom' && (
            <DateRangePicker
              className="customer-inline-date-range"
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
      </div>

      <div className="data-panel customer-panel">
        <h2><Users size={20} /> {t.customers} ({filteredCustomers.length})</h2>
        <table className="data-table">
          <thead><tr><th>{t.name}</th><th>{t.contact}</th><th>{t.purchases}</th><th>{t.pending}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {filteredCustomers.length === 0 ? <tr><td colSpan="6" className="empty-cell">{t.noCustomersFound}</td></tr> : filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td><span className="stacked-cell">{customer.phone}<small>{customer.email}</small></span></td>
                <td>{formatMoney(customer.purchases)}</td>
                <td className="warning-text">{formatMoney(customer.pending)}</td>
                <td><span className={String(customer.status || 'Active').toLowerCase() === 'inactive' ? 'status-pill warning' : 'status-pill active'}>{String(customer.status || 'Active').toLowerCase() === 'inactive' ? (t.inactive ?? 'Inactive') : t.active}</span></td>
                <td>
                  <CustomerActionMenu
                    customer={customer}
                    onDelete={deleteCustomer}
                    onEdit={() => { setEditingCustomer(customer); setModalOpen(true) }}
                    onViewProfile={(item) => setProfileCustomerId(item.id)}
                    t={t}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <CustomerModal customFields={customerCustomFields} initialCustomer={editingCustomer} onClose={() => { setModalOpen(false); setEditingCustomer(null) }} onSave={saveCustomer} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={filteredCustomers} title={t.customerReport} columns={[{ key: 'name', label: t.name }, { key: 'phone', label: t.phoneNumber }, { key: 'email', label: t.email }, { key: 'purchases', label: t.purchases }, { key: 'pending', label: t.pending }]} t={t} />}
    </div>
  )
}

export default CustomersPage
