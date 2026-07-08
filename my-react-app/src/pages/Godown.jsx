import { Fragment, useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import {
  Archive,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  Plus,
  ReceiptText,
  Search,
  SquareMenu,
  Trash2,
  Upload,
  WalletCards,
} from '../components/Icons.jsx'
import './Godown.css'

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const formatMoney = (value) => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ؋`
const formatCurrencyMoney = (value, currency = 'AFN') => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency === 'EUR' ? '€' : '؋'}`
const todayInput = () => new Date().toISOString().slice(0, 10)
const parseDateInput = (value) => (value ? new Date(`${value}T12:00:00`) : null)

const getDateMatches = (dateValue, filter, start, end) => {
  if (filter === 'all' || !dateValue) return true
  const date = parseDateInput(String(dateValue).slice(0, 10))
  if (!date) return true
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const daysOld = Math.floor((now - target) / 86400000)
  if (filter === 'today') return daysOld === 0
  if (filter === 'weekly') return daysOld >= 0 && daysOld <= 7
  if (filter === 'monthly') return daysOld >= 0 && daysOld <= 31
  if (filter === 'annual') return daysOld >= 0 && daysOld <= 366
  if (filter === 'custom') {
    const startDate = parseDateInput(start)
    const endDate = end ? new Date(`${end}T23:59:59`) : null
    return (!startDate || date >= startDate) && (!endDate || date <= endDate)
  }
  return true
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

const newLine = () => ({
  id: crypto.randomUUID(),
  productId: '',
  name: '',
  code: '',
  quantity: '1',
  unit: 'pcs',
  purchase: '',
  selling: '',
  category: '',
  date: todayInput(),
  lowStockThreshold: '',
  expiryDate: '',
  alertDaysBefore: '',
  supplierId: '',
  notes: '',
})

export function AdjustmentModal({ currencies, onClose, onSave, supplierName, t }) {
  const [type, setType] = useState('debit')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [currency, setCurrency] = useState('AFN')
  const [rate, setRate] = useState('1')
  const [linkWallet, setLinkWallet] = useState(false)
  const typeOptions = [
    { value: 'debit', label: t.adjustmentDebit ?? 'Debit - You took / received from supplier' },
    { value: 'credit', label: t.adjustmentCredit ?? 'Credit - You gave / paid to supplier' },
  ]
  const currencyOptions = currencies.map((item) => ({ value: item, label: item }))
  const canSave = parseNumber(amount) > 0 && reason.trim()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="godown-adjustment-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canSave) return
          onSave({ amount: parseNumber(amount), currency, linkWallet, rate: parseNumber(rate) || 1, reason: reason.trim(), type })
        }}
      >
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <h2>{t.addAdjustment ?? 'Add Adjustment'}</h2>
        <p>{(t.adjustmentHint ?? 'Record a manual change to the supplier balance.').replace('{name}', supplierName)}</p>
        <label className="wide">
          <span>{t.adjustmentType ?? 'Adjustment Type'} *</span>
          <CustomSelect ariaLabel={t.adjustmentType ?? 'Adjustment Type'} options={typeOptions} value={type} onChange={setType} />
        </label>
        <small className="wide">{type === 'debit' ? (t.adjustmentDebitHint ?? 'Increases payable. Use when you took cash or goods back from the supplier.') : (t.adjustmentCreditHint ?? 'Decreases payable. Use when you paid or gave cash to the supplier.')}</small>
        <label className="wide"><span>{t.amount} *</span><input inputMode="decimal" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="wide"><span>{t.reason ?? 'Reason'} *</span><input placeholder={t.reasonForAdjustment ?? 'Reason for adjustment'} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <label><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={currency} onChange={setCurrency} /></label>
        <label><span>{t.exchangeRate ?? 'Exchange Rate'}</span><input inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} /></label>
        <button className={`wallet-link-toggle ${linkWallet ? 'on' : ''}`} type="button" onClick={() => setLinkWallet((current) => !current)}>
          <span><WalletCards size={17} /> {t.linkToCashWallet ?? 'Link to Total Revenue (Cash Wallet)'}</span>
          <i />
          <small>{linkWallet ? (t.linked ?? 'Linked') : (t.off ?? 'Off')}</small>
        </button>
        <footer className="modal-actions wide">
          <button type="button" onClick={onClose}>{t.cancel}</button>
          <button className="primary-btn" type="submit" disabled={!canSave}>{t.saveChanges}</button>
        </footer>
      </form>
    </div>
  )
}

