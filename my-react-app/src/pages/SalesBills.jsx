import { useEffect, useMemo, useRef, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { formatBusinessCurrencyAmount } from '../utils/currencyExchange.js'
import {
  CalendarDays,
  CreditCard,
  Download,
  DollarSign,
  Eye,
  History,
  Mail,
  MessageCircle,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  Search,
  Share2,
  ShoppingCart,
  SquareMenu,
  Trash2,
  WalletCards,
  X,
} from '../components/Icons.jsx'
import './SalesBills.css'

const currencyOptions = [
  { code: 'AFN', symbol: '؋' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'SAR', symbol: 'ریال' },
  { code: 'PKR', symbol: 'Rs' },
  { code: 'INR', symbol: '₹' },
  { code: 'IRR', symbol: 'ریال' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'CNY', symbol: '¥' },
]

const formatMoney = (value, currencyCode) => {
  const currency = currencyOptions.find((item) => item.code === currencyCode) ?? currencyOptions[0]
  return formatBusinessCurrencyAmount(value, currency.code)
}

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const roundMoney = (value) => Math.round((parseNumber(value) + Number.EPSILON) * 100) / 100
const roundQty = (value) => Math.round((parseNumber(value) + Number.EPSILON) * 10000) / 10000
const getSaleDiscountTotal = (sale) => {
  const billDiscount = parseNumber(sale.discountTotal ?? sale.discount)
  const itemDiscount = (sale.items || []).reduce((sum, item) => sum + parseNumber(item.discount), 0)
  return billDiscount + itemDiscount
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

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateInput = (value) => (value ? new Date(`${value}T12:00:00`) : null)
const formatShortDate = (value) => {
  const date = parseDateInput(value)
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const printInvoice = (sale, companyInfo, t) => {
  const rows = sale.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.code)}</td>
      <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit || 'pcs')}</td>
      <td>${formatMoney(item.price, sale.currency)}</td>
      <td><strong>${formatMoney(item.lineTotal, sale.currency)}</strong></td>
    </tr>
  `).join('')
  const logo = companyInfo?.logo ? `<img class="invoice-logo" src="${escapeHtml(companyInfo.logo)}" alt="" />` : '<div class="invoice-logo"></div>'
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(sale.invoiceNumber)}</title>
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 10mm; }
          body { margin: 0; background: #e5e7eb; font-family: Arial, sans-serif; }
          .invoice-paper { width: 190mm; min-height: 270mm; margin: 0 auto; background: #fff; color: #111827; position: relative; overflow: hidden; }
          .invoice-ribbon { height: 62px; background: linear-gradient(100deg, #1e5265, #20c765); border-bottom-left-radius: 58% 22px; border-bottom-right-radius: 8px; }
          .invoice-head { display: flex; justify-content: space-between; gap: 24px; padding: 22px 38px 12px; }
          .invoice-brand { display: flex; align-items: center; gap: 16px; }
          .invoice-brand h2 { margin: 0; color: #1e3a5f; }
          .invoice-brand p { margin: 4px 0 0; color: #94a3b8; letter-spacing: 2px; font-size: 12px; }
          .invoice-logo { width: 80px; height: 46px; border-radius: 14px; object-fit: cover; background: #e5e7eb; }
          .invoice-title-box { border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 6px; padding: 12px 18px; text-align: right; }
          .invoice-title-box h1 { margin: 0; color: #16a34a; letter-spacing: 3px; font-size: 18px; }
          .invoice-dev { margin: 8px 38px 16px; padding-top: 9px; border-top: 1px solid #cbd5e1; color: #9ca3af; text-align: center; font-size: 8px; letter-spacing: 3px; text-transform: uppercase; }
          .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; margin: 0 38px 8px; font-size: 12px; }
          .invoice-table { width: calc(100% - 76px); margin: 12px 38px; border-collapse: collapse; }
          .invoice-table th, .invoice-table td { padding: 11px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 12px; }
          .invoice-table th { background: #f1f5f9; color: #1e3a5f; letter-spacing: 1px; }
          .invoice-summary { width: 300px; margin: 18px 38px 0 auto; display: grid; gap: 7px; font-size: 12px; }
          .invoice-summary div { display: flex; justify-content: space-between; gap: 20px; }
          .invoice-summary .remaining-total strong { color: #f59e0b; }
          .invoice-summary .grand { border-top: 1px solid #cbd5e1; padding-top: 8px; font-weight: 800; }
          .invoice-watermark { position: absolute; left: 50%; top: 68%; transform: translate(-50%, -50%); width: 180px; height: 180px; border-radius: 30px; background: #f1f5f9; display: grid; place-items: center; color: #fff; font-size: 96px; opacity: .72; }
          .success-text { color: #16a34a; }
          .warning-text { color: #d97706; }
          @media print { body { background: #fff; } .invoice-paper { width: 190mm; min-height: auto; margin: 0 auto; } }
        </style>
      </head>
      <body>
        <article class="invoice-paper">
          <div class="invoice-ribbon"></div>
          <header class="invoice-head">
            <div class="invoice-brand">
              ${logo}
              <div>
                <h2>${escapeHtml(companyInfo?.name || 'RetailPro')}</h2>
                <p>${escapeHtml(companyInfo?.tagline || t.retailManagement)}</p>
              </div>
            </div>
            <div class="invoice-title-box"><h1>INVOICE</h1><span>#${escapeHtml(sale.invoiceNumber)}</span></div>
          </header>
          <div class="invoice-dev">${escapeHtml(t.invoiceDevLine)}</div>
          <section class="invoice-meta">
            <span>${escapeHtml(t.billTo)}: <strong>${escapeHtml(sale.customerName)}</strong></span>
            <span>${escapeHtml(t.status)}: <strong class="${sale.paymentStatus === 'paid' ? 'success-text' : 'warning-text'}">${escapeHtml(sale.paymentStatus === 'paid' ? t.paid : t.loan)}</strong></span>
            <span>${escapeHtml(t.invoice)}: <strong>${escapeHtml(sale.invoiceNumber)}</strong></span>
            <span>${escapeHtml(t.date)}: <strong>${escapeHtml(getGregorianLabel(sale.date))}</strong> / ${escapeHtml(getShamsiShortLabel(sale.date))}</span>
            <span>${escapeHtml(t.paymentMethod)}: <strong>${escapeHtml(t[sale.paymentMethod] ?? sale.paymentMethod)}</strong></span>
            <span>${escapeHtml(t.total)}: <strong>${formatMoney(sale.total, sale.currency)}</strong></span>
          </section>
          <table class="invoice-table">
            <thead><tr><th>${escapeHtml(t.item)}</th><th>${escapeHtml(t.code)}</th><th>${escapeHtml(t.qty)}</th><th>${escapeHtml(t.price)}</th><th>${escapeHtml(t.total)}</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="invoice-summary">
            <div><span>${escapeHtml(t.subtotal)}</span><strong>${formatMoney(sale.subtotal, sale.currency)}</strong></div>
            <div><span>${escapeHtml(t.discount)}</span><strong>${formatMoney(getSaleDiscountTotal(sale), sale.currency)}</strong></div>
            ${parseNumber(sale.balance) > 0 ? `<div class="remaining-total"><span>${escapeHtml(t.remaining)}</span><strong>${formatMoney(sale.balance, sale.currency)}</strong></div>` : ''}
            <div class="grand"><span>${escapeHtml(t.total)}</span><strong>${formatMoney(sale.total, sale.currency)}</strong></div>
          </div>
          <div class="invoice-watermark">$</div>
        </article>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank', 'width=900,height=1100')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => printWindow.print(), 250)
}

function SalesDateRangePicker({ end, onChange, start, t }) {
  const rootRef = useRef(null)
  const initialMonth = parseDateInput(start) || parseDateInput(end) || new Date()
  const [open, setOpen] = useState(false)
  const [monthDate, setMonthDate] = useState(initialMonth)

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const firstGridDay = new Date(monthStart)
  firstGridDay.setDate(firstGridDay.getDate() - firstGridDay.getDay())
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay)
    date.setDate(firstGridDay.getDate() + index)
    return date
  })
  const startDate = parseDateInput(start)
  const endDate = parseDateInput(end)
  const label = start && end
    ? `${formatShortDate(start)} - ${formatShortDate(end)}`
    : start
      ? formatShortDate(start)
      : (t.selectDateRange ?? 'Select date range')

  const selectDate = (date) => {
    const value = formatDateInput(date)
    if (!start || (start && end)) {
      onChange({ start: value, end: '' })
      return
    }
    const currentStart = parseDateInput(start)
    if (date < currentStart) onChange({ start: value, end: start })
    else onChange({ start, end: value })
  }

  return (
    <div className="sales-date-range-picker" ref={rootRef}>
      <button className="sales-date-range-btn" type="button" onClick={() => setOpen((current) => !current)}>
        <CalendarDays size={16} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="sales-date-calendar">
          <div className="calendar-head">
            <button type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>‹</button>
            <strong>{monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
            <button type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="calendar-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-days">
            {days.map((date) => {
              const value = formatDateInput(date)
              const inMonth = date.getMonth() === monthDate.getMonth()
              const isStart = value === start
              const isEnd = value === end
              const selected = isStart || isEnd
              const inRange = startDate && endDate && date >= startDate && date <= endDate
              return (
                <button
                  className={`${inMonth ? '' : 'muted'} ${selected ? 'selected' : ''} ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''} ${inRange ? 'in-range' : ''}`}
                  key={value}
                  type="button"
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionMenu({ onAddPayment, onDelete, onEdit, onHistory, onMarkPaid, onPrint, onRefund, onView, sale, t }) {
  const run = (action) => {
    action(sale)
  }
  const hasLoan = Number(sale.balance || 0) > 0 || sale.paymentStatus === 'loan'
  const actions = [
    { icon: <Eye size={15} />, label: t.viewDetails, onClick: () => run(onView) },
    { icon: <ReceiptText size={15} />, label: t.printInvoice, onClick: () => run(onPrint) },
    { icon: <SquareMenu size={15} />, label: t.editBill, onClick: () => run(onEdit) },
    { icon: <History size={15} />, label: t.paymentHistory, onClick: () => run(onHistory) },
  ]

  if (hasLoan) {
    actions.push(
      { icon: <Plus size={15} />, label: t.addPayment, onClick: () => run(onAddPayment) },
      { icon: <DollarSign size={15} />, label: t.markAsPaid ?? 'Mark as paid', onClick: () => run(onMarkPaid) },
    )
  }

  actions.push(
    { className: 'refund-action', icon: <RefreshCcw size={15} />, label: t.refund, onClick: () => run(onRefund) },
    { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => run(onDelete) },
  )

  return <FloatingActionMenu ariaLabel={t.actions} className="sales-action-dropdown" width={210} actions={actions} />
}

function InvoiceDetailsModal({ onClose, onPrint, sale, t }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sales-detail-modal" onClick={(event) => event.stopPropagation()}>
        <header className="sales-modal-title">
          <h2>{t.invoice} #{sale.invoiceNumber}</h2>
          <span className={sale.paymentStatus === 'paid' ? 'status-pill active' : 'status-pill warning'}>{sale.paymentStatus === 'paid' ? t.paidStatus : t.loanStatus}</span>
        </header>
        <div className="invoice-detail-head">
          <div><span>{t.customer}</span><strong>{sale.customerName}</strong></div>
          <div><span>{t.date}</span><strong>{getGregorianLabel(sale.date)}</strong></div>
        </div>
        <h3>{t.items}</h3>
        <div className="detail-table-wrap">
          <table className="detail-table">
            <thead>
              <tr><th>{t.name}</th><th>{t.code}</th><th>{t.quantity}</th><th>{t.sellingPrice}</th><th>{t.total}</th></tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td>{item.code}</td>
                  <td>{item.quantity} {item.unit || 'pcs'}</td>
                  <td>{formatMoney(item.price, sale.currency)}</td>
                  <td><strong>{formatMoney(item.lineTotal, sale.currency)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="detail-totals">
          <div><span>{t.subtotal}</span><strong>{formatMoney(sale.subtotal, sale.currency)}</strong></div>
          <div className="grand"><span>{t.total}</span><strong>{formatMoney(sale.total, sale.currency)}</strong></div>
          <div><span>{t.paidAmount}</span><strong className="success-text">{formatMoney(sale.paidAmount, sale.currency)}</strong></div>
        </div>
        <button className="wide-print-btn" type="button" onClick={() => onPrint(sale)}><ReceiptText size={16} /> {t.printInvoice}</button>
      </div>
    </div>
  )
}

function AddPaymentModal({ onClose, onRecord, sale, t }) {
  const remaining = Math.max(0, Number(sale.balance || 0))
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const parsedAmount = Number.parseFloat(amount || 0) || 0
  const canRecord = parsedAmount > 0 && parsedAmount <= remaining

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="add-payment-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canRecord) return
          onRecord(sale, parsedAmount, notes)
        }}
      >
        <h2>{t.addPayment}</h2>
        <div className="payment-facts">
          <span>{t.invoice}:</span><strong>{sale.invoiceNumber}</strong>
          <span>{t.total}:</span><strong>{formatMoney(sale.total, sale.currency)}</strong>
          <span>{t.alreadyPaid}:</span><strong className="success-text">{formatMoney(sale.paidAmount, sale.currency)}</strong>
          <span>{t.remaining}:</span><strong className="danger-text">{formatMoney(remaining, sale.currency)}</strong>
        </div>
        <label className="sales-form-field">
          <span>{t.paymentAmount}</span>
          <input autoFocus type="number" min="0" max={remaining} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={`${t.max}: ${remaining}`} />
        </label>
        <label className="sales-form-field">
          <span>{t.notesOptional}</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.paymentReference} />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>{t.cancel}</button>
          <button className="primary-btn" type="submit" disabled={!canRecord}>{t.recordPayment}</button>
        </div>
      </form>
    </div>
  )
}

function PaymentHistoryModal({ onAddPayment, onClose, onDeletePayment, onUpdatePayment, sale, t }) {
  const payments = sale.paymentHistory || []
  const remaining = Math.max(0, Number(sale.balance || 0))
  const [editingPaymentId, setEditingPaymentId] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const startEditPayment = (payment) => {
    setEditingPaymentId(payment.id)
    setEditAmount(String(payment.amount ?? ''))
    setEditNotes(payment.notes || '')
  }

  const cancelEditPayment = () => {
    setEditingPaymentId('')
    setEditAmount('')
    setEditNotes('')
  }

  const saveEditPayment = (payment) => {
    const amount = parseNumber(editAmount)
    if (amount <= 0) return
    onUpdatePayment(sale, payment.id, { amount, notes: editNotes.trim() })
    cancelEditPayment()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="payment-history-modal" onClick={(event) => event.stopPropagation()}>
        <header className="sales-modal-title">
          <h2><DollarSign size={20} /> {t.paymentHistory} — {sale.invoiceNumber}</h2>
        </header>
        <div className="payment-summary">
          <div><span>{t.total}</span><strong>{formatMoney(sale.total, sale.currency)}</strong></div>
          <div><span>{t.paid}</span><strong className="success-text">{formatMoney(sale.paidAmount, sale.currency)}</strong></div>
          <div><span>{t.remaining}</span><strong className={remaining > 0 ? 'danger-text' : 'success-text'}>{formatMoney(remaining, sale.currency)}</strong></div>
        </div>
        <div className="history-toolbar">
          <span>{payments.length} {t.paymentEntries}</span>
          {remaining > 0 && <button className="primary-btn" type="button" onClick={() => onAddPayment(sale)}><Plus size={16} /> {t.addPayment}</button>}
        </div>
        {payments.length === 0 ? (
          <div className="payment-empty">
            <DollarSign size={46} />
            <strong>{t.noPaymentEntries}</strong>
            <span>{t.noPaymentEntriesHint}</span>
          </div>
        ) : (
          <div className="payment-list">
            {payments.map((payment) => (
              <div className="payment-row" key={payment.id}>
                {editingPaymentId === payment.id ? (
                  <div className="payment-edit-fields">
                    <input type="number" min="0" step="0.01" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} />
                    <input value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder={t.paymentReference} />
                  </div>
                ) : (
                  <div>
                    <strong>{formatMoney(payment.amount, sale.currency)}</strong>
                    <span>{payment.notes || t.paymentReference}</span>
                  </div>
                )}
                <small>{new Date(payment.createdAt).toLocaleString()}</small>
                <div className="payment-row-actions">
                  {editingPaymentId === payment.id ? (
                    <>
                      <button type="button" onClick={() => saveEditPayment(payment)}>{t.save ?? 'Save'}</button>
                      <button type="button" onClick={cancelEditPayment}>{t.cancel}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEditPayment(payment)}>{t.edit}</button>
                      <button className="danger-action" type="button" onClick={() => onDeletePayment(sale, payment.id)}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InvoicePrintPreviewModal({ companyInfo, onClose, onPrint, sale, t }) {
  const invoiceRef = useRef(null)
  const encodedSubject = encodeURIComponent(`${t.invoicePreview} ${sale.invoiceNumber}`)
  const encodedBody = encodeURIComponent(`${sale.invoiceNumber}\n${sale.customerName}`)

  return (
    <div className="modal-backdrop print-backdrop" onClick={onClose}>
      <div className="invoice-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="invoice-preview-top">
          <strong>{t.invoicePreview} — {sale.invoiceNumber}</strong>
          <div className="print-action-bar">
            <button type="button" onClick={onClose}><X size={14} /> {t.cancel}</button>
            <button type="button" onClick={() => navigator.share?.({ title: sale.invoiceNumber, text: `${sale.invoiceNumber}\n${sale.customerName}` })}><Share2 size={15} /> {t.share}</button>
            <a className="print-top-link" href={`https://wa.me/?text=${encodedSubject}%20${encodedBody}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a>
            <a className="print-top-link" href={`mailto:?subject=${encodedSubject}&body=${encodedBody}`}><Mail size={15} /> {t.email ?? 'Email'}</a>
            <button type="button" onClick={() => onPrint(sale)}><Download size={15} /> PDF</button>
            <button className="primary-btn print-confirm-btn" type="button" onClick={() => onPrint(sale)}><Printer size={15} /> {t.print}</button>
          </div>
        </div>
        <div className="invoice-scroll">
          <article className="invoice-paper" ref={invoiceRef}>
            <div className="invoice-ribbon" />
            <header className="invoice-head">
              <div className="invoice-brand">
                {companyInfo?.logo ? <img className="invoice-logo" src={companyInfo.logo} alt="" /> : <div className="invoice-logo" />}
                <div><h2>{companyInfo?.name || 'RetailPro'}</h2><p>{companyInfo?.tagline || t.retailManagement}</p></div>
              </div>
              <div className="invoice-title-box"><h1>INVOICE</h1><span>#{sale.invoiceNumber}</span></div>
            </header>
            <div className="invoice-dev">{t.invoiceDevLine}</div>
            <section className="invoice-meta">
              <span>{t.billTo}: <strong>{sale.customerName}</strong></span>
              <span>{t.status}: <strong className={sale.paymentStatus === 'paid' ? 'success-text' : 'warning-text'}>{sale.paymentStatus === 'paid' ? t.paid : t.loan}</strong></span>
              <span>{t.invoice}: <strong>{sale.invoiceNumber}</strong></span>
              <span>{t.date}: <strong>{getGregorianLabel(sale.date)}</strong> / {getShamsiShortLabel(sale.date)}</span>
              <span>{t.paymentMethod}: <strong>{t[sale.paymentMethod] ?? sale.paymentMethod}</strong></span>
              <span>{t.total}: <strong>{formatMoney(sale.total, sale.currency)}</strong></span>
            </section>
            <table className="invoice-table">
              <thead><tr><th>{t.item}</th><th>{t.code}</th><th>{t.qty}</th><th>{t.price}</th><th>{t.total}</th></tr></thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.productId}><td>{item.name}</td><td>{item.code}</td><td>{item.quantity} {item.unit}</td><td>{formatMoney(item.price, sale.currency)}</td><td><strong>{formatMoney(item.lineTotal, sale.currency)}</strong></td></tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-summary">
              <div><span>{t.subtotal}</span><strong>{formatMoney(sale.subtotal, sale.currency)}</strong></div>
              <div><span>{t.discount}</span><strong>{formatMoney(getSaleDiscountTotal(sale), sale.currency)}</strong></div>
              {parseNumber(sale.balance) > 0 && <div className="remaining-total"><span>{t.remaining}</span><strong>{formatMoney(sale.balance, sale.currency)}</strong></div>}
              <div className="grand"><span>{t.total}</span><strong>{formatMoney(sale.total, sale.currency)}</strong></div>
            </div>
            <div className="invoice-watermark">$</div>
          </article>
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ onClose, onConfirm, sale, t }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-delete-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{t.confirmDeletion}</h2>
        <p>{t.confirmDeleteInvoice?.replace('{invoice}', sale.invoiceNumber) || `Are you sure you want to delete invoice ${sale.invoiceNumber}?`}</p>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>{t.cancel}</button>
          <button className="danger-btn" type="button" onClick={onConfirm}>{t.delete}</button>
        </div>
      </div>
    </div>
  )
}

