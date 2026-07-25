import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  Eye,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from '../components/Icons.jsx'
import { formatBusinessCurrencyAmount } from '../utils/currencyExchange.js'
import './Loans.css'

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const roundMoney = (value) => Math.round((parseNumber(value) + Number.EPSILON) * 100) / 100

const formatMoney = (value, currency = 'AFN') => {
  return formatBusinessCurrencyAmount(value, currency)
}

const getGregorianLabel = (isoDate) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const getShamsiShortLabel = (isoDate) => {
  try {
    return new Intl.DateTimeFormat('en-CA-u-ca-persian', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${isoDate}T12:00:00`))
  } catch {
    return isoDate
  }
}

const parseDateInput = (value) => (value ? new Date(`${value}T12:00:00`) : null)

const getLoanStatus = (loan) => {
  if (parseNumber(loan.balance) <= 0) return 'paid'
  const date = parseDateInput(loan.date)
  if (!date) return 'pending'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysOld = Math.floor((today - date) / 86400000)
  return daysOld > 30 ? 'overdue' : 'pending'
}

const getDateMatches = (dateValue, filter, customStartDate, customEndDate) => {
  if (filter === 'all') return true
  const date = parseDateInput(dateValue)
  if (!date) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysOld = Math.floor((today - date) / 86400000)
  const rangeStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
  const rangeEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
  return (filter === 'today' && daysOld === 0)
    || (filter === 'weekly' && daysOld >= 0 && daysOld <= 7)
    || (filter === 'monthly' && daysOld >= 0 && daysOld <= 31)
    || (filter === 'annual' && daysOld >= 0 && daysOld <= 366)
    || (filter === 'custom' && (!rangeStart || date >= rangeStart) && (!rangeEnd || date <= rangeEnd))
}

function LoanDetailsModal({
  loan,
  onClose,
  onDelete,
  onMarkPaid,
  onPayment,
  t,
}) {
  const paid = parseNumber(loan.paidAmount)
  const total = parseNumber(loan.total)
  const remaining = parseNumber(loan.balance)

  const progress =
    total > 0
      ? Math.min(
          100,
          Math.round((paid / total) * 100),
        )
      : 0

  const status = getLoanStatus(loan)

  const statusLabel =
    status === 'paid'
      ? t.paid
      : status === 'overdue'
        ? (t.overdue ?? 'Overdue')
        : t.pending

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <section
        className="loan-modal loan-details-modal loan-modal-v2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loan-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="loan-modal-v2-header">
          <div className="loan-modal-v2-title">
            <div className="loan-modal-v2-icon">
              <CreditCard size={18} />
            </div>

            <div>
              <h2 id="loan-details-title">
                {t.loanDetails ?? 'Loan Details'}
              </h2>

              <p>
                {loan.invoiceNumber || 'Loan record'}
              </p>
            </div>
          </div>

          <span
  className={`loan-header-status status-pill ${
    status === 'paid'
      ? 'active'
      : status === 'overdue'
        ? 'danger'
        : 'warning'
  }`}
>
  {statusLabel}
</span>

          <button
  className="loan-modal-v2-close"
  type="button"
  onClick={onClose}
  aria-label={t.close ?? 'Close'}
  title={t.close ?? 'Close'}
>
  <span aria-hidden="true">×</span>
</button>
        </header>

        <div className="loan-modal-v2-body">
          <section className="loan-info-grid">
            <div className="loan-info-card">
              <span>{t.invoice}</span>
              <strong>
                {loan.invoiceNumber || '-'}
              </strong>
            </div>

            <div className="loan-info-card">
              <span>{t.customer}</span>
              <strong>
                {loan.customerName || '-'}
              </strong>
            </div>
          </section>

          <section className="loan-progress-card">
            <div className="loan-progress-head">
              <span>
                {t.paymentProgress ??
                  'Payment Progress'}
              </span>

              <strong>{progress}%</strong>
            </div>

            <div className="loan-progress-track">
              <span
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="loan-amount-card">
            <div>
              <span>
                {t.totalAmount ?? t.total}
              </span>

              <strong>
                {formatMoney(total, loan.currency)}
              </strong>
            </div>

            <div>
              <span className="success-text">
                {t.paid}
              </span>

              <strong className="success-text">
                {formatMoney(paid, loan.currency)}
              </strong>
            </div>

            <div>
              <span className="danger-text">
                {t.remaining}
              </span>

              <strong className="danger-text">
                {formatMoney(
                  remaining,
                  loan.currency,
                )}
              </strong>
            </div>
          </section>

          <section className="loan-created-card">
            <CalendarDays size={16} />

            <div>
              <span>{t.created ?? 'Created'}</span>

              <strong>
                {getGregorianLabel(loan.date)}
              </strong>
            </div>
          </section>
        </div>

        <footer className="loan-modal-v2-footer">
          <button
            className="loan-record-payment-btn"
            type="button"
            onClick={onPayment}
          >
            <DollarSign size={15} />
            <span>{t.recordPayment}</span>
          </button>

          <button
            className="loan-mark-paid-btn"
            type="button"
            disabled={remaining <= 0}
            onClick={onMarkPaid}
          >
            <CreditCard size={15} />

            <span>
              {t.markAsPaid ?? 'Mark as Paid'}
            </span>
          </button>

          <button
            className="loan-delete-record-btn"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={15} />

            <span>
              {t.deleteLoanRecord ??
                'Delete Loan Record'}
            </span>
          </button>
        </footer>
      </section>
    </div>
  )
}

function LoanPaymentModal({
  loan,
  onClose,
  onRecord,
  t,
}) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const remaining = parseNumber(loan.balance)
  const amountValue = parseNumber(amount)

  const invalid =
    amountValue <= 0 ||
    amountValue > remaining

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <form
        className="loan-modal loan-payment-modal loan-payment-modal-v2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loan-payment-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()

          if (!invalid) {
            onRecord(amountValue, notes)
          }
        }}
      >
        <header className="loan-modal-v2-header">
          <div className="loan-modal-v2-title">
            <div className="loan-modal-v2-icon payment">
              <DollarSign size={18} />
            </div>

            <div>
              <h2 id="loan-payment-title">
                {t.recordPayment}
              </h2>

              <p>
                {loan.invoiceNumber || 'Loan payment'}
              </p>
            </div>
          </div>

          <button
  className="loan-modal-v2-close"
  type="button"
  onClick={onClose}
  aria-label={t.close ?? 'Close'}
  title={t.close ?? 'Close'}
>
  <span aria-hidden="true">×</span>
</button>
        </header>

        <div className="loan-payment-modal-v2-body">
          <section className="loan-payment-summary-card">
            <div>
              <span>{t.invoice}</span>
              <strong>
                {loan.invoiceNumber || '-'}
              </strong>
            </div>

            <div>
              <span>{t.total}</span>
              <strong>
                {formatMoney(
                  loan.total,
                  loan.currency,
                )}
              </strong>
            </div>

            <div>
              <span>
                {t.alreadyPaid ?? 'Already Paid'}
              </span>

              <strong className="success-text">
                {formatMoney(
                  loan.paidAmount,
                  loan.currency,
                )}
              </strong>
            </div>

            <div>
              <span>{t.remaining}</span>

              <strong className="danger-text">
                {formatMoney(
                  remaining,
                  loan.currency,
                )}
              </strong>
            </div>
          </section>

          <label className="loan-payment-field">
            <span>
              {t.paymentAmount ??
                'Payment Amount'}
              <b className="required-mark">*</b>
            </span>

            <div className="loan-payment-input-shell">
  <input
    autoFocus
    inputMode="decimal"
    placeholder={`${t.max ?? 'Max'}: ${remaining}`}
    value={amount}
    onChange={(event) =>
      setAmount(event.target.value)
    }
  />
</div>

            {amountValue > remaining && (
              <small className="loan-payment-error">
                Payment cannot exceed the remaining balance.
              </small>
            )}
          </label>

          <label className="loan-payment-field">
            <span>
              {t.notes} ({t.optional})
            </span>

            <textarea
              placeholder={
                t.paymentReference ??
                'Payment reference...'
              }
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />
          </label>
        </div>

        <footer className="loan-payment-footer">
          <button
            className="loan-payment-cancel-btn"
            type="button"
            onClick={onClose}
          >
            {t.cancel}
          </button>

          <button
            className="loan-payment-submit-btn"
            disabled={invalid}
            type="submit"
          >
            <DollarSign size={15} />
            <span>{t.recordPayment}</span>
          </button>
        </footer>
      </form>
    </div>
  )
}

function LoanDeleteConfirm({ loan, onCancel, onConfirm, t }) {
  return (
    <div className="modal-backdrop app-confirm-backdrop" onClick={onCancel}>
      <div className="app-confirm-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{t.confirmDeletion ?? 'Confirm Deletion'}</h2>
        <p>{(t.confirmDeleteItem ?? 'Are you sure you want to delete {name}?').replace('{name}', loan.invoiceNumber)}</p>
        <footer className="modal-actions">
          <button type="button" onClick={onCancel}>{t.cancel}</button>
          <button className="danger-btn" type="button" onClick={onConfirm}>{t.delete}</button>
        </footer>
      </div>
    </div>
  )
}

function LoansPage({ companyInfo, onCustomersChange, onEditBill, onNotify, onSalesChange, printSettings, sales, t }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const [viewLoan, setViewLoan] = useState(null)
  const [paymentLoan, setPaymentLoan] = useState(null)
  const [deleteLoan, setDeleteLoan] = useState(null)

  const loans = useMemo(() => sales
    .map((sale) => {
      const balance = Math.max(0, parseNumber(sale.total) - parseNumber(sale.paidAmount))
      return { ...sale, balance, status: getLoanStatus({ ...sale, balance }) }
    })
    .filter((sale) => sale.balance > 0 || sale.paymentStatus === 'loan' || (sale.paymentHistory || []).length > 0), [sales])

  const filteredLoans = useMemo(() => loans.filter((loan) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = !needle || `${loan.invoiceNumber} ${loan.customerName}`.toLowerCase().includes(needle)
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    const matchesDate = getDateMatches(loan.date, dateFilter, customStartDate, customEndDate)
    return matchesSearch && matchesStatus && matchesDate
  }), [customEndDate, customStartDate, dateFilter, loans, search, statusFilter])

  const activeTotal = filteredLoans.reduce((sum, loan) => sum + parseNumber(loan.balance), 0)
  const paidTotal = filteredLoans.reduce((sum, loan) => sum + parseNumber(loan.paidAmount), 0)
  const pendingTotal = filteredLoans.filter((loan) => loan.status === 'pending').reduce((sum, loan) => sum + parseNumber(loan.balance), 0)
  const overdueCount = filteredLoans.filter((loan) => loan.status === 'overdue').length
  const statusOptions = [
    { value: 'all', label: t.all ?? 'All' },
    { value: 'pending', label: t.pending ?? 'Pending' },
    { value: 'paid', label: t.paid ?? 'Paid' },
    { value: 'overdue', label: t.overdue ?? 'Overdue' },
  ]
  const dateOptions = [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today ?? 'Today' },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ]
  const printRows = filteredLoans.map((loan) => ({
    id: loan.id,
    invoice: loan.invoiceNumber,
    customer: loan.customerName,
    total: formatMoney(loan.total, loan.currency),
    paid: formatMoney(loan.paidAmount, loan.currency),
    remaining: formatMoney(loan.balance, loan.currency),
    status: loan.status,
    date: getGregorianLabel(loan.date),
  }))

  const adjustCustomerPending = (loan, amount, removeSale = false) => {
    if (!loan.customerId || !onCustomersChange) return
    onCustomersChange((current) => current.map((customer) => {
      if (customer.id !== loan.customerId) return customer
      const pendingDelta = removeSale ? parseNumber(loan.balance) : amount
      const purchasesDelta = removeSale ? parseNumber(loan.total) : 0
      return {
        ...customer,
        purchases: Math.max(0, parseNumber(customer.purchases) - purchasesDelta).toFixed(2),
        pending: Math.max(0, parseNumber(customer.pending) - pendingDelta).toFixed(2),
      }
    }))
  }

  const recordPayment = (loan, amount, notes = '') => {
    const paymentAmount = Math.min(parseNumber(loan.balance), parseNumber(amount))
    if (paymentAmount <= 0) return
    const payment = {
      id: crypto.randomUUID(),
      amount: roundMoney(paymentAmount),
      currency: loan.currency,
      invoice: loan.invoiceNumber,
      notes: notes.trim(),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    }
    onSalesChange((current) => current.map((sale) => {
      if (sale.id !== loan.id) return sale
      const nextPaid = roundMoney(Math.min(parseNumber(sale.total), parseNumber(sale.paidAmount) + paymentAmount))
      const nextBalance = roundMoney(Math.max(0, parseNumber(sale.total) - nextPaid))
      return {
        ...sale,
        paidAmount: nextPaid,
        balance: nextBalance,
        paymentStatus: nextBalance <= 0 ? 'paid' : 'loan',
        paymentHistory: [...(sale.paymentHistory || []), payment],
        updatedAt: new Date().toISOString(),
      }
    }))
    adjustCustomerPending(loan, paymentAmount)
    setPaymentLoan(null)
    setViewLoan(null)
    onNotify?.(t.paymentRecorded)
  }

  const markPaid = (loan) => recordPayment(loan, parseNumber(loan.balance), t.markAsPaid ?? 'Mark as Paid')

  const deleteSelectedLoan = () => {
    if (!deleteLoan) return
    onSalesChange((current) => current.filter((sale) => sale.id !== deleteLoan.id))
    adjustCustomerPending(deleteLoan, 0, true)
    setDeleteLoan(null)
    setViewLoan(null)
    onNotify?.(t.deletedSuccessfully ?? t.invoiceDeleted ?? 'Deleted successfully')
  }

  const openPayment = (loan) => {
    setViewLoan(null)
    setPaymentLoan(loan)
  }

  return (
    <section className="entity-content loans-content">
      <div className="entity-heading loans-heading">
        <div><h1>{t.loanManagement}</h1><p>{t.trackManageCustomerLoans}</p></div>
        <div className="entity-actions"><button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.printReport}</button></div>
      </div>

      <div className="summary-grid four loans-summary">
        <article className="tone-blue"><span>{t.activeLoans}</span><strong>{formatMoney(activeTotal)}</strong><CreditCard size={22} /></article>
        <article className="tone-green"><span>{t.paidLoans}</span><strong>{formatMoney(paidTotal)}</strong><DollarSign size={22} /></article>
        <article className="tone-orange"><span>{t.pendingLoans}</span><strong>{formatMoney(pendingTotal)}</strong><CalendarDays size={22} /></article>
        <article className="tone-red"><span>{t.overdueLoans ?? 'Overdue Loans'}</span><strong>{overdueCount}</strong><WalletCards size={22} /></article>
      </div>

      <div className="filter-bar loans-filter-bar">
        <div className="search-field"><Search size={17} /><input placeholder={t.searchInvoiceCustomer} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <CustomSelect ariaLabel={t.status} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <div className="loans-date-filter">
          <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
          {dateFilter === 'custom' && (
            <DateRangePicker
              className="loan-date-range"
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

      <div className="data-panel loans-panel">
        <h2><CreditCard size={20} /> {t.loans} ({filteredLoans.length})</h2>
        <div className="loans-table-wrap">
          <table className="data-table loans-table">
            <thead><tr><th>{t.invoice}</th><th>{t.customer}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.status}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredLoans.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noLoansFound}</td></tr> : filteredLoans.map((loan) => (
                <tr key={loan.id}>
                  <td><strong>{loan.invoiceNumber}</strong></td>
                  <td>{loan.customerName}</td>
                  <td><strong>{formatMoney(loan.total, loan.currency)}</strong></td>
                  <td className="success-text">{formatMoney(loan.paidAmount, loan.currency)}</td>
                  <td className="danger-text">{formatMoney(loan.balance, loan.currency)}</td>
                  <td><span className={`status-pill ${loan.status === 'paid' ? 'active' : loan.status === 'overdue' ? 'danger' : 'warning'}`}>{loan.status === 'paid' ? t.paid : loan.status === 'overdue' ? (t.overdue ?? 'Overdue') : t.pending}</span></td>
                  <td>{getGregorianLabel(loan.date)}<small>{getShamsiShortLabel(loan.date)}</small></td>
                  <td>
                    <FloatingActionMenu
                      ariaLabel={t.actions}
                      actions={[
                        { icon: <Eye size={15} />, label: t.view, onClick: () => setViewLoan(loan) },
                        { icon: <DollarSign size={15} />, label: t.makePayment ?? 'Make Payment', onClick: () => openPayment(loan) },
                        { icon: <CreditCard size={15} />, label: t.markAsPaid ?? 'Mark as Paid', onClick: () => markPaid(loan) },
                        { icon: <Eye size={15} />, label: t.editBill ?? 'Edit Bill', onClick: () => onEditBill?.(loan) },
                        { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => setDeleteLoan(loan) },
                      ]}
                      width={186}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewLoan && <LoanDetailsModal loan={viewLoan} onClose={() => setViewLoan(null)} onDelete={() => setDeleteLoan(viewLoan)} onMarkPaid={() => markPaid(viewLoan)} onPayment={() => openPayment(viewLoan)} t={t} />}
      {paymentLoan && <LoanPaymentModal loan={paymentLoan} onClose={() => setPaymentLoan(null)} onRecord={(amount, notes) => recordPayment(paymentLoan, amount, notes)} t={t} />}
      {deleteLoan && <LoanDeleteConfirm loan={deleteLoan} onCancel={() => setDeleteLoan(null)} onConfirm={deleteSelectedLoan} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printRows} title={t.loanReport} columns={[
        { key: 'invoice', label: t.invoice },
        { key: 'customer', label: t.customer },
        { key: 'total', label: t.total },
        { key: 'paid', label: t.paid },
        { key: 'remaining', label: t.remaining },
        { key: 'status', label: t.status },
        { key: 'date', label: t.date },
      ]} t={t} />}
    </section>
  )
}

export default LoansPage