export function SupplierStatementModal({ columns, companyInfo, onClose, rows, subtitle, title, t }) {
  const openPrintable = () => {
    const preview = document.querySelector('.supplier-statement-paper')?.outerHTML
    if (!preview) return
    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) return
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; background: #fff; font-family: Arial, sans-serif; color: #0f172a; }
            .supplier-statement-paper { width: 794px; margin: 0 auto; padding: 28px; background: #fff; }
            .statement-brand { display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 18px; background: #142247; color: #fff; border-radius: 8px; }
            .statement-brand img { width: 82px; height: 54px; object-fit: cover; border-radius: 6px; }
            .statement-brand-left { display: flex; gap: 14px; align-items: center; }
            .statement-brand h3, .statement-brand p { margin: 0; }
            .statement-title { border: 1px solid rgba(255,255,255,.35); border-radius: 6px; padding: 10px 16px; text-align: end; font-weight: 800; }
            .statement-title small { display: block; margin-top: 8px; font-weight: 500; opacity: .85; }
            .statement-account { display: flex; justify-content: space-between; gap: 16px; margin: 14px 0; padding: 14px; border: 1px solid #dbe3ef; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #142247; color: #fff; }
            th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: start; font-size: 12px; }
            .empty { padding: 28px; text-align: center; color: #64748b; }
            @media print { .supplier-statement-paper { width: 100%; margin: 0; } }
          </style>
        </head>
        <body>${preview}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="supplier-statement-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <div>
            <button type="button" onClick={openPrintable}><Download size={16} /> {t.download ?? 'Download'}</button>
            <button className="primary-btn" type="button" onClick={openPrintable}><ReceiptText size={16} /> {t.print}</button>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>×</button>
        </header>
        <section className="supplier-statement-paper">
          <div className="statement-brand">
            <div className="statement-brand-left">
              {companyInfo.logo && <img src={companyInfo.logo} alt="" />}
              <div><h3>{companyInfo.name}</h3><p>{companyInfo.tagline}</p></div>
            </div>
            <div className="statement-title">{title}<small>{new Date().toLocaleDateString()}</small></div>
          </div>
          <div className="statement-account"><strong>{subtitle}</strong><span>{rows.length} {t.totalRecords}</span></div>
          <table>
            <thead><tr><th>#</th>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td className="empty" colSpan={columns.length + 1}>{t.noRecordsFound ?? 'No records found'}</td></tr> : rows.map((row, index) => (
                <tr key={row.id || index}><td>{index + 1}</td>{columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function PurchaseModal({ categories, onClose, onSave, products, suppliers, t }) {
  const [supplierId, setSupplierId] = useState('')
  const [currency, setCurrency] = useState('AFN')
  const [date, setDate] = useState(todayInput())
  const [paid, setPaid] = useState('')
  const [rows, setRows] = useState([newLine()])
  const [submitted, setSubmitted] = useState(false)
  const [closing, setClosing] = useState(false)

  const productOptions = useMemo(() => [
    { value: '', label: t.newProduct },
    ...products.map((product) => ({ value: product.id, label: `${product.name || t.product} ${product.code ? `(${product.code})` : ''}` })),
  ], [products, t.newProduct, t.product])
  const supplierOptions = useMemo(() => [
    { value: '', label: t.selectSupplier },
    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  ], [suppliers, t.selectSupplier])
  const categoryOptions = useMemo(() => [
    { value: '', label: t.category },
    ...categories.map((category) => ({ value: category, label: category })),
  ], [categories, t.category])
  const unitOptions = ['pcs', 'kg', 'box', 'pack', 'meter', 'liter'].map((unit) => ({ value: unit, label: unit }))
  const currencyOptions = ['AFN', 'USD', 'EUR', 'PKR'].map((item) => ({ value: item, label: item }))
  const total = rows.reduce((sum, row) => sum + parseNumber(row.quantity) * parseNumber(row.purchase), 0)
  const remaining = Math.max(0, total - parseNumber(paid))

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }

  const updateRow = (id, patch) => {
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row
      const next = { ...row, ...patch }
      if (patch.productId !== undefined) {
        const product = products.find((item) => item.id === patch.productId)
        if (product) {
          return {
            ...next,
            name: product.name || '',
            code: product.code || '',
            unit: product.unit || 'pcs',
            purchase: product.purchase || '',
            selling: product.selling || '',
            category: product.category || '',
            lowStockThreshold: product.lowStockThreshold || product.lowStock || '',
            expiryDate: product.expiryDate || '',
            alertDaysBefore: product.alertDaysBefore || product.daysBefore || '',
            supplierId: product.supplierId || supplierId,
          }
        }
      }
      return next
    }))
  }

  const removeRow = (id) => setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id))
  const addRow = () => setRows((current) => [...current, { ...newLine(), supplierId, date }])

  const submit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    const validRows = rows
      .map((row) => ({
        ...row,
        supplierId: row.supplierId || supplierId,
        date: row.date || date,
      }))
      .filter((row) => row.name.trim() && parseNumber(row.quantity) > 0)
    if (!validRows.length) return
    onSave({
      id: crypto.randomUUID(),
      currency,
      date,
      paid: parseNumber(paid),
      remaining,
      supplierId,
      total,
      rows: validRows,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <form className="godown-purchase-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <header className="godown-modal-head">
          <Plus size={18} />
          <h2>{t.multiProductPurchaseBill}</h2>
        </header>

        <section className="purchase-meta-grid">
          <label><span>{t.supplier}</span><CustomSelect ariaLabel={t.supplier} options={supplierOptions} value={supplierId} onChange={setSupplierId} /></label>
          <label><span>{t.date}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={currency} onChange={setCurrency} /></label>
        </section>

        <section className="purchase-lines">
          <div className="purchase-line purchase-line-head">
            <span>{t.product}</span>
            <span>{t.code}</span>
            <span>{t.qty}</span>
            <span>{t.unit}</span>
            <span>{t.purchase}</span>
            <span>{t.selling}</span>
            <span>{t.date}</span>
            <span>{t.action}</span>
          </div>
          {rows.map((row) => (
            <div className="purchase-line" key={row.id}>
              <div className="product-pick">
                <CustomSelect ariaLabel={t.product} options={productOptions} value={row.productId} onChange={(value) => updateRow(row.id, { productId: value })} />
                <input className={submitted && !row.name.trim() ? 'field-invalid' : ''} placeholder={t.newProductName} value={row.name} onChange={(event) => updateRow(row.id, { name: event.target.value })} />
              </div>
              <input placeholder={t.code} value={row.code} onChange={(event) => updateRow(row.id, { code: event.target.value })} />
              <input type="number" min="0" placeholder="0" value={row.quantity} onChange={(event) => updateRow(row.id, { quantity: event.target.value })} />
              <CustomSelect ariaLabel={t.unit} options={unitOptions} value={row.unit} onChange={(value) => updateRow(row.id, { unit: value })} />
              <input type="number" min="0" placeholder="0.00" value={row.purchase} onChange={(event) => updateRow(row.id, { purchase: event.target.value })} />
              <input type="number" min="0" placeholder="0.00" value={row.selling} onChange={(event) => updateRow(row.id, { selling: event.target.value })} />
              <input type="date" value={row.date} onChange={(event) => updateRow(row.id, { date: event.target.value })} />
              <button className="line-delete" type="button" onClick={() => removeRow(row.id)} aria-label={t.delete}><Trash2 size={15} /></button>
              <CustomSelect ariaLabel={t.category} className="line-category" options={categoryOptions} value={row.category} onChange={(value) => updateRow(row.id, { category: value })} />
              <textarea className="line-notes" placeholder={t.descriptionOptional} value={row.notes} onChange={(event) => updateRow(row.id, { notes: event.target.value })} />
              <span className="line-alert-caption">{t.alertsOptional ?? 'Alerts (optional)'}</span>
              <input className="line-alert-threshold" type="number" min="0" placeholder={t.lowStockThreshold ?? 'Low-stock threshold'} value={row.lowStockThreshold || ''} onChange={(event) => updateRow(row.id, { lowStockThreshold: event.target.value })} />
              <input className="line-alert-date" type="date" value={row.expiryDate || ''} onChange={(event) => updateRow(row.id, { expiryDate: event.target.value })} />
              <input className="line-alert-days" type="number" min="0" placeholder={t.daysBefore ?? 'Days before'} value={row.alertDaysBefore || ''} onChange={(event) => updateRow(row.id, { alertDaysBefore: event.target.value })} />
            </div>
          ))}
          <button className="add-line-btn" type="button" onClick={addRow}><Plus size={15} /> {t.addRow}</button>
        </section>

        <section className="purchase-payment">
          <div><span>{rows.length} {t.rows}</span><strong>{t.grandTotal}: {formatMoney(total)}</strong></div>
          <label><span>{t.paidNow}</span><input type="number" min="0" value={paid} onChange={(event) => setPaid(event.target.value)} placeholder="0" /></label>
          <label><span>{t.remaining}</span><input readOnly value={formatMoney(remaining)} /></label>
        </section>

        <footer className="modal-actions">
          <button type="button" onClick={requestClose}>{t.cancel}</button>
          <button className="primary-btn" type="submit">{t.savePurchase}</button>
        </footer>
      </form>
    </div>
  )
}

function PaymentModal({ entry, onClose, onSave, t }) {
  const maxAmount = Math.max(0, parseNumber(entry.remaining))
  const [amount, setAmount] = useState(String(maxAmount || ''))
  const [currency, setCurrency] = useState(entry.currency || 'AFN')
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const parsedAmount = parseNumber(amount)
  const invalid = parsedAmount <= 0 || parsedAmount > maxAmount
  const currencyOptions = ['AFN', 'EUR', 'USD'].map((item) => ({ value: item, label: item }))
  const methodOptions = ['cash', 'bankTransfer', 'onlinePayment'].map((item) => ({ value: item, label: t[item] ?? item }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="godown-small-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (!invalid) onSave({ amount: parsedAmount, currency, method, reference }) }}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <h2>{t.makePaymentForBill ?? 'Make Payment'} {entry.billNumber}</h2>
        <label className="wide"><span>{t.amount} * <small>({t.max}: {formatCurrencyMoney(maxAmount, entry.currency)})</small></span><input className={invalid ? 'field-invalid' : ''} type="number" min="0" max={maxAmount} value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={currency} onChange={setCurrency} /></label>
        <label><span>{t.exchangeRate ?? 'Exchange Rate'}</span><input defaultValue="1" /></label>
        <label className="wide"><span>{t.paymentMethod}</span><CustomSelect ariaLabel={t.paymentMethod} options={methodOptions} value={method} onChange={setMethod} /></label>
        <label className="wide"><span>{t.referenceNo ?? 'Reference No'}</span><input placeholder={t.optionalReference ?? 'Optional reference'} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
        {invalid && <small className="danger-text">{t.paymentAmountInvalid ?? 'Payment amount is invalid.'}</small>}
        <footer className="modal-actions"><button type="button" onClick={onClose}>{t.cancel}</button><button className="primary-btn" type="submit">{t.saveChanges}</button></footer>
      </form>
    </div>
  )
}

function ConfirmDeleteModal({ entry, onClose, onConfirm, t }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="godown-confirm-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{t.confirmDeletion ?? 'Confirm Deletion'}</h2>
        <p>{t.confirmDeleteImport ?? 'Are you sure you want to delete this Import entry?'}</p>
        <footer className="modal-actions"><button type="button" onClick={onClose}>{t.cancel}</button><button className="danger-btn" type="button" onClick={() => onConfirm(entry)}>{t.delete}</button></footer>
      </div>
    </div>
  )
}

