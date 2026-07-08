import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { currencies } from '../data/dashboardData.js'
import { BarChart3, CalendarDays, DollarSign, Eye, Plus, ReceiptText, Search, Trash2, WalletCards } from '../components/Icons.jsx'
import { AdjustmentModal, SupplierStatementModal } from './Godown.jsx'
import './Godown.css'
import './Suppliers.css'

const emptySupplier = {
  name: '',
  phone: '',
  businessType: '',
  address: '',
  currency: 'AFN',
  items: [],
  notes: '',
  balance: '',
}

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const todayInput = () => new Date().toISOString().slice(0, 10)
const parseDateInput = (value) => (value ? new Date(`${String(value).slice(0, 10)}T12:00:00`) : null)

const formatCurrencyMoney = (value, currency = 'AFN') => {
  const amount = Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const symbol = currency === 'EUR' ? 'EUR' : currency === 'USD' ? 'USD' : currency || 'AFN'
  return `${amount} ${symbol}`
}

const getGregorianLabel = (isoDate) => {
  const date = parseDateInput(isoDate)
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
}

const getShamsiShortLabel = (isoDate) => {
  try {
    const date = parseDateInput(isoDate)
    return date ? new Intl.DateTimeFormat('en-CA-u-ca-persian', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date) : ''
  } catch {
    return isoDate || ''
  }
}