const getRefundableQty = (item) => Math.max(0, parseNumber(item.quantity) - parseNumber(item.refundedQuantity))
const getRefundableAmount = (item) => Math.max(0, parseNumber(item.lineTotal) - parseNumber(item.refundedAmount))

function RefundModal({ onClose, onConfirm, sale, t }) {
  const [mode, setMode] = useState('quantity')
  const [quantities, setQuantities] = useState({})
  const [percent, setPercent] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const refundableTotal = sale.items.reduce((sum, item) => sum + getRefundableAmount(item), 0)

  const clampQty = (item, value) => Math.min(getRefundableQty(item), Math.max(0, parseNumber(value)))
  const setLineQty = (item, value) => {
    setQuantities((current) => ({ ...current, [item.productId]: clampQty(item, value) }))
  }

  const previewLines = useMemo(() => {
    const requestedPercent = Math.min(100, Math.max(0, parseNumber(percent)))
    const requestedAmount = Math.min(refundableTotal, Math.max(0, parseNumber(amount)))
    const lines = sale.items.map((item) => {
      const refundableQty = getRefundableQty(item)
      const refundableAmount = getRefundableAmount(item)
      const originalQty = parseNumber(item.quantity)
      const unitAmount = originalQty > 0 ? parseNumber(item.lineTotal) / originalQty : 0
      let refundQty = 0
      let refundAmount = 0

      if (mode === 'quantity') {
        refundQty = clampQty(item, quantities[item.productId])
        refundAmount = refundableQty > 0 ? refundableAmount * (refundQty / refundableQty) : 0
      } else if (mode === 'percent') {
        refundQty = refundableQty * (requestedPercent / 100)
        refundAmount = refundableAmount * (requestedPercent / 100)
      } else if (refundableTotal > 0) {
        refundAmount = refundableAmount * (requestedAmount / refundableTotal)
        refundQty = unitAmount > 0 ? refundAmount / unitAmount : 0
      }

      return {
        ...item,
        refundableQty,
        refundedQty: parseNumber(item.refundedQuantity),
        refundQty: roundQty(Math.min(refundableQty, refundQty)),
        refundAmount: roundMoney(Math.min(refundableAmount, refundAmount)),
      }
    })
    const lineTotal = roundMoney(lines.reduce((sum, item) => sum + item.refundAmount, 0))
    if (mode !== 'amount' || lineTotal === requestedAmount || requestedAmount <= 0) return lines
    const adjustable = [...lines].reverse().find((item) => item.refundAmount > 0)
    if (!adjustable) return lines
    const difference = roundMoney(requestedAmount - lineTotal)
    return lines.map((item) => item.productId === adjustable.productId
      ? { ...item, refundAmount: roundMoney(item.refundAmount + difference) }
      : item)
  }, [amount, mode, percent, quantities, refundableTotal, sale.items])

  const refundTotal = roundMoney(previewLines.reduce((sum, item) => sum + item.refundAmount, 0))
  const selectedCount = previewLines.filter((item) => item.refundAmount > 0).length
  const canConfirm = refundTotal > 0 && reason.trim().length > 0

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="refund-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canConfirm) return
          onConfirm(sale, {
            amount: refundTotal,
            mode,
            reason: reason.trim(),
            items: previewLines.filter((item) => item.refundAmount > 0),
            requestedAmount: parseNumber(amount),
            requestedPercent: parseNumber(percent),
          })
        }}
      >
        <header className="sales-modal-title">
          <h2><RefreshCcw size={20} /> {t.processRefund} — {sale.invoiceNumber}</h2>
        </header>
        <div className="refund-headline">
          <span>{sale.customerName}</span>
          <span>{t.total}: {formatMoney(sale.total, sale.currency)}</span>
        </div>
        <section className="refund-mode-panel">
          <div className="refund-mode-tabs">
            <span>{t.refundMode}:</span>
            <button className={mode === 'quantity' ? 'active' : ''} type="button" onClick={() => setMode('quantity')}>{t.byQuantity}</button>
            <button className={mode === 'percent' ? 'active' : ''} type="button" onClick={() => setMode('percent')}>{t.byPercent}</button>
            <button className={mode === 'amount' ? 'active' : ''} type="button" onClick={() => setMode('amount')}>{t.byAmount}</button>
          </div>
          {mode === 'percent' && (
            <div className="refund-mode-input">
              <input autoFocus type="number" min="0" max="100" step="0.01" value={percent} onChange={(event) => setPercent(event.target.value)} placeholder="0" />
              <span>{t.percentOfRefundable}</span>
            </div>
          )}
          {mode === 'amount' && (
            <div className="refund-mode-input">
              <input autoFocus type="number" min="0" max={refundableTotal} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
              <span>{sale.currency} · {t.distributedProRata}</span>
            </div>
          )}
        </section>
        <div className="refund-table-wrap">
          <table className="refund-table">
            <thead>
              <tr><th>{t.name}</th><th>{t.originalQty}</th><th>{t.refunded}</th><th>{t.refundQty}</th><th>{t.refundAmount}</th></tr>
            </thead>
            <tbody>
              {previewLines.map((item) => (
                <tr key={item.productId}>
                  <td><strong>{item.name}</strong><span>{item.code}</span></td>
                  <td>{item.quantity} {item.unit || 'pcs'}</td>
                  <td>{item.refundedQty > 0 ? `${item.refundedQty} ${item.unit || 'pcs'}` : '—'}</td>
                  <td>
                    <div className="refund-qty-control">
                      <button type="button" disabled={mode !== 'quantity'} onClick={() => setLineQty(item, parseNumber(quantities[item.productId]) - 1)}>−</button>
                      <input
                        disabled={mode !== 'quantity'}
                        type="number"
                        min="0"
                        max={item.refundableQty}
                        step="0.01"
                        value={mode === 'quantity' ? (quantities[item.productId] ?? 0) : item.refundQty}
                        onChange={(event) => setLineQty(item, event.target.value)}
                      />
                      <button type="button" disabled={mode !== 'quantity'} onClick={() => setLineQty(item, parseNumber(quantities[item.productId]) + 1)}>+</button>
                    </div>
                  </td>
                  <td><strong>{item.refundAmount > 0 ? formatMoney(item.refundAmount, sale.currency) : '—'}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="sales-form-field">
          <span>{t.refundReason} *</span>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t.refundReasonPlaceholder} />
        </label>
        {refundTotal > 0 && (
          <div className="refund-total-card">
            <div>
              <strong>{t.totalRefundAmount}</strong>
              <span>{selectedCount} {t.itemsSelected}</span>
            </div>
            <strong>{formatMoney(refundTotal, sale.currency)}</strong>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>{t.cancel}</button>
          <button className="refund-confirm-btn" type="submit" disabled={!canConfirm}><RefreshCcw size={16} /> {t.confirmRefund}</button>
        </div>
      </form>
    </div>
  )
}

function SalesBillsPage({ companyInfo, onEditBill, onNotify, onProductsChange, onSalesChange, printSettings, sales, t }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [detailsSale, setDetailsSale] = useState(null)
  const [historySale, setHistorySale] = useState(null)
  const [previewSale, setPreviewSale] = useState(null)
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false)
  const [addPaymentSale, setAddPaymentSale] = useState(null)
  const [deleteSale, setDeleteSale] = useState(null)
  const [refundSale, setRefundSale] = useState(null)

  const filteredSales = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dateFromRange = {
      start: customStartDate ? new Date(`${customStartDate}T00:00:00`) : null,
      end: customEndDate ? new Date(`${customEndDate}T23:59:59`) : null,
    }
    return sales.filter((sale) => {
      const matchesQuery = !needle
        || sale.invoiceNumber.toLowerCase().includes(needle)
        || sale.customerName.toLowerCase().includes(needle)
        || sale.items.some((item) => [item.name, item.code].some((value) => String(value || '').toLowerCase().includes(needle)))
        || String(sale.total).includes(needle)
        || sale.date.includes(needle)
      const isRefunded = (sale.refundHistory || []).length > 0
      const isLoan = Number(sale.balance || 0) > 0 || sale.paymentStatus === 'loan'
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'paid' && sale.paymentStatus === 'paid')
        || (statusFilter === 'pending' && isLoan)
        || (statusFilter === 'credit' && isLoan)
        || (statusFilter === 'refunded' && isRefunded)
      const saleDate = new Date(`${sale.date}T12:00:00`)
      const daysOld = Math.floor((now - new Date(saleDate.toDateString())) / 86400000)
      const matchesDate = dateFilter === 'all'
        || (dateFilter === 'today' && sale.date === now.toISOString().slice(0, 10))
        || (dateFilter === 'weekly' && daysOld <= 7)
        || (dateFilter === 'monthly' && daysOld <= 31)
        || (dateFilter === 'annual' && daysOld <= 366)
        || (dateFilter === 'custom' && (!dateFromRange.start || saleDate >= dateFromRange.start) && (!dateFromRange.end || saleDate <= dateFromRange.end))
      return matchesQuery && matchesStatus && matchesDate
    })
  }, [customEndDate, customStartDate, dateFilter, query, sales, statusFilter])

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPaid = filteredSales.reduce((sum, sale) => sum + sale.paidAmount, 0)
  const totalPending = filteredSales.reduce((sum, sale) => sum + sale.balance, 0)
  const totalDiscount = filteredSales.reduce((sum, sale) => sum + getSaleDiscountTotal(sale), 0)
  const displayCurrency = filteredSales[0]?.currency || sales[0]?.currency || 'AFN'
  const statusOptions = useMemo(() => [
    { value: 'all', label: t.allStatuses },
    { value: 'paid', label: t.paidStatus ?? t.paid },
    { value: 'pending', label: t.pendingStatus ?? t.pending },
    { value: 'credit', label: t.onCredit ?? 'ON CREDIT' },
    { value: 'refunded', label: t.refundedStatus ?? t.refunded },
  ], [t.allStatuses, t.onCredit, t.paid, t.paidStatus, t.pending, t.pendingStatus, t.refunded, t.refundedStatus])
  const dateOptions = useMemo(() => [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ], [t.allTime, t.annual, t.custom, t.monthly, t.today, t.weekly])

  const reportRows = useMemo(() => filteredSales.map((sale) => ({
    ...sale,
    itemsCount: sale.items.length,
    discountFormatted: formatMoney(getSaleDiscountTotal(sale), sale.currency),
    totalFormatted: formatMoney(sale.total, sale.currency),
    paidFormatted: formatMoney(sale.paidAmount, sale.currency),
    statusLabel: sale.paymentStatus === 'paid' ? t.paidStatus : t.loanStatus,
    dateLabel: getGregorianLabel(sale.date),
  })), [filteredSales, t.loanStatus, t.paidStatus])

  const handlePrintInvoice = (sale) => printInvoice(sale, companyInfo, t)

  const recordPayment = (sale, amount, notes) => {
    const payment = {
      id: crypto.randomUUID(),
      amount,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    }
    onSalesChange((current) => current.map((item) => {
      if (item.id !== sale.id) return item
      const nextPaid = Math.min(Number(item.total || 0), Number(item.paidAmount || 0) + amount)
      const nextBalance = Math.max(0, Number(item.total || 0) - nextPaid)
      return {
        ...item,
        paidAmount: nextPaid,
        balance: nextBalance,
        paymentStatus: nextBalance <= 0 ? 'paid' : 'loan',
        paymentHistory: [...(item.paymentHistory || []), payment],
      }
    }))
    setHistorySale((current) => current && current.id === sale.id
      ? {
        ...current,
        paidAmount: Math.min(Number(current.total || 0), Number(current.paidAmount || 0) + amount),
        balance: Math.max(0, Number(current.total || 0) - Math.min(Number(current.total || 0), Number(current.paidAmount || 0) + amount)),
        paymentStatus: Math.max(0, Number(current.total || 0) - Math.min(Number(current.total || 0), Number(current.paidAmount || 0) + amount)) <= 0 ? 'paid' : 'loan',
        paymentHistory: [...(current.paymentHistory || []), payment],
      }
      : current)
    setAddPaymentSale(null)
    onNotify?.(t.paymentRecorded)
  }

  const applyPaymentHistory = (sale, nextHistory) => {
    const currentHistoryTotal = (sale.paymentHistory || []).reduce((sum, payment) => sum + parseNumber(payment.amount), 0)
    const basePaid = Math.max(0, parseNumber(sale.paidAmount) - currentHistoryTotal)
    const nextHistoryTotal = nextHistory.reduce((sum, payment) => sum + parseNumber(payment.amount), 0)
    const nextPaid = roundMoney(Math.min(parseNumber(sale.total), basePaid + nextHistoryTotal))
    const nextBalance = roundMoney(Math.max(0, parseNumber(sale.total) - nextPaid))
    return {
      ...sale,
      paidAmount: nextPaid,
      balance: nextBalance,
      paymentStatus: nextBalance <= 0 ? 'paid' : 'loan',
      paymentHistory: nextHistory,
      updatedAt: new Date().toISOString(),
    }
  }

  const updatePayment = (sale, paymentId, patch) => {
    let nextSale = null
    onSalesChange((current) => current.map((item) => {
      if (item.id !== sale.id) return item
      const nextHistory = (item.paymentHistory || []).map((payment) => payment.id === paymentId
        ? { ...payment, amount: parseNumber(patch.amount), notes: patch.notes, updatedAt: new Date().toISOString() }
        : payment)
      nextSale = applyPaymentHistory(item, nextHistory)
      return nextSale
    }))
    setHistorySale((current) => current && current.id === sale.id ? applyPaymentHistory(current, (current.paymentHistory || []).map((payment) => payment.id === paymentId
      ? { ...payment, amount: parseNumber(patch.amount), notes: patch.notes, updatedAt: new Date().toISOString() }
      : payment)) : current)
    if (previewSale?.id === sale.id && nextSale) setPreviewSale(nextSale)
    onNotify?.(t.savedSuccessfully)
  }

  const deletePayment = (sale, paymentId) => {
    let nextSale = null
    onSalesChange((current) => current.map((item) => {
      if (item.id !== sale.id) return item
      const nextHistory = (item.paymentHistory || []).filter((payment) => payment.id !== paymentId)
      nextSale = applyPaymentHistory(item, nextHistory)
      return nextSale
    }))
    setHistorySale((current) => current && current.id === sale.id ? applyPaymentHistory(current, (current.paymentHistory || []).filter((payment) => payment.id !== paymentId)) : current)
    if (previewSale?.id === sale.id && nextSale) setPreviewSale(nextSale)
    onNotify?.(t.deletedSuccessfully ?? t.deleted)
  }

  const markSalePaid = (sale) => {
    const remaining = Math.max(0, Number(sale.balance || 0))
    if (remaining <= 0) return
    recordPayment(sale, remaining, t.markAsPaid ?? 'Mark as paid')
  }

  const confirmDelete = () => {
    if (!deleteSale) return
    onSalesChange((current) => current.filter((sale) => sale.id !== deleteSale.id))
    onNotify?.(t.invoiceDeleted)
    setDeleteSale(null)
  }

  const processRefund = (sale, refund) => {
    const refundEntry = {
      id: crypto.randomUUID(),
      amount: refund.amount,
      mode: refund.mode,
      reason: refund.reason,
      requestedAmount: refund.requestedAmount,
      requestedPercent: refund.requestedPercent,
      createdAt: new Date().toISOString(),
      items: refund.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        code: item.code,
        quantity: item.refundQty,
        amount: item.refundAmount,
      })),
    }

    onSalesChange((current) => current.map((item) => {
      if (item.id !== sale.id) return item
      const nextTotal = roundMoney(Math.max(0, parseNumber(item.total) - refund.amount))
      const nextPaid = roundMoney(Math.min(parseNumber(item.paidAmount), nextTotal))
      const nextBalance = roundMoney(Math.max(0, nextTotal - nextPaid))
      return {
        ...item,
        items: item.items.map((line) => {
          const refundedLine = refund.items.find((refundItem) => refundItem.productId === line.productId)
          if (!refundedLine) return line
          return {
            ...line,
            refundedAmount: roundMoney(parseNumber(line.refundedAmount) + refundedLine.refundAmount),
            refundedQuantity: roundQty(parseNumber(line.refundedQuantity) + refundedLine.refundQty),
          }
        }),
        total: nextTotal,
        paidAmount: nextPaid,
        balance: nextBalance,
        paymentStatus: nextBalance <= 0 ? 'paid' : 'loan',
        refundHistory: [...(item.refundHistory || []), refundEntry],
        updatedAt: new Date().toISOString(),
      }
    }))

    onProductsChange?.((current) => current.map((product) => {
      const refundedLine = refund.items.find((item) => item.productId === product.id)
      if (!refundedLine) return product
      const nextQuantity = roundQty(parseNumber(product.quantity) + refundedLine.refundQty)
      return { ...product, quantity: String(nextQuantity), status: nextQuantity > 0 ? 'In Stock' : product.status }
    }))

    setRefundSale(null)
    onNotify?.(t.refundProcessed)
  }

  return (
    <div className="sales-content">
      <div className="entity-heading">
        <div><h1>{t.salesManagement}</h1><p>{t.salesSubtitle}</p></div>
        <div className="entity-actions sales-page-actions">
  <button
    className="app-print-action-btn sales-print-report-btn"
    type="button"
    onClick={() => setReportPreviewOpen(true)}
  >
    <Printer size={16} />
    <span>{t.printReport}</span>
  </button>
</div>
      </div>

      <div className="sales-summary-grid">
        <article className="tone-blue"><span>{t.totalSales}</span><strong>{formatMoney(totalSales, displayCurrency)}</strong><ShoppingCart size={22} /></article>
        <article className="tone-green"><span>{t.totalPaid}</span><strong>{formatMoney(totalPaid, displayCurrency)}</strong><WalletCards size={22} /></article>
        <article className="tone-orange"><span>{t.totalPending}</span><strong>{formatMoney(totalPending, displayCurrency)}</strong><CalendarDays size={22} /></article>
        <article className="tone-red"><span>{t.totalDiscounts}</span><strong>{formatMoney(totalDiscount, displayCurrency)}</strong><CreditCard size={22} /></article>
      </div>

      <div className="sales-filter-card">
        <div className="sales-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchSalesPlaceholder} />
        </div>
        <CustomSelect ariaLabel={t.status} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <CustomSelect ariaLabel={t.date} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
        {dateFilter === 'custom' && (
          <SalesDateRangePicker
            end={customEndDate}
            onChange={({ end: nextEnd, start: nextStart }) => {
              setCustomStartDate(nextStart)
              setCustomEndDate(nextEnd)
            }}
            start={customStartDate}
            t={t}
          />
        )}
      </div>

      <div className="data-panel sales-table-panel">
        <h2><ShoppingCart size={19} /> {t.sales} ({filteredSales.length})</h2>
        <table className="data-table sales-table">
          <thead>
            <tr><th>{t.invoice}</th><th>{t.customer}</th><th>{t.items}</th><th>{t.total}</th><th>{t.discount}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.status}</th><th>{t.date}</th><th>{t.actions}</th></tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr><td colSpan="10" className="empty-cell">{t.noSalesFound}</td></tr>
            ) : filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td className="mono-cell">{sale.invoiceNumber}</td>
                <td>{sale.customerName}</td>
                <td>{sale.items.length}</td>
                <td><strong>{formatMoney(sale.total, sale.currency)}</strong></td>
                <td>{formatMoney(getSaleDiscountTotal(sale), sale.currency)}</td>
                <td>{formatMoney(sale.paidAmount, sale.currency)}</td>
                <td className={parseNumber(sale.balance) > 0 ? 'danger-text' : 'success-text'}>{formatMoney(sale.balance, sale.currency)}</td>
                <td><span className={sale.paymentStatus === 'paid' ? 'status-pill active' : 'status-pill warning'}>{sale.paymentStatus === 'paid' ? t.paidStatus : t.loanStatus}</span></td>
                <td><span className="stacked-cell">{getGregorianLabel(sale.date)}<small>{getShamsiShortLabel(sale.date)}</small></span></td>
                <td>
                  <ActionMenu
                    onAddPayment={setAddPaymentSale}
                    onDelete={setDeleteSale}
                    onEdit={onEditBill}
                    onHistory={setHistorySale}
                    onMarkPaid={markSalePaid}
                    onPrint={setPreviewSale}
                    onRefund={setRefundSale}
                    onView={setDetailsSale}
                    sale={sale}
                    t={t}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detailsSale && <InvoiceDetailsModal onClose={() => setDetailsSale(null)} onPrint={setPreviewSale} sale={detailsSale} t={t} />}
      {historySale && <PaymentHistoryModal onAddPayment={setAddPaymentSale} onClose={() => setHistorySale(null)} onDeletePayment={deletePayment} onUpdatePayment={updatePayment} sale={historySale} t={t} />}
      {previewSale && <InvoicePrintPreviewModal companyInfo={companyInfo} onClose={() => setPreviewSale(null)} onPrint={handlePrintInvoice} sale={previewSale} t={t} />}
      {reportPreviewOpen && (
        <PrintPreviewModal
          companyInfo={companyInfo}
          columns={[
            { key: 'invoiceNumber', label: t.invoice },
            { key: 'customerName', label: t.customer },
            { key: 'itemsCount', label: t.items },
            { key: 'totalFormatted', label: t.total },
            { key: 'discountFormatted', label: t.discount },
            { key: 'paidFormatted', label: t.paid },
            { key: 'statusLabel', label: t.status },
            { key: 'dateLabel', label: t.date },
          ]}
          onClose={() => setReportPreviewOpen(false)}
          printSettings={printSettings}
          rows={reportRows}
          t={t}
          title={t.salesManagement}
        />
      )}
      {addPaymentSale && <AddPaymentModal onClose={() => setAddPaymentSale(null)} onRecord={recordPayment} sale={addPaymentSale} t={t} />}
      {deleteSale && <ConfirmDeleteModal onClose={() => setDeleteSale(null)} onConfirm={confirmDelete} sale={deleteSale} t={t} />}
      {refundSale && <RefundModal onClose={() => setRefundSale(null)} onConfirm={processRefund} sale={refundSale} t={t} />}
    </div>
  )
}

export default SalesBillsPage