function EditEntryModal({ categories, entry, onClose, onSave, suppliers, t }) {
  const [form, setForm] = useState({ ...entry })
  const supplierOptions = [{ value: '', label: t.selectSupplier }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]
  const categoryOptions = [{ value: '', label: t.category }, ...categories.map((category) => ({ value: category, label: category }))]
  const unitOptions = ['pcs', 'kg', 'box', 'pack', 'meter', 'liter'].map((unit) => ({ value: unit, label: unit }))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="godown-purchase-modal edit-godown-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSave(form) }}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <header className="godown-modal-head"><Plus size={18} /><h2>{t.editPurchaseBill ?? 'Edit Purchase Bill'}</h2></header>
        <section className="purchase-meta-grid">
          <label><span>{t.supplier}</span><CustomSelect ariaLabel={t.supplier} options={supplierOptions} value={form.supplierId || ''} onChange={(value) => update('supplierId', value)} /></label>
          <label><span>{t.date}</span><input type="date" value={form.date || todayInput()} onChange={(event) => update('date', event.target.value)} /></label>
          <label><span>{t.currency}</span><input value={form.currency || 'AFN'} onChange={(event) => update('currency', event.target.value)} /></label>
        </section>
        <section className="purchase-lines">
          <div className="purchase-line edit-line">
            <input placeholder={t.product} value={form.name || ''} onChange={(event) => update('name', event.target.value)} />
            <input placeholder={t.code} value={form.code || ''} onChange={(event) => update('code', event.target.value)} />
            <input type="number" min="0" value={form.quantity || ''} onChange={(event) => update('quantity', event.target.value)} />
            <CustomSelect ariaLabel={t.unit} options={unitOptions} value={form.unit || 'pcs'} onChange={(value) => update('unit', value)} />
            <input type="number" min="0" value={form.purchase || ''} onChange={(event) => update('purchase', event.target.value)} />
            <input type="number" min="0" value={form.selling || ''} onChange={(event) => update('selling', event.target.value)} />
            <CustomSelect ariaLabel={t.category} className="line-category" options={categoryOptions} value={form.category || ''} onChange={(value) => update('category', value)} />
            <textarea className="line-notes" placeholder={t.descriptionOptional} value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} />
            <span className="line-alert-caption">{t.alertsOptional ?? 'Alerts (optional)'}</span>
            <input className="line-alert-threshold" type="number" min="0" placeholder={t.lowStockThreshold ?? 'Low-stock threshold'} value={form.lowStockThreshold || ''} onChange={(event) => update('lowStockThreshold', event.target.value)} />
            <input className="line-alert-date" type="date" value={form.expiryDate || ''} onChange={(event) => update('expiryDate', event.target.value)} />
            <input className="line-alert-days" type="number" min="0" placeholder={t.daysBefore ?? 'Days before'} value={form.alertDaysBefore || ''} onChange={(event) => update('alertDaysBefore', event.target.value)} />
          </div>
        </section>
        <section className="purchase-payment"><div><span>1 {t.rows}</span><strong>{t.grandTotal}: {formatCurrencyMoney(parseNumber(form.quantity) * parseNumber(form.purchase), form.currency)}</strong></div><label><span>{t.paid}</span><input type="number" min="0" value={form.paid || 0} onChange={(event) => update('paid', event.target.value)} /></label><label><span>{t.remaining}</span><input readOnly value={formatCurrencyMoney(Math.max(0, parseNumber(form.quantity) * parseNumber(form.purchase) - parseNumber(form.paid)), form.currency)} /></label></section>
        <footer className="modal-actions"><button type="button" onClick={onClose}>{t.cancel}</button><button className="primary-btn" type="submit">{t.updatePurchase ?? 'Update Purchase'}</button></footer>
      </form>
    </div>
  )
}