const getDateMatches = (dateValue, filter, start, end) => {
  if (filter === 'all' || !dateValue) return true
  const date = parseDateInput(dateValue)
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

const normalizeSupplier = (supplier) => {
  const source = supplier ?? emptySupplier
  const items = Array.isArray(source.items)
    ? source.items
    : String(source.items || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  return { ...emptySupplier, ...source, items }
}

function ActionMenu({ onDelete, onEdit, onView, supplier, t }) {
  return (
    <FloatingActionMenu
      ariaLabel={t.actions}
      actions={[
        { icon: <Eye size={15} />, label: t.viewProfile ?? 'View profile', onClick: () => onView(supplier) },
        { label: t.edit, onClick: onEdit },
        { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => onDelete(supplier) },
      ]}
    />
  )
}

export function SupplierModal({ initialSupplier, onClose, onSave, t }) {
  const [form, setForm] = useState(() => normalizeSupplier(initialSupplier))
  const [itemInput, setItemInput] = useState('')
  const [closing, setClosing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }
  const addSupplyItem = () => {
    const item = itemInput.trim()
    if (!item) return
    setForm((current) => current.items.some((value) => value.toLowerCase() === item.toLowerCase()) ? current : { ...current, items: [...current.items, item] })
    setItemInput('')
  }
  const removeSupplyItem = (item) => {
    setForm((current) => ({ ...current, items: current.items.filter((value) => value !== item) }))
  }
  const currencyOptions = currencies.map((currency) => ({ value: currency.code, label: `${currency.symbol} ${currency.name}` }))

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={(event) => { event.stopPropagation(); requestClose() }}>
      <form
        className="entity-modal supplier-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!form.name.trim()) return
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), status: form.status || 'Active' })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>x</button>
        <h2>{initialSupplier ? t.editSupplier : t.createSupplierAccount}</h2>
        <label className="wide"><span>{t.name} *</span><input autoFocus className={submitted && !form.name.trim() ? 'field-invalid' : ''} placeholder={t.supplierName} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label><span>{t.phoneNumber}</span><input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
        <label><span>{t.businessType}</span><input placeholder={t.businessTypePlaceholder} value={form.businessType} onChange={(e) => update('businessType', e.target.value)} /></label>
        <label className="wide"><span>{t.address}</span><input value={form.address} onChange={(e) => update('address', e.target.value)} /></label>
        <label className="wide"><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={form.currency} onChange={(value) => update('currency', value)} /></label>
        <label className="wide">
          <span>{t.itemsTheySupply}</span>
          <div className="inline-field">
            <input
              placeholder={t.itemsPlaceholder}
              value={itemInput}
              onChange={(e) => setItemInput(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSupplyItem()
                }
              }}
            />
            <button type="button" onClick={addSupplyItem}>{t.add}</button>
          </div>
          {form.items.length > 0 && (
            <div className="item-chip-row">
              {form.items.map((item) => (
                <button type="button" key={item} onClick={() => removeSupplyItem(item)}>
                  {item} <span>x</span>
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="wide"><span>{t.notes}</span><textarea placeholder={t.supplierNotesPlaceholder} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
        <label className="wide"><span>{t.openingBalance}</span><input placeholder="0.00" value={form.balance} onChange={(e) => update('balance', e.target.value)} /><small>{t.openingBalanceHint}</small></label>
        <div className="modal-actions">
          <button type="button" onClick={requestClose}>{t.cancel}</button>
          <button className="primary-btn" type="submit">{initialSupplier ? t.saveChanges : t.createSupplierAccount}</button>
        </div>
      </form>
    </div>
  )
}

function SuppliersPage({
  companyInfo,
  godownEntries = [],
  onGodownChange,
  onMoveToRecycle,
  onNotify,
  onSuppliersChange,
  printSettings,
  products = [],
  suppliers,
  t,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [balanceFilter, setBalanceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [portalSupplier, setPortalSupplier] = useState(null)
  const [portalTab, setPortalTab] = useState('ledger')
  const [portalDateFilter, setPortalDateFilter] = useState('all')
  const [portalCustomStart, setPortalCustomStart] = useState('')
  const [portalCustomEnd, setPortalCustomEnd] = useState('')
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [statementConfig, setStatementConfig] = useState(null)

  const dateOptions = [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today },
    { value: 'weekly', label: t.weekly },
    { value: 'monthly', label: t.monthly },
    { value: 'annual', label: t.annual },
    { value: 'custom', label: t.custom },
  ]
  const balanceOptions = [
    { value: 'all', label: t.all },
    { value: 'payable', label: t.payable },
    { value: 'receivable', label: t.receivable },
    { value: 'settled', label: t.settledPlain },
  ]

  const supplierRows = useMemo(() => {
    return godownEntries.flatMap((entry) => {
      const rows = Array.isArray(entry.rows) ? entry.rows : []
      return rows.map((row) => {
        const total = parseNumber(row.total) || parseNumber(row.quantity) * parseNumber(row.purchase)
        const product = products.find((item) => item.id === row.productId)
        const stockLeft = parseNumber(product?.quantity ?? row.quantity)
        const sold = Math.max(0, parseNumber(row.quantity) - stockLeft)
        return {
          ...row,
          currency: row.currency || entry.currency || 'AFN',
          date: row.date || entry.date || entry.createdAt || todayInput(),
          entryId: entry.id,
          id: `${entry.id}-${row.id || row.productId || row.code || row.name}`,
          rowId: row.id || row.productId || row.code || row.name,
          paid: parseNumber(entry.paid) / Math.max(1, rows.length),
          remaining: Math.max(0, total - (parseNumber(entry.paid) / Math.max(1, rows.length))),
          sold,
          supplierId: row.supplierId || entry.supplierId || '',
          total,
        }
      })
    })
  }, [godownEntries, products])

  const supplierAdjustments = useMemo(() => godownEntries.flatMap((entry) => entry.adjustments || []), [godownEntries])

  const supplierStats = useMemo(() => {
    const stats = new Map()
    suppliers.forEach((supplier) => {
      stats.set(supplier.id, {
        adjustmentBalance: 0,
        balance: parseNumber(supplier.balance),
        entries: [],
        lastDate: supplier.createdAt || supplier.date || todayInput(),
        profit: 0,
        purchaseValue: 0,
        supplier,
      })
    })
    supplierRows.forEach((row) => {
      const stat = stats.get(row.supplierId)
      if (!stat) return
      stat.entries.push(row)
      stat.purchaseValue += parseNumber(row.total)
      stat.profit += Math.max(0, parseNumber(row.selling) - parseNumber(row.purchase)) * parseNumber(row.quantity)
      if (String(row.date) > String(stat.lastDate)) stat.lastDate = row.date
    })
    supplierAdjustments.forEach((adjustment) => {
      const stat = stats.get(adjustment.supplierId)
      if (!stat) return
      stat.adjustmentBalance += adjustment.type === 'debit' ? parseNumber(adjustment.amount) : -parseNumber(adjustment.amount)
      if (String(adjustment.date) > String(stat.lastDate)) stat.lastDate = adjustment.date
    })
    stats.forEach((stat) => {
      const entryBalance = stat.entries.reduce((sum, row) => sum + parseNumber(row.remaining), 0)
      stat.balance = parseNumber(stat.supplier.balance) + entryBalance + stat.adjustmentBalance
      stat.statusKey = stat.balance > 0 ? 'payable' : stat.balance < 0 ? 'receivable' : 'settled'
    })
    return stats
  }, [supplierAdjustments, supplierRows, suppliers])

  const filteredSuppliers = suppliers.filter((supplier) => {
    const stat = supplierStats.get(supplier.id)
    const query = search.trim().toLowerCase()
    const text = [supplier.name, supplier.phone, supplier.address, supplier.currency].join(' ').toLowerCase()
    const matchesSearch = !query || text.includes(query)
    const matchesBalance = balanceFilter === 'all' || stat?.statusKey === balanceFilter
    const matchesDate = getDateMatches(stat?.lastDate, dateFilter, customStart, customEnd)
    return matchesSearch && matchesBalance && matchesDate
  })

  const totalPayables = Array.from(supplierStats.values()).reduce((sum, stat) => sum + Math.max(0, stat.balance), 0)
  const totalReceivables = Array.from(supplierStats.values()).reduce((sum, stat) => sum + Math.max(0, -stat.balance), 0)
  const netBalance = totalPayables - totalReceivables

  const saveSupplier = (supplier) => {
    onSuppliersChange((current) => {
      const exists = current.some((item) => item.id === supplier.id)
      return exists ? current.map((item) => (item.id === supplier.id ? supplier : item)) : [...current, supplier]
    })
    setModalOpen(false)
    setEditingSupplier(null)
    onNotify?.(t.savedSuccessfully)
  }

  const deleteSupplier = (supplier) => {
    onMoveToRecycle('suppliers', supplier)
  }

  const editSupplier = (supplier) => {
    setEditingSupplier(supplier)
    setModalOpen(true)
  }

  const openPortal = (supplier) => {
    setPortalSupplier(supplier)
    setPortalTab('ledger')
    setPortalDateFilter('all')
  }

  const saveAdjustment = (adjustment) => {
    if (!portalSupplier) return
    const record = {
      ...adjustment,
      createdAt: new Date().toISOString(),
      date: todayInput(),
      id: crypto.randomUUID(),
      supplierId: portalSupplier.id,
    }
    onGodownChange?.((current) => [
      {
        adjustments: [record],
        createdAt: record.createdAt,
        currency: record.currency,
        date: record.date,
        id: crypto.randomUUID(),
        paid: 0,
        remaining: 0,
        rows: [],
        supplierId: portalSupplier.id,
        total: 0,
        type: 'supplier-adjustment',
      },
      ...current,
    ])
    setAdjustmentOpen(false)
    onNotify?.(t.savedSuccessfully)
  }

  if (portalSupplier) {
    const stat = supplierStats.get(portalSupplier.id) || { balance: parseNumber(portalSupplier.balance), entries: [], profit: 0, purchaseValue: 0 }
    const portalEntries = stat.entries.filter((entry) => getDateMatches(entry.date, portalDateFilter, portalCustomStart, portalCustomEnd))
    const portalAdjustments = supplierAdjustments
      .filter((adjustment) => adjustment.supplierId === portalSupplier.id)
      .filter((adjustment) => getDateMatches(adjustment.date, portalDateFilter, portalCustomStart, portalCustomEnd))
    const ledgerRows = [
      ...portalEntries.map((entry) => ({
        balance: formatCurrencyMoney(entry.remaining, entry.currency),
        currency: entry.currency,
        date: getGregorianLabel(entry.date),
        description: entry.name || t.purchaseBill,
        deposit: '-',
        id: entry.id,
        kind: 'purchase',
        rawDate: entry.date,
        source: entry,
        withdraw: formatCurrencyMoney(entry.total, entry.currency),
      })),
      ...portalAdjustments.map((adjustment) => ({
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
        onGodownChange?.((current) => current
          .map((item) => {
            if (item.id !== row.source.entryId) return item
            const sourceRowId = row.source.rowId || row.source.id
            const rows = (item.rows || []).filter((line) => (line.id || line.productId || line.code || line.name) !== sourceRowId)
            const total = rows.reduce((sum, line) => sum + parseNumber(line.quantity) * parseNumber(line.purchase), 0)
            const paid = Math.min(parseNumber(item.paid), total)
            return { ...item, rows, total, paid, remaining: Math.max(0, total - paid) }
          })
          .filter((item) => (item.rows || []).length > 0 || (item.adjustments || []).length > 0))
      } else {
        onGodownChange?.((current) => current.map((item) => ({
          ...item,
          adjustments: (item.adjustments || []).filter((adjustment) => adjustment.id !== row.id),
        })))
      }
      onNotify?.(t.entryDeleted ?? t.delete)
    }
    const printPdfButton = (tab = portalTab) => (
      <button className="print-pdf-btn" type="button" onClick={() => openSupplierStatement(tab)}>
        <ReceiptText size={16} /> {t.printPdf ?? 'PRINT & PDF'}
      </button>
    )
    const purchaseValue = portalEntries.reduce((sum, entry) => sum + parseNumber(entry.total), 0)
    const soldValue = portalEntries.reduce((sum, entry) => sum + parseNumber(entry.selling) * parseNumber(entry.sold), 0)
    const profit = portalEntries.reduce((sum, entry) => sum + Math.max(0, parseNumber(entry.selling) - parseNumber(entry.purchase)) * parseNumber(entry.quantity), 0)
    const portalCurrency = portalSupplier.currency || portalEntries[0]?.currency || 'AFN'

    const openSupplierStatement = (tab = portalTab) => {
      const configs = {
        activity: {
          columns: [
            { key: 'action', label: t.actions },
            { key: 'description', label: t.description },
            { key: 'date', label: t.date },
          ],
          rows: ledgerRows.map((row) => ({ action: row.withdraw !== '-' ? t.withdraw : t.deposit, date: row.date, description: row.description, id: row.id })),
          title: `${portalSupplier.name} - ${t.activityLog ?? 'Activity Log'}`,
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
          rows: portalEntries.map((entry) => ({ code: entry.code || '-', id: entry.id, name: entry.name, profit: formatCurrencyMoney(parseNumber(entry.selling) - parseNumber(entry.purchase), entry.currency), purchase: formatCurrencyMoney(entry.purchase, entry.currency), quantity: `${entry.quantity} ${entry.unit}`, selling: formatCurrencyMoney(entry.selling, entry.currency) })),
          title: `${portalSupplier.name} - ${t.goods ?? 'Goods'}`,
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
          title: `${portalSupplier.name} - ${t.supplierLedger ?? 'Supplier Ledger'}`,
        },
        profit: {
          columns: [
            { key: 'name', label: t.name },
            { key: 'quantity', label: t.qtySold ?? 'Qty Sold' },
            { key: 'purchase', label: t.totalPurchaseValue ?? 'Total Purchase Value' },
            { key: 'sold', label: t.totalSoldValue ?? 'Total Sold Value' },
            { key: 'profit', label: t.grossProfit ?? 'Gross Profit' },
          ],
          rows: portalEntries.map((entry) => ({ id: entry.id, name: entry.name, profit: formatCurrencyMoney(Math.max(0, parseNumber(entry.selling) - parseNumber(entry.purchase)) * parseNumber(entry.quantity), entry.currency), purchase: formatCurrencyMoney(entry.total, entry.currency), quantity: `${entry.sold} ${entry.unit}`, sold: formatCurrencyMoney(parseNumber(entry.selling) * parseNumber(entry.sold), entry.currency) })),
          title: `${portalSupplier.name} - ${t.profit ?? 'Profit'}`,
        },
      }
      setStatementConfig({
        subtitle: `${t.account}: ${portalSupplier.name} - ${portalCurrency}`,
        ...configs[tab],
      })
    }

    return (
      <section className="entity-content supplier-portal-page">
        <div className="supplier-portal-head">
          <div className="back-title-row">
            <button className="back-btn" type="button" onClick={() => setPortalSupplier(null)}>‹</button>
            <div><h1>{t.supplierPortal ?? 'Supplier Portal'}: {portalSupplier.name}</h1><p>{portalSupplier.phone || '-'} · {portalSupplier.address || '-'} · {portalCurrency} · {t.accountCreated ?? 'Account Created'}: {getGregorianLabel(portalSupplier.createdAt || todayInput())}</p></div>
          </div>
          <button type="button" onClick={() => openSupplierStatement('ledger')}><ReceiptText size={16} /> {t.printStatement ?? t.printReport}</button>
        </div>
        <div className="supplier-account-card">
          <div><h2>{t.account}: {portalSupplier.name} - {portalCurrency}</h2><p>{t.printDate ?? 'Print Date'}: {new Date().toLocaleDateString('en-GB')}</p></div>
          <div className="supplier-balance-box"><span>{t.currentBalance ?? 'Current Balance'}</span><strong className={stat.balance > 0 ? 'danger-text' : 'success-text'}>{formatCurrencyMoney(Math.abs(stat.balance), portalCurrency)}</strong><small>{stat.balance > 0 ? t.payable : stat.balance < 0 ? t.receivable : t.settledPlain}</small></div>
          <div className="supplier-balance-box"><span>{t.previousBalance ?? 'Previous Balance'}</span><strong>{formatCurrencyMoney(0, portalCurrency)}</strong></div>
        </div>
        <div className="supplier-controls supplier-portal-controls">
          <button type="button" onClick={() => setAdjustmentOpen(true)}>↻ {t.addAdjustment ?? 'Add Adjustment'}</button>
          <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={portalDateFilter} onChange={setPortalDateFilter} />
          {portalDateFilter === 'custom' && <DateRangePicker className="supplier-date-range" end={portalCustomEnd} onChange={({ start, end }) => { setPortalCustomStart(start); setPortalCustomEnd(end) }} start={portalCustomStart} t={t} />}
        </div>
        <div className="godown-tabs supplier-tabs">
          {[
            { icon: <ReceiptText size={16} />, key: 'ledger', label: t.supplierLedger ?? 'Supplier Ledger' },
            { icon: <WalletCards size={16} />, key: 'goods', label: t.goods ?? 'Goods' },
            { icon: <BarChart3 size={16} />, key: 'profit', label: t.profit ?? 'Profit' },
            { icon: <CalendarDays size={16} />, key: 'activity', label: t.activityLog ?? 'Activity Log' },
          ].map((tab) => <button key={tab.key} className={portalTab === tab.key ? 'active' : ''} type="button" onClick={() => setPortalTab(tab.key)}>{tab.icon} {tab.label}</button>)}
        </div>
        <div className="supplier-section-card">
          {portalTab === 'ledger' && <><div className="supplier-card-head"><h2>{t.supplierLedger ?? 'Supplier Ledger'}</h2><div>{printPdfButton('ledger')}</div></div><table className="data-table godown-table"><thead><tr><th>{t.no}</th><th>{t.date}</th><th>{t.description}</th><th>{t.deposit}</th><th>{t.withdraw}</th><th>{t.balance}</th><th>{t.currency}</th><th>{t.actions}</th></tr></thead><tbody>{ledgerRows.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noLedgerEntries ?? 'No ledger entries'}</td></tr> : ledgerRows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td>{row.date}<small>{getShamsiShortLabel(row.rawDate)}</small></td><td>{row.description}</td><td>{row.deposit}</td><td className="danger-text">{row.withdraw}</td><td>{row.balance}</td><td>{row.currency}</td><td><FloatingActionMenu ariaLabel={t.actions} actions={[{ label: t.edit, onClick: () => onNotify?.(t.edit ?? 'Edit') }, { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => deleteLedgerRow(row) }]} /></td></tr>)}</tbody></table></>}
          {portalTab === 'goods' && <><div className="supplier-card-head"><h2>{t.goods ?? 'Goods'} ({portalEntries.length})</h2><div>{printPdfButton('goods')}</div></div><table className="data-table godown-table"><thead><tr><th>{t.name}</th><th>{t.code}</th><th>{t.totalImported}</th><th>{t.totalSold}</th><th>{t.remaining}</th><th>{t.purchasePrice}</th><th>{t.sellingPrice}</th><th>{t.profitPerUnit}</th></tr></thead><tbody>{portalEntries.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noRecordsFound ?? 'No records found'}</td></tr> : portalEntries.map((entry) => <tr key={entry.id}><td>{entry.name}</td><td>{entry.code || '-'}</td><td>{entry.quantity} {entry.unit}</td><td>{entry.sold} {entry.unit}</td><td>{Math.max(0, parseNumber(entry.quantity) - parseNumber(entry.sold))} {entry.unit}</td><td>{formatCurrencyMoney(entry.purchase, entry.currency)}</td><td>{formatCurrencyMoney(entry.selling, entry.currency)}</td><td className="success-text">{formatCurrencyMoney(parseNumber(entry.selling) - parseNumber(entry.purchase), entry.currency)}</td></tr>)}</tbody></table></>}
          {portalTab === 'profit' && <><div className="supplier-card-head"><h2>{t.profit ?? 'Profit'}</h2><div>{printPdfButton('profit')}</div></div><div className="supplier-metric-grid"><article><span>{t.totalPurchaseValue ?? 'Total Purchase Value'}</span><strong className="danger-text">{formatCurrencyMoney(purchaseValue, portalCurrency)}</strong></article><article><span>{t.totalSoldValue ?? 'Total Sold Value'}</span><strong>{formatCurrencyMoney(soldValue, portalCurrency)}</strong></article><article><span>{t.grossProfit ?? 'Gross Profit'}</span><strong className="success-text">{formatCurrencyMoney(profit, portalCurrency)}</strong></article></div><table className="data-table godown-table"><thead><tr><th>{t.name}</th><th>{t.qtySold ?? 'Qty Sold'}</th><th>{t.totalPurchaseValue ?? 'Total Purchase Value'}</th><th>{t.totalSoldValue ?? 'Total Sold Value'}</th><th>{t.grossProfit ?? 'Gross Profit'}</th></tr></thead><tbody>{portalEntries.length === 0 ? <tr><td className="empty-cell" colSpan="5">{t.noRecordsFound ?? 'No records found'}</td></tr> : portalEntries.map((entry) => <tr key={entry.id}><td>{entry.name}</td><td>{entry.sold} {entry.unit}</td><td>{formatCurrencyMoney(entry.total, entry.currency)}</td><td>{formatCurrencyMoney(parseNumber(entry.selling) * parseNumber(entry.sold), entry.currency)}</td><td className="success-text">{formatCurrencyMoney(Math.max(0, parseNumber(entry.selling) - parseNumber(entry.purchase)) * parseNumber(entry.quantity), entry.currency)}</td></tr>)}</tbody></table></>}
          {portalTab === 'activity' && <><div className="supplier-card-head"><h2>{t.activityLog ?? 'Activity Log'}</h2><div>{printPdfButton('activity')}</div></div>{ledgerRows.length === 0 ? <div className="empty-detail-state"><p>{t.noActivityRecordedYet ?? 'No activity recorded yet'}</p></div> : ledgerRows.map((row) => <div className="activity-log-row" key={row.id}><div><span></span><strong>{row.description}</strong><p>{row.date}</p></div><div className={row.withdraw !== '-' ? 'danger-text' : 'success-text'}>{row.withdraw !== '-' ? `-${row.withdraw}` : row.deposit}</div></div>)}</>}
        </div>
        {adjustmentOpen && <AdjustmentModal currencies={currencies.map((item) => item.code)} onClose={() => setAdjustmentOpen(false)} onSave={saveAdjustment} supplierName={portalSupplier.name} t={t} />}
        {statementConfig && <SupplierStatementModal {...statementConfig} companyInfo={companyInfo} onClose={() => setStatementConfig(null)} t={t} />}
      </section>
    )
  }

  return (
    <div className="entity-content suppliers-content">
      <div className="entity-heading">
        <div><h1>{t.suppliers}</h1><p>{t.manageSupplierLedgers}</p></div>
        <div className="entity-actions">
          <button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.print}</button>
          <button className="primary-btn" type="button" onClick={() => setModalOpen(true)}><Plus size={16} /> {t.createSupplierAccount}</button>
        </div>
      </div>
      <div className="summary-grid four supplier-summary-grid">
  <article className="supplier-summary-card tone-blue">
    <span>{t.totalSuppliers}</span>
    <strong>{suppliers.length}</strong>
    <WalletCards size={22} />
  </article>

  <article className="supplier-summary-card tone-orange">
    <span>{t.totalPayables}</span>
    <strong className="danger-text">{formatCurrencyMoney(totalPayables)}</strong>
    <BarChart3 size={22} />
  </article>

  <article className="supplier-summary-card tone-green">
    <span>{t.totalReceivables}</span>
    <strong className="success-text">{formatCurrencyMoney(totalReceivables)}</strong>
    <BarChart3 size={22} />
  </article>

  <article className="supplier-summary-card tone-navy">
    <span>{t.netBalance}</span>
    <strong className={netBalance > 0 ? 'danger-text' : 'success-text'}>
      {formatCurrencyMoney(Math.abs(netBalance))}
    </strong>
    <small>{netBalance > 0 ? (t.netPayable ?? 'Net Payable') : netBalance < 0 ? (t.netReceivable ?? 'Net Receivable') : t.settledPlain}</small>
    <DollarSign size={22} />
  </article>
</div>
      <div className="filter-card supplier-filter-card">
        <div className="supplier-filter-row">
          <div className="search-field"><Search size={17} /><input placeholder={t.searchSuppliers} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <CustomSelect ariaLabel={t.filter} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
          {dateFilter === 'custom' && <DateRangePicker className="inline-date-range" end={customEnd} onChange={({ start, end }) => { setCustomStart(start); setCustomEnd(end) }} start={customStart} t={t} />}
        </div>
        <div className="supplier-status-tabs">
          {balanceOptions.map((option) => <button className={balanceFilter === option.value ? 'active' : ''} key={option.value} type="button" onClick={() => setBalanceFilter(option.value)}>{option.label}</button>)}
        </div>
      </div>
      <div className="data-panel supplier-table-card">
        <table className="data-table supplier-table">
          <thead><tr><th>{t.name}</th><th>{t.phoneNumber}</th><th>{t.address}</th><th>{t.currency}</th><th>{t.balance}</th><th>{t.status}</th><th>{t.profit}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {filteredSuppliers.length === 0 ? <tr><td colSpan="8" className="empty-cell">{t.noSuppliersFound}</td></tr> : filteredSuppliers.map((supplier) => {
              const stat = supplierStats.get(supplier.id)
              const statusKey = stat?.statusKey || 'settled'
              const balance = stat?.balance || 0
              return (
                <tr key={supplier.id}>
                  <td><strong>{supplier.name}</strong></td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.address || '-'}</td>
                  <td>{supplier.currency || 'AFN'}</td>
                  <td><span className={balance > 0 ? 'danger-text' : balance < 0 ? 'success-text' : ''}>{formatCurrencyMoney(Math.abs(balance), supplier.currency || 'AFN')} {balance > 0 ? `(${t.payable})` : balance < 0 ? `(${t.receivable})` : ''}</span></td>
                  <td><span className={`supplier-status-pill ${statusKey}`}>{statusKey === 'payable' ? (t.owing ?? 'Owing') : statusKey === 'receivable' ? t.receivable : t.settledPlain}</span></td>
                  <td><strong className="success-text">{formatCurrencyMoney(stat?.profit || 0, supplier.currency || 'AFN')}</strong></td>
                  <td>
                    <ActionMenu
                      onDelete={deleteSupplier}
                      onEdit={() => editSupplier(supplier)}
                      onView={openPortal}
                      supplier={supplier}
                      t={t}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {modalOpen && <SupplierModal initialSupplier={editingSupplier} onClose={() => { setModalOpen(false); setEditingSupplier(null) }} onSave={saveSupplier} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={filteredSuppliers} title={t.supplierReport} columns={[{ key: 'name', label: t.name }, { key: 'phone', label: t.phoneNumber }, { key: 'currency', label: t.currency }, { key: 'balance', label: t.balance }]} t={t} />}
    </div>
  )
}

export default SuppliersPage