function GodownPage({ categories, companyInfo, godownEntries, onGodownChange, onNotify, onProductsChange, printSettings, products, suppliers, t }) {
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [viewMode, setViewMode] = useState('product')
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState('')
  const [detailEntry, setDetailEntry] = useState(null)
  const [detailTab, setDetailTab] = useState('product')
  const [supplierPortal, setSupplierPortal] = useState(null)
  const [supplierTab, setSupplierTab] = useState('ledger')
  const [paymentEntry, setPaymentEntry] = useState(null)
  const [editEntry, setEditEntry] = useState(null)
  const [deleteEntry, setDeleteEntry] = useState(null)
  const [hideSoldOut, setHideSoldOut] = useState(true)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [supplierDateFilter, setSupplierDateFilter] = useState('all')
  const [supplierCustomStart, setSupplierCustomStart] = useState('')
  const [supplierCustomEnd, setSupplierCustomEnd] = useState('')
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [supplierStatement, setSupplierStatement] = useState(null)

  const entries = useMemo(() => godownEntries.flatMap((entry) => {
    const rows = entry.rows || []
    const billTotal = parseNumber(entry.total) || rows.reduce((sum, row) => sum + parseNumber(row.quantity) * parseNumber(row.purchase), 0)
    const billPaid = Math.min(parseNumber(entry.paid), billTotal)
    const billRemaining = Math.max(0, billTotal - billPaid)
    return rows.filter((row) => !row.expired).map((row, index) => ({
      ...row,
      billNumber: entry.billNumber || `#${String(entry.id).slice(0, 6).toUpperCase()}`,
      currency: entry.currency || 'AFN',
      entryDate: entry.date,
      entryId: entry.id,
      paid: billPaid,
      paymentHistory: entry.paymentHistory || [],
      remaining: billRemaining,
      rowIndex: index,
      rowTotal: parseNumber(row.quantity) * parseNumber(row.purchase),
      total: billTotal,
    }))
  }), [godownEntries])

  const productRows = useMemo(() => products.map((product) => {
    const productEntries = entries.filter((entry) => entry.productId === product.id || (!entry.productId && entry.name === product.name))
    const imported = productEntries.reduce((sum, entry) => sum + parseNumber(entry.quantity), 0)
    const quantity = parseNumber(product.quantity)
    const purchase = parseNumber(product.purchase)
    const selling = parseNumber(product.selling)
    return {
      ...product,
      imported,
      quantity,
      purchase,
      selling,
      entries: productEntries,
      totalValue: quantity * purchase,
      expectedProfit: Math.max(0, selling - purchase) * quantity,
      remaining: productEntries.reduce((sum, entry) => sum + parseNumber(entry.total), 0) - productEntries.reduce((sum, entry) => sum + parseNumber(entry.paid), 0),
    }
  }), [entries, products])

  const filteredProducts = productRows.filter((product) => {
    const needle = search.trim().toLowerCase()
    const supplierId = product.supplierId || ''
    const matchesSearch = !needle || `${product.name} ${product.code}`.toLowerCase().includes(needle)
    const matchesProduct = productFilter === 'all' || product.id === productFilter
    const matchesSupplier = supplierFilter === 'all' || supplierId === supplierFilter
    const threshold = parseNumber(product.lowStockThreshold || product.lowStock || 0)
    const expiryDate = parseDateInput(product.expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToExpire = expiryDate ? Math.ceil((expiryDate - today) / 86400000) : null
    const productDate = product.entries[0]?.date || product.createdAt?.slice(0, 10) || ''
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in' && product.quantity > 0) ||
      (stockFilter === 'out' && product.quantity <= 0) ||
      (stockFilter === 'low' && product.quantity > 0 && threshold > 0 && product.quantity <= threshold) ||
      (stockFilter === 'expiring' && daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 30) ||
      (stockFilter === 'expired' && daysToExpire !== null && daysToExpire < 0)
    const matchesDate = getDateMatches(productDate, dateFilter, customStartDate, customEndDate)
    const matchesSoldOut = !hideSoldOut || product.quantity > 0
    return matchesSearch && matchesProduct && matchesSupplier && matchesStock && matchesDate && matchesSoldOut
  })

  const filteredEntries = entries.filter((entry) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = !needle || `${entry.name} ${entry.code}`.toLowerCase().includes(needle)
    const matchesProduct = productFilter === 'all' || entry.productId === productFilter
    const matchesSupplier = supplierFilter === 'all' || entry.supplierId === supplierFilter
    const product = productRows.find((item) => item.id === entry.productId)
    const threshold = parseNumber(product?.lowStockThreshold || product?.lowStock || 0)
    const expiryDate = parseDateInput(product?.expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToExpire = expiryDate ? Math.ceil((expiryDate - today) / 86400000) : null
    const quantity = parseNumber(product?.quantity ?? entry.quantity)
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in' && quantity > 0) ||
      (stockFilter === 'out' && quantity <= 0) ||
      (stockFilter === 'low' && quantity > 0 && threshold > 0 && quantity <= threshold) ||
      (stockFilter === 'expiring' && daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 30) ||
      (stockFilter === 'expired' && daysToExpire !== null && daysToExpire < 0)
    const matchesDate = getDateMatches(entry.date || entry.entryDate, dateFilter, customStartDate, customEndDate)
    const matchesSoldOut = !hideSoldOut || quantity > 0
    return matchesSearch && matchesProduct && matchesSupplier && matchesStock && matchesDate && matchesSoldOut
  })

  const summary = {
    imports: godownEntries.length,
    exports: 0,
    stockValue: productRows.reduce((sum, product) => sum + product.totalValue, 0),
    profit: productRows.reduce((sum, product) => sum + product.expectedProfit, 0),
    payable: godownEntries.reduce((sum, entry) => sum + parseNumber(entry.remaining), 0),
  }

  const productOptions = [{ value: 'all', label: t.allProducts }, ...products.map((product) => ({ value: product.id, label: product.name || t.product }))]
  const supplierOptions = [{ value: 'all', label: t.allSuppliers }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]
  const stockOptions = [
    { value: 'all', label: `${t.stockStatus}: ${t.all}` },
    { value: 'in', label: t.inStock },
    { value: 'low', label: t.lowStock ?? 'Low Stock' },
    { value: 'out', label: t.outOfStock },
    { value: 'expiring', label: t.expiringSoon ?? 'Expiring soon' },
    { value: 'expired', label: t.expired ?? 'Expired' },
  ]
  const dateOptions = [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today ?? 'Today' },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ]
  const currencyList = ['AFN', 'USD', 'EUR', 'GBP', 'SAR', 'PKR', 'INR', 'IRR', 'AED', 'CNY']
  const printRows = viewMode === 'product'
    ? filteredProducts.map((product) => ({
      id: product.id,
      product: product.name,
      supplier: suppliers.find((supplier) => supplier.id === product.supplierId)?.name || '-',
      quantity: `${product.quantity} ${product.unit || 'pcs'}`,
      purchase: formatMoney(product.purchase),
      selling: formatMoney(product.selling),
      total: formatMoney(product.totalValue),
    }))
    : filteredEntries.map((entry) => ({
      id: entry.id,
      type: t.import,
      product: entry.name,
      supplier: suppliers.find((supplier) => supplier.id === entry.supplierId)?.name || '-',
      quantity: `${entry.quantity} ${entry.unit || 'pcs'}`,
      purchase: formatMoney(entry.purchase),
      selling: formatMoney(entry.selling),
      date: getGregorianLabel(entry.date),
    }))

  const savePurchase = (purchase) => {
    let nextProducts = [...products]
    const rowsWithIds = purchase.rows.map((row) => {
      const existingIndex = nextProducts.findIndex((product) => product.id === row.productId)
      const productId = existingIndex >= 0 ? row.productId : crypto.randomUUID()
      if (existingIndex >= 0) {
        const existing = nextProducts[existingIndex]
        nextProducts[existingIndex] = {
          ...existing,
          name: row.name,
          code: row.code || existing.code,
          category: row.category || existing.category,
          purchase: row.purchase,
          selling: row.selling,
          quantity: String(parseNumber(existing.quantity) + parseNumber(row.quantity)),
          unit: row.unit || existing.unit,
          supplierId: row.supplierId || existing.supplierId,
          status: 'In Stock',
        }
      } else {
        nextProducts = [{
          id: productId,
          barcode: '',
          code: row.code || `PRD-${Date.now().toString().slice(-6)}`,
          category: row.category,
          name: row.name,
          purchase: row.purchase,
          selling: row.selling,
          quantity: row.quantity,
          unit: row.unit,
          lowStockThreshold: row.lowStockThreshold || '',
          expiryDate: row.expiryDate || '',
          alertDaysBefore: row.alertDaysBefore || '',
          supplierId: row.supplierId,
          status: 'In Stock',
        }, ...nextProducts]
      }
      return { ...row, id: crypto.randomUUID(), productId }
    })
    onProductsChange(nextProducts)
    onGodownChange((current) => [{ ...purchase, rows: rowsWithIds }, ...current])
    setPurchaseOpen(false)
    onNotify?.(t.purchaseSaved)
  }

  const getSupplierName = (supplierId) => suppliers.find((supplier) => supplier.id === supplierId)?.name || '-'
  const getEntryTitle = (entry) => `${t.purchaseBill ?? 'Purchase Bill'} ${entry.billNumber || ''}`.trim()

  const adjustProductQuantity = (productId, delta) => {
    if (!productId || !delta) return
    onProductsChange(products.map((product) => {
      if (product.id !== productId) return product
      const nextQuantity = Math.max(0, parseNumber(product.quantity) + delta)
      return { ...product, quantity: String(nextQuantity), status: nextQuantity > 0 ? 'In Stock' : 'Out of Stock' }
    }))
  }

  const savePayment = (payment) => {
    if (!paymentEntry) return
    const paymentRecord = { ...payment, id: crypto.randomUUID(), date: todayInput(), createdAt: new Date().toISOString() }
    onGodownChange((current) => current.map((item) => {
      if (item.id !== paymentEntry.entryId) return item
      const rows = item.rows || []
      const total = parseNumber(item.total) || rows.reduce((sum, row) => sum + parseNumber(row.quantity) * parseNumber(row.purchase), 0)
      const paid = Math.min(total, parseNumber(item.paid) + parseNumber(payment.amount))
      return {
        ...item,
        paid,
        remaining: Math.max(0, total - paid),
        paymentHistory: [...(item.paymentHistory || []), paymentRecord],
      }
    }))
    const updateOpenEntry = (entry) => {
      if (!entry || entry.entryId !== paymentEntry.entryId) return entry
      const paid = Math.min(parseNumber(entry.total), parseNumber(entry.paid) + parseNumber(payment.amount))
      return { ...entry, paid, remaining: Math.max(0, parseNumber(entry.total) - paid), paymentHistory: [...(entry.paymentHistory || []), paymentRecord] }
    }
    setDetailEntry(updateOpenEntry)
    setSupplierPortal(updateOpenEntry)
    setPaymentEntry(null)
    onNotify?.(t.paymentRecorded)
  }

  const saveEditedEntry = (form) => {
    const previousQuantity = parseNumber(editEntry?.quantity)
    const nextQuantity = parseNumber(form.quantity)
    const nextRowTotal = nextQuantity * parseNumber(form.purchase)
    onGodownChange((current) => current.map((item) => {
      if (item.id !== form.entryId) return item
      const rows = (item.rows || []).map((row) => row.id === form.id ? {
        ...row,
        category: form.category,
        code: form.code,
        date: form.date,
        name: form.name,
        notes: form.notes,
        lowStockThreshold: form.lowStockThreshold || '',
        expiryDate: form.expiryDate || '',
        alertDaysBefore: form.alertDaysBefore || '',
        purchase: String(form.purchase || ''),
        quantity: String(form.quantity || ''),
        selling: String(form.selling || ''),
        supplierId: form.supplierId,
        unit: form.unit || 'pcs',
      } : row)
      const total = rows.reduce((sum, row) => sum + parseNumber(row.quantity) * parseNumber(row.purchase), 0)
      const paid = Math.min(parseNumber(form.paid), total)
      return { ...item, currency: form.currency || item.currency, date: form.date || item.date, paid, remaining: Math.max(0, total - paid), rows, supplierId: form.supplierId || item.supplierId, total: total || nextRowTotal }
    }))
    adjustProductQuantity(form.productId, nextQuantity - previousQuantity)
    setEditEntry(null)
    onNotify?.(t.purchaseSaved)
  }

  const deleteEntryRecord = (entry) => {
    onGodownChange((current) => current
      .map((item) => {
        if (item.id !== entry.entryId) return item
        const rows = (item.rows || []).filter((row) => row.id !== entry.id)
        const total = rows.reduce((sum, row) => sum + parseNumber(row.quantity) * parseNumber(row.purchase), 0)
        const paid = Math.min(parseNumber(item.paid), total)
        return { ...item, rows, total, paid, remaining: Math.max(0, total - paid) }
      })
      .filter((item) => (item.rows || []).length > 0))
    adjustProductQuantity(entry.productId, -parseNumber(entry.quantity))
    setDeleteEntry(null)
    onNotify?.(t.entryDeleted ?? t.delete)
  }

  const moveToExpired = (entry) => {
    onGodownChange((current) => current.map((item) => {
      if (item.id !== entry.entryId) return item
      return {
        ...item,
        rows: (item.rows || []).map((row) => row.id === entry.id ? { ...row, expired: true, expiredAt: new Date().toISOString() } : row),
      }
    }))
    adjustProductQuantity(entry.productId, -parseNumber(entry.quantity))
    onNotify?.(t.movedToExpired ?? t.moveToExpired)
  }

  const saveAdjustment = (adjustment) => {
    if (!supplierPortal) return
    const record = {
      ...adjustment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      date: todayInput(),
      supplierId: supplierPortal.supplierId,
    }
    onGodownChange((current) => [{
      id: crypto.randomUUID(),
      adjustments: [record],
      createdAt: record.createdAt,
      currency: record.currency,
      date: record.date,
      paid: 0,
      remaining: 0,
      rows: [],
      supplierId: supplierPortal.supplierId,
      total: 0,
      type: 'supplierAdjustment',
    }, ...current])
    setAdjustmentOpen(false)
    onNotify?.(t.savedSuccessfully ?? t.saveChanges)
  }

  const sharedModals = (
    <>
      {paymentEntry && <PaymentModal entry={paymentEntry} onClose={() => setPaymentEntry(null)} onSave={savePayment} t={t} />}
      {editEntry && <EditEntryModal categories={categories} entry={editEntry} onClose={() => setEditEntry(null)} onSave={saveEditedEntry} suppliers={suppliers} t={t} />}
      {deleteEntry && <ConfirmDeleteModal entry={deleteEntry} onClose={() => setDeleteEntry(null)} onConfirm={deleteEntryRecord} t={t} />}
      {adjustmentOpen && supplierPortal && <AdjustmentModal currencies={currencyList} onClose={() => setAdjustmentOpen(false)} onSave={saveAdjustment} supplierName={getSupplierName(supplierPortal.supplierId)} t={t} />}
      {supplierStatement && <SupplierStatementModal columns={supplierStatement.columns} companyInfo={companyInfo} onClose={() => setSupplierStatement(null)} rows={supplierStatement.rows} subtitle={supplierStatement.subtitle} title={supplierStatement.title} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printRows} title={t.godownStockReport} columns={viewMode === 'product' ? [
        { key: 'product', label: t.product },
        { key: 'supplier', label: t.supplier },
        { key: 'quantity', label: t.quantity },
        { key: 'purchase', label: t.purchase },
        { key: 'selling', label: t.selling },
        { key: 'total', label: t.total },
      ] : [
        { key: 'type', label: t.type },
        { key: 'product', label: t.product },
        { key: 'supplier', label: t.supplier },
        { key: 'quantity', label: t.quantity },
        { key: 'purchase', label: t.purchase },
        { key: 'selling', label: t.selling },
        { key: 'date', label: t.date },
      ]} t={t} />}
    </>
  )

  if (detailEntry) {
    return (
      <section className="entity-content godown-detail-page">
        <div className="godown-detail-head">
          <div className="back-title-row">
            <button className="back-btn" type="button" onClick={() => setDetailEntry(null)}>‹</button>
            <div><h1>{getEntryTitle(detailEntry)}</h1><p>{getSupplierName(detailEntry.supplierId)} · {getGregorianLabel(detailEntry.date)}</p></div>
            <span className="status-pill active">{t.import}</span>
          </div>
          <div className="entity-actions">
            <button className="primary-btn" type="button" onClick={() => setPaymentEntry(detailEntry)}><CreditCard size={16} /> {t.makePayment ?? 'Make Payment'}</button>
            <button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.printStatement ?? t.printReport}</button>
          </div>
        </div>
        <div className="godown-detail-summary">
          <article><span>{t.totalValue}</span><strong>{formatCurrencyMoney(detailEntry.total, detailEntry.currency)}</strong></article>
          <article><span>{t.paid}</span><strong className="success-text">{formatCurrencyMoney(detailEntry.paid, detailEntry.currency)}</strong></article>
          <article><span>{t.remaining}</span><strong className="danger-text">{formatCurrencyMoney(detailEntry.remaining, detailEntry.currency)}</strong></article>
          <article><span>{t.currency}</span><strong>{detailEntry.currency}</strong></article>
        </div>
        <div className="godown-tabs">
          <button className={detailTab === 'product' ? 'active' : ''} type="button" onClick={() => setDetailTab('product')}><Archive size={16} /> {t.product}</button>
          <button className={detailTab === 'history' ? 'active' : ''} type="button" onClick={() => setDetailTab('history')}><CreditCard size={16} /> {t.paymentHistory}</button>
        </div>
        <div className="godown-detail-card">
          {detailTab === 'product' ? (
            <>
              <h2>{t.lineItems ?? 'Line Items'}</h2>
              <table className="data-table godown-table"><thead><tr><th>{t.product}</th><th>{t.code}</th><th>{t.quantity}</th><th>{t.purchase}</th><th>{t.totalValue}</th></tr></thead><tbody><tr><td>{detailEntry.name}</td><td>{detailEntry.code || '-'}</td><td>{detailEntry.quantity} {detailEntry.unit}</td><td>{formatCurrencyMoney(detailEntry.purchase, detailEntry.currency)}</td><td><strong>{formatCurrencyMoney(detailEntry.rowTotal, detailEntry.currency)}</strong></td></tr></tbody></table>
            </>
          ) : (
            <>
              <h2>{t.paymentHistory}</h2>
              {(detailEntry.paymentHistory || []).length === 0 ? <div className="empty-detail-state"><span>!</span><p>{t.noPaymentsYet ?? 'No payments yet'}</p></div> : <table className="data-table godown-table"><thead><tr><th>{t.date}</th><th>{t.amount}</th><th>{t.paymentMethod}</th><th>{t.referenceNo ?? 'Reference No'}</th></tr></thead><tbody>{detailEntry.paymentHistory.map((payment) => <tr key={payment.id}><td>{getGregorianLabel(payment.date)}</td><td>{formatCurrencyMoney(payment.amount, payment.currency)}</td><td>{t[payment.method] ?? payment.method}</td><td>{payment.reference || '-'}</td></tr>)}</tbody></table>}
            </>
          )}
        </div>
        {sharedModals}
      </section>
    )
  }

  if (supplierPortal) {
    const supplierEntries = entries.filter((entry) => entry.supplierId === supplierPortal.supplierId)
    const visibleSupplierEntries = supplierEntries.filter((entry) => getDateMatches(entry.date || entry.entryDate, supplierDateFilter, supplierCustomStart, supplierCustomEnd))
    const supplierAdjustments = godownEntries.flatMap((entry) => (entry.adjustments || []).filter((adjustment) => adjustment.supplierId === supplierPortal.supplierId))
    const visibleSupplierAdjustments = supplierAdjustments.filter((adjustment) => getDateMatches(adjustment.date, supplierDateFilter, supplierCustomStart, supplierCustomEnd))
    const supplierName = getSupplierName(supplierPortal.supplierId)
    const adjustmentBalance = supplierAdjustments.reduce((sum, adjustment) => sum + (adjustment.type === 'debit' ? parseNumber(adjustment.amount) : -parseNumber(adjustment.amount)), 0)
    const currentBalance = supplierEntries.reduce((sum, entry) => sum + parseNumber(entry.remaining), 0) + adjustmentBalance
    const purchaseValue = visibleSupplierEntries.reduce((sum, entry) => sum + parseNumber(entry.total), 0)
    const soldValue = visibleSupplierEntries.reduce((sum, entry) => sum + (parseNumber(entry.selling) * Math.max(0, parseNumber(entry.quantity) - parseNumber(products.find((product) => product.id === entry.productId)?.quantity))), 0)
    const profit = visibleSupplierEntries.reduce((sum, entry) => sum + Math.max(0, parseNumber(entry.selling) - parseNumber(entry.purchase)) * parseNumber(entry.quantity), 0)
    const ledgerRows = [
      ...visibleSupplierEntries.map((entry) => ({
        balance: formatCurrencyMoney(entry.remaining, entry.currency),
        currency: entry.currency,
        date: getGregorianLabel(entry.date),
        description: getEntryTitle(entry),
        deposit: '-',
        id: entry.id,
        kind: 'purchase',
        rawDate: entry.date,
        source: entry,
        withdraw: formatCurrencyMoney(entry.total, entry.currency),
      })),
      ...visibleSupplierAdjustments.map((adjustment) => ({
        balance: formatCurrencyMoney(adjustment.type === 'debit' ? adjustment.amount : -adjustment.amount, adjustment.currency),
        currency: adjustment.currency,
        date: getGregorianLabel(adjustment.date),
        description: adjustment.reason,
        deposit: adjustment.type === 'credit' ? formatCurrencyMoney(adjustment.amount, adjustment.currency) : '-',
        id: adjustment.id,
        kind: 'adjustment',
        rawDate: adjustment.date,
        withdraw: adjustment.type === 'debit' ? formatCurrencyMoney(adjustment.amount, adjustment.currency) : '-',
      })),
    ].sort((a, b) => String(b.rawDate).localeCompare(String(a.rawDate)))
    const deleteLedgerRow = (row) => {
      if (row.kind === 'purchase' && row.source) {
        setDeleteEntry(row.source)
        return
      }
      onGodownChange((current) => current.map((item) => ({
        ...item,
        adjustments: (item.adjustments || []).filter((adjustment) => adjustment.id !== row.id),
      })))
      onNotify?.(t.entryDeleted ?? t.delete)
    }
    const printPdfButton = (tab = supplierTab) => (
      <button className="print-pdf-btn" type="button" onClick={() => openSupplierStatement(tab)}>
        <ReceiptText size={16} /> {t.printPdf ?? 'PRINT & PDF'}
      </button>
    )
    const openSupplierStatement = (tab = supplierTab) => {
      const configs = {
        activity: {
          columns: [
            { key: 'action', label: t.actions },
            { key: 'description', label: t.description },
            { key: 'date', label: t.date },
          ],
          rows: ledgerRows.map((row) => ({ action: row.withdraw !== '-' ? t.withdraw : t.deposit, date: row.date, description: row.description, id: row.id })),
          title: `${supplierName} - ${t.activityLog ?? 'Activity Log'}`,
        },
        goods: {
          columns: [
            { key: 'name', label: t.name },
            { key: 'code', label: t.code },
            { key: 'quantity', label: t.totalImported },
            { key: 'purchase', label: t.purchasePrice },
            { key: 'selling', label: t.sellingPrice },
            { key: 'profit', label: t.profitPerUnit },
          ],
          rows: visibleSupplierEntries.map((entry) => ({ code: entry.code || '-', id: entry.id, name: entry.name, profit: formatCurrencyMoney(parseNumber(entry.selling) - parseNumber(entry.purchase), entry.currency), purchase: formatCurrencyMoney(entry.purchase, entry.currency), quantity: `${entry.quantity} ${entry.unit}`, selling: formatCurrencyMoney(entry.selling, entry.currency) })),
          title: `${supplierName} - ${t.goods ?? 'Goods'}`,
        },
        ledger: {
          columns: [
            { key: 'date', label: t.date },
            { key: 'description', label: t.description },
            { key: 'deposit', label: t.deposit },
            { key: 'withdraw', label: t.withdraw },
            { key: 'balance', label: t.balance },
            { key: 'currency', label: t.currency },
          ],
          rows: ledgerRows,
          title: `${supplierName} - ${t.supplierLedger ?? 'Supplier Ledger'}`,
        },
        profit: {
          columns: [
            { key: 'name', label: t.name },
            { key: 'quantity', label: t.qtySold ?? 'Qty Sold' },
            { key: 'purchase', label: t.totalPurchaseValue ?? 'Total Purchase Value' },
            { key: 'sold', label: t.totalSoldValue ?? 'Total Sold Value' },
            { key: 'profit', label: t.grossProfit ?? 'Gross Profit' },
          ],
          rows: visibleSupplierEntries.map((entry) => ({ id: entry.id, name: entry.name, profit: formatCurrencyMoney(Math.max(0, parseNumber(entry.selling) - parseNumber(entry.purchase)) * parseNumber(entry.quantity), entry.currency), purchase: formatCurrencyMoney(entry.total, entry.currency), quantity: `0 ${entry.unit}`, sold: formatCurrencyMoney(0, entry.currency) })),
          title: `${supplierName} - ${t.profit ?? 'Profit'}`,
        },
      }
      const config = configs[tab] || configs.ledger
      setSupplierStatement({
        subtitle: `${t.account}: ${supplierName} - ${supplierPortal.currency || 'AFN'}`,
        ...config,
      })
    }
    return (
      <section className="entity-content supplier-portal-page">
        <div className="supplier-portal-head">
          <div className="back-title-row">
            <button className="back-btn" type="button" onClick={() => setSupplierPortal(null)}>‹</button>
            <div><h1>{t.supplierPortal ?? 'Supplier Portal'}: {supplierName}</h1><p>{supplierName} · {supplierPortal.currency || 'AFN'} · {t.accountCreated ?? 'Account Created'}: {getGregorianLabel(supplierPortal.date)}</p></div>
          </div>
          <button type="button" onClick={() => openSupplierStatement('ledger')}><ReceiptText size={16} /> {t.printStatement ?? t.printReport}</button>
        </div>
        <div className="supplier-account-card">
          <div><h2>{t.account}: {supplierName} — {supplierPortal.currency || 'AFN'}</h2><p>{t.printDate ?? 'Print Date'}: {new Date().toLocaleDateString('en-GB')}</p></div>
          <div className="supplier-balance-box"><span>{t.currentBalance ?? 'Current Balance'}</span><strong className="danger-text">{formatCurrencyMoney(currentBalance, supplierPortal.currency)}</strong><small>{t.payable}</small></div>
          <div className="supplier-balance-box"><span>{t.previousBalance ?? 'Previous Balance'}</span><strong>{formatCurrencyMoney(0, supplierPortal.currency)}</strong></div>
        </div>
        <div className="supplier-controls">
          <button type="button" onClick={() => setAdjustmentOpen(true)}>↻ {t.addAdjustment ?? 'Add Adjustment'}</button>
          <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={supplierDateFilter} onChange={setSupplierDateFilter} />
          {supplierDateFilter === 'custom' && <DateRangePicker className="supplier-date-range" end={supplierCustomEnd} onChange={({ start, end }) => { setSupplierCustomStart(start); setSupplierCustomEnd(end) }} start={supplierCustomStart} t={t} />}
        </div>
        <div className="godown-tabs supplier-tabs">
          {['ledger', 'goods', 'profit', 'activity'].map((tab) => <button key={tab} className={supplierTab === tab ? 'active' : ''} type="button" onClick={() => setSupplierTab(tab)}>{t[tab === 'ledger' ? 'supplierLedger' : tab === 'activity' ? 'activityLog' : tab] ?? tab}</button>)}
        </div>
        <div className="supplier-section-card">
          {supplierTab === 'ledger' && <><div className="supplier-card-head"><h2>{t.supplierLedger ?? 'Supplier Ledger'}</h2><div>{printPdfButton('ledger')}</div></div><table className="data-table godown-table"><thead><tr><th>{t.no}</th><th>{t.date}</th><th>{t.description}</th><th>{t.deposit}</th><th>{t.withdraw}</th><th>{t.balance}</th><th>{t.currency}</th><th>{t.actions}</th></tr></thead><tbody>{ledgerRows.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noLedgerEntries ?? 'No ledger entries'}</td></tr> : ledgerRows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td>{row.date}<small>{getShamsiShortLabel(row.rawDate)}</small></td><td>{row.description}</td><td>{row.deposit}</td><td className="danger-text">{row.withdraw}</td><td>{row.balance}</td><td>{row.currency}</td><td><FloatingActionMenu ariaLabel={t.actions} actions={[{ icon: <SquareMenu size={15} />, label: t.edit, onClick: () => row.kind === 'purchase' && row.source ? setEditEntry(row.source) : onNotify?.(t.edit ?? 'Edit') }, { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => deleteLedgerRow(row) }]} /></td></tr>)}</tbody></table></>}
          {supplierTab === 'goods' && <><div className="supplier-card-head"><h2>{t.goods ?? 'Goods'} ({visibleSupplierEntries.length})</h2><div>{printPdfButton('goods')}</div></div><table className="data-table godown-table"><thead><tr><th>{t.name}</th><th>{t.code}</th><th>{t.totalImported}</th><th>{t.totalSold}</th><th>{t.remaining}</th><th>{t.purchasePrice}</th><th>{t.sellingPrice}</th><th>{t.profitPerUnit}</th></tr></thead><tbody>{visibleSupplierEntries.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noRecordsFound ?? 'No records found'}</td></tr> : visibleSupplierEntries.map((entry) => <tr key={entry.id}><td>{entry.name}</td><td>{entry.code || '-'}</td><td>{entry.quantity} {entry.unit}</td><td>0 {entry.unit}</td><td>{entry.quantity} {entry.unit}</td><td>{formatCurrencyMoney(entry.purchase, entry.currency)}</td><td>{formatCurrencyMoney(entry.selling, entry.currency)}</td><td className="success-text">{formatCurrencyMoney(parseNumber(entry.selling) - parseNumber(entry.purchase), entry.currency)}</td></tr>)}</tbody></table></>}
          {supplierTab === 'profit' && <><div className="supplier-card-head"><h2>{t.profit ?? 'Profit'}</h2><div>{printPdfButton('profit')}</div></div><div className="supplier-metric-grid"><article><span>{t.totalPurchaseValue ?? 'Total Purchase Value'}</span><strong className="danger-text">{formatCurrencyMoney(purchaseValue, supplierPortal.currency)}</strong></article><article><span>{t.totalSoldValue ?? 'Total Sold Value'}</span><strong>{formatCurrencyMoney(soldValue, supplierPortal.currency)}</strong></article><article><span>{t.grossProfit ?? 'Gross Profit'}</span><strong className="success-text">{formatCurrencyMoney(profit, supplierPortal.currency)}</strong></article></div><table className="data-table godown-table"><thead><tr><th>{t.name}</th><th>{t.qtySold ?? 'Qty Sold'}</th><th>{t.totalPurchaseValue ?? 'Total Purchase Value'}</th><th>{t.totalSoldValue ?? 'Total Sold Value'}</th><th>{t.grossProfit ?? 'Gross Profit'}</th></tr></thead><tbody>{visibleSupplierEntries.length === 0 ? <tr><td className="empty-cell" colSpan="5">{t.noRecordsFound ?? 'No records found'}</td></tr> : visibleSupplierEntries.map((entry) => <tr key={entry.id}><td>{entry.name}</td><td>0 {entry.unit}</td><td>{formatCurrencyMoney(entry.total, entry.currency)}</td><td>{formatCurrencyMoney(0, entry.currency)}</td><td className="success-text">{formatCurrencyMoney(Math.max(0, parseNumber(entry.selling) - parseNumber(entry.purchase)) * parseNumber(entry.quantity), entry.currency)}</td></tr>)}</tbody></table></>}
          {supplierTab === 'activity' && <><div className="supplier-card-head"><h2>{t.activityLog ?? 'Activity Log'}</h2><div>{printPdfButton('activity')}</div></div>{ledgerRows.length === 0 ? <div className="empty-detail-state"><p>{t.noActivityRecordedYet ?? 'No activity recorded yet'}</p></div> : ledgerRows.map((row) => <div className="activity-log-row" key={row.id}><div><span></span><strong>{row.description}</strong><p>{row.date}</p></div><div className="danger-text">{row.withdraw !== '-' ? `-${row.withdraw}` : row.deposit}</div></div>)}</>}
        </div>
        {sharedModals}
      </section>
    )
  }

  return (
    <section className="entity-content godown-content">
      <div className="entity-heading">
        <div><h1>{t.godownInventory}</h1><p>{t.trackStockImportsExports}</p></div>
        <div className="entity-actions">
          <button className="primary-btn" type="button" onClick={() => setPurchaseOpen(true)}><Archive size={16} /> {t.multiPurchase}</button>
          <button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.printReport}</button>
        </div>
      </div>

      <div className="godown-summary-grid">
        <article className="tone-green"><span>{t.totalImports}</span><strong>{summary.imports}</strong><Upload size={20} /></article>
        <article className="tone-blue"><span>{t.totalExports}</span><strong>{summary.exports}</strong><Download size={20} /></article>
        <article className="tone-orange"><span>{t.globalStockValue}</span><strong>{formatMoney(summary.stockValue)}</strong><Archive size={20} /></article>
        <article className="tone-green"><span>{t.expectedPureProfit}</span><strong>{formatMoney(summary.profit)}</strong><BarChart3 size={20} /></article>
        <article className="tone-orange"><span>{t.payableToSuppliers}</span><strong>{formatMoney(summary.payable)}</strong><WalletCards size={20} /></article>
      </div>

      <div className="godown-filter-card">
        <div className="godown-filter-bar">
        <div className="search-field"><Search size={17} /><input placeholder={t.searchProductSupplier} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <CustomSelect ariaLabel={t.products} options={productOptions} value={productFilter} onChange={setProductFilter} />
        <CustomSelect ariaLabel={t.suppliers} options={supplierOptions} value={supplierFilter} onChange={setSupplierFilter} />
        <CustomSelect ariaLabel={t.stockStatus} options={stockOptions} value={stockFilter} onChange={setStockFilter} />
        <div className="date-filter-shell"><CalendarDays size={16} /><CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} /></div>
        {dateFilter === 'custom' && <DateRangePicker className="godown-date-range" end={customEndDate} onChange={({ start, end }) => { setCustomStartDate(start); setCustomEndDate(end) }} start={customStartDate} t={t} />}
        <button className={`toggle-filter-btn ${hideSoldOut ? 'active' : ''}`} type="button" onClick={() => setHideSoldOut((current) => !current)}>{t.hideSoldOut}: {hideSoldOut ? (t.on ?? 'ON') : (t.off ?? 'OFF')}</button>
        <div className="segmented-view">
          <button className={viewMode === 'product' ? 'active' : ''} type="button" onClick={() => setViewMode('product')}>{t.byProduct}</button>
          <button className={viewMode === 'entry' ? 'active' : ''} type="button" onClick={() => setViewMode('entry')}>{t.byEntry}</button>
        </div>
        </div>
      </div>

      <div className="data-panel godown-panel">
        <h2><SquareMenu size={20} /> {viewMode === 'product' ? `${t.productsInStock} (${filteredProducts.length})` : `${t.stockEntries} (${filteredEntries.length})`}</h2>
        {viewMode === 'product' ? (
          <div className="godown-table-wrap">
            <table className="data-table godown-table">
              <thead><tr><th></th><th>{t.product}</th><th>{t.inStock}</th><th>{t.imported}</th><th>{t.sold}</th><th>{t.unitCost}</th><th>{t.sellingPrice}</th><th>{t.totalValue}</th><th>{t.paid}</th><th>{t.remaining}</th></tr></thead>
              <tbody>
                {filteredProducts.length === 0 ? <tr><td colSpan="10" className="empty-cell">{t.noProductsFound}</td></tr> : filteredProducts.map((product) => (
                  <Fragment key={product.id}>
                    <tr>
                      <td><button className="expand-row-btn" type="button" onClick={() => setExpandedProduct((current) => current === product.id ? '' : product.id)}><ChevronDown className={expandedProduct === product.id ? 'open' : ''} size={16} /></button></td>
                      <td><strong>{product.name}</strong><small>{product.code || '-'} · {product.entries.length} {t.purchase}</small></td>
                      <td><strong>{product.quantity} {product.unit || 'pcs'}</strong></td>
                      <td><span className="success-text">{product.imported}</span> / {product.imported || product.quantity} {product.unit || 'pcs'}</td>
                      <td>0 {product.unit || 'pcs'}</td>
                      <td>{formatMoney(product.purchase)}</td>
                      <td className="info-text">{formatMoney(product.selling)}</td>
                      <td><strong>{formatMoney(product.totalValue)}</strong></td>
                      <td className="success-text">{formatMoney(0)}</td>
                      <td className="danger-text">{formatMoney(Math.max(0, product.remaining))}</td>
                    </tr>
                    {expandedProduct === product.id && (
                      <tr className="history-row">
                        <td colSpan="10">
                          <div className="purchase-history">
                            <div><span>{t.allPurchasesForProduct}</span><span className="soft-pill">{t.immutableHistory}</span></div>
                            <table>
                              <thead><tr><th>{t.date}</th><th>{t.supplier}</th><th>{t.source}</th><th>{t.qty}</th><th>{t.unitCost}</th><th>{t.sellingPrice}</th><th>{t.total}</th></tr></thead>
                              <tbody>
                                {product.entries.map((entry) => (
                                  <tr key={entry.id}><td>{getGregorianLabel(entry.date)}<small>{getShamsiShortLabel(entry.date)}</small></td><td>{suppliers.find((supplier) => supplier.id === entry.supplierId)?.name || '-'}</td><td><span className="soft-pill">{t.import}</span></td><td>{entry.quantity} {entry.unit}</td><td>{formatMoney(entry.purchase)}</td><td>{formatMoney(entry.selling)}</td><td><strong>{formatMoney(entry.total)}</strong></td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="godown-table-wrap">
            <table className="data-table godown-table">
              <thead><tr><th>{t.type}</th><th>{t.product}</th><th>{t.supplier}</th><th>{t.quantity}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
              <tbody>
                {filteredEntries.length === 0 ? <tr><td colSpan="9" className="empty-cell">{t.noRecordsFound ?? 'No records found'}</td></tr> : filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td><span className="status-pill active">{t.import}</span></td>
                    <td><strong>{entry.name}</strong><small>{entry.code || '-'}</small></td>
                    <td>{suppliers.find((supplier) => supplier.id === entry.supplierId)?.name || '-'}</td>
                    <td>{entry.quantity} {entry.unit}</td>
                    <td><strong>{formatMoney(entry.total)}</strong></td>
                    <td className="success-text">{formatMoney(entry.paid)}</td>
                    <td className="danger-text">{formatMoney(entry.remaining)}</td>
                    <td>{getGregorianLabel(entry.date)}<small>{getShamsiShortLabel(entry.date)}</small></td>
                    <td>
                      <FloatingActionMenu
                        ariaLabel={t.actions}
                        actions={[
                          { icon: <Eye size={15} />, label: t.view, onClick: () => { setDetailEntry(entry); setDetailTab('product') } },
                          { icon: <CreditCard size={15} />, label: t.makePayment ?? 'Make Payment', onClick: () => setPaymentEntry(entry) },
                          { icon: <Eye size={15} />, label: t.supplierPortal ?? t.view, onClick: () => { setSupplierPortal(entry); setSupplierTab('ledger') } },
                          { icon: <SquareMenu size={15} />, label: t.edit, onClick: () => setEditEntry(entry) },
                          { icon: <CalendarDays size={15} />, label: t.moveToExpired ?? 'Move to expired', onClick: () => moveToExpired(entry) },
                          { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => setDeleteEntry(entry) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {purchaseOpen && <PurchaseModal categories={categories} onClose={() => setPurchaseOpen(false)} onSave={savePurchase} products={products} suppliers={suppliers} t={t} />}
      {sharedModals}
    </section>
  )
}

export default GodownPage
