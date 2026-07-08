import { useEffect, useMemo, useRef, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import { SupplierModal } from './Suppliers.jsx'
import { currencies, productUnits } from '../data/dashboardData.js'
import { Box, CalendarDays, Eye, ReceiptText, Search, SquareMenu, Trash2 } from '../components/Icons.jsx'
import './Products.css'

const emptyProduct = {
  name: '',
  code: '',
  barcode: '',
  category: 'Miscellaneous',
  purchase: '',
  selling: '',
  expiry: '',
  alertBefore: '1 month',
  lowStock: '',
  quantity: '',
  unit: 'Pieces (pcs)',
  currency: 'AFN',
  supplierId: '',
}

const alertBeforeOptions = ['1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year']
const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const formatMoney = (value, currency = 'AFN') => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '؋'}`

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

function ProductActionMenu({ isOpen, onBarcode, onDelete, onEdit, onToggle, onView, product, t }) {
  void isOpen
  void onToggle
  return <FloatingActionMenu ariaLabel={t.actions} actions={[
    { icon: <Eye size={15} />, label: t.view, onClick: () => onView(product) },
    { icon: <SquareMenu size={15} />, label: t.edit, onClick: onEdit },
    { icon: <ReceiptText size={15} />, label: t.printBarcode ?? t.viewBarcode, onClick: () => onBarcode(product) },
    { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => onDelete(product) },
  ]} />
}

function CategorySearchInput({ categories, onAdd, onChange, t, value }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const matches = categories
    .filter((category) => category.toLowerCase().includes(query.trim().toLowerCase()))

  const commit = (nextValue) => {
    const category = nextValue.trim()
    if (!category) return
    if (!categories.some((item) => item.toLowerCase() === category.toLowerCase())) onAdd(category)
    setQuery(category)
    onChange(category)
    setOpen(false)
  }

  return (
    <div className="category-search">
      <input
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value)
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={t.searchOrAddCategory ?? 'Search or add category'}
        value={query}
      />
      {open && (
        <div className="category-search-menu">
          {matches.map((category) => <button key={category} type="button" onMouseDown={() => commit(category)}>{category}</button>)}
          {query.trim() && !categories.some((category) => category.toLowerCase() === query.trim().toLowerCase()) && (
            <button className="add-category-option" type="button" onMouseDown={() => commit(query)}>+ {t.add}: {query.trim()}</button>
          )}
        </div>
      )}
    </div>
  )
}

function BarcodeGraphic({ code, labelSize = 'medium' }) {
  const value = String(code || '000000000000')
  const bars = Array.from(value).flatMap((digit, index) => {
    const width = (Number(digit) % 3) + 1
    return [{ width, gap: (index % 2) + 1 }, { width: 1, gap: 1 }]
  })
  const height = labelSize === 'small' ? 44 : labelSize === 'large' ? 78 : 62
  let x = 0
  return (
    <svg className={`barcode-svg ${labelSize}`} viewBox={`0 0 180 ${height + 20}`} role="img" aria-label={value}>
      {bars.map((bar, index) => {
        const currentX = x
        x += bar.width + bar.gap
        return <rect height={height} key={`${bar.width}-${index}`} width={bar.width} x={currentX * 2.2} y="0" />
      })}
      <text x="90" y={height + 13} textAnchor="middle">{value}</text>
    </svg>
  )
}

function ProductDateRangePicker({ end, onChange, start, t }) {
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
    <div className="product-date-range-picker" ref={rootRef}>
      <button className="product-date-range-btn" type="button" onClick={() => setOpen((current) => !current)}>
        <CalendarDays size={16} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="product-date-calendar">
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

function ProductDetailsModal({ onClose, product, t }) {
  const profit = parseNumber(product.selling) - parseNumber(product.purchase)
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-details-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <h2>{t.productDetails ?? 'Product Details'}</h2>
        <div className="product-detail-grid">
          <div className="wide"><strong>{t.productName}</strong><span>{product.name || '-'}</span></div>
          <div><strong>{t.code}</strong><span>{product.code || '-'}</span></div>
          <div><strong>{t.barcode}</strong><span>{product.barcode || '-'}</span></div>
          <div className="wide"><strong>{t.category}</strong><span className="soft-pill">{product.category || '-'}</span></div>
          <div><strong>{t.purchasePrice}</strong><span>{formatMoney(product.purchase, product.currency)}</span></div>
          <div><strong>{t.sellingPrice}</strong><span>{formatMoney(product.selling, product.currency)}</span></div>
          <div><strong>{t.expiryDate} <small>({t.optional})</small></strong><span>{product.expiry || '-'}</span></div>
          <div><strong>{t.alertMeBefore}</strong><span>{product.alertBefore || '-'}</span></div>
          <div><strong>{t.lowStockThreshold} <small>({t.optional})</small></strong><span>{product.lowStock || '-'}</span></div>
          <div><strong>{t.profitPerUnit ?? 'Profit per Unit'}</strong><span className={profit >= 0 ? 'success-text' : 'danger-text'}>{formatMoney(profit, product.currency)}</span></div>
          <div><strong>{t.quantity}</strong><span>{product.quantity || 0} {product.unit}</span></div>
          <div><strong>{t.unit}</strong><span>{product.unit || '-'}</span></div>
          <div><strong>{t.currency}</strong><span>{product.currency || 'AFN'}</span></div>
        </div>
      </div>
    </div>
  )
}

function BarcodeModal({ onClose, onNotify, product, t }) {
  const [labelSize, setLabelSize] = useState('medium')
  const [labelsPerPage, setLabelsPerPage] = useState('1')
  const labelOptions = [
    { value: 'small', label: t.smallLabel ?? 'Small (30×15mm)' },
    { value: 'medium', label: t.mediumLabel ?? 'Medium (50×25mm)' },
    { value: 'large', label: t.largeLabel ?? 'Large (70×35mm)' },
  ]
  const printBarcode = () => {
    const count = Math.max(1, Math.min(200, Number.parseInt(labelsPerPage, 10) || 1))
    const labels = Array.from({ length: count }, () => `
      <div class="barcode-label ${labelSize}">
        <div class="product-name">${product.name || ''}</div>
        <div class="bars">${document.querySelector('.barcode-preview .barcode-svg')?.outerHTML || ''}</div>
        <div class="product-code">${product.code || ''}</div>
      </div>
    `).join('')
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>${t.printBarcode ?? 'Print Barcode'}</title><style>
      body{margin:18px;font-family:Arial,sans-serif;color:#111}.barcode-sheet{display:flex;flex-wrap:wrap;gap:10px}
      .barcode-label{display:grid;place-items:center;border:1px solid #d8dee9;border-radius:6px;padding:5px;break-inside:avoid}
      .barcode-label.small{width:30mm;height:15mm}.barcode-label.medium{width:50mm;height:25mm}.barcode-label.large{width:70mm;height:35mm}
      .product-name{font-size:10px;font-weight:700}.product-code{font-size:9px}.barcode-svg{width:88%;height:auto}.barcode-svg rect{fill:#111}.barcode-svg text{font-size:9px}
      @media print{body{margin:8mm}.barcode-sheet{gap:4mm}}
    </style></head><body><div class="barcode-sheet">${labels}</div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }
  const copyBarcode = async () => {
    const value = product.barcode || product.code || ''
    if (!value) return
    await navigator.clipboard?.writeText(value)
    onNotify?.(`${t.barcodeCopied ?? 'Barcode Copied'}: ${value}`)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="barcode-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <h2>{t.barcode} — {product.name}</h2>
        <div className={`barcode-preview ${labelSize}`}>
          <BarcodeGraphic code={product.barcode || product.code} labelSize={labelSize} />
        </div>
        <label><span>{t.labelSize ?? 'Label Size'}</span><CustomSelect ariaLabel={t.labelSize ?? 'Label Size'} options={labelOptions} value={labelSize} onChange={setLabelSize} /></label>
        <label><span>{t.labelsPerPage ?? 'Labels per Page'}</span><input min="1" type="number" value={labelsPerPage} onChange={(event) => setLabelsPerPage(event.target.value)} /></label>
        <button className="primary-btn barcode-print-btn" type="button" onClick={printBarcode}><ReceiptText size={16} /> {t.printBarcode ?? 'Print Barcode'}</button>
        <button type="button" onClick={copyBarcode}>{t.copy ?? 'Copy'}</button>
      </div>
    </div>
  )
}

function ProductModal({ categories, initialProduct, onCategoryAdd, onClose, onProductSave, onSupplierSave, suppliers, t }) {
  const [form, setForm] = useState(initialProduct ?? emptyProduct)
  const [marginPercent, setMarginPercent] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [categoryMode, setCategoryMode] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }
  const generateBarcode = () => update('barcode', String(Math.floor(2000000000000 + Math.random() * 900000000000)))
  const alertOptions = alertBeforeOptions.map((item) => ({ value: item, label: t.alertOptions?.[item] ?? item }))
  const unitOptions = productUnits.map((item) => ({ value: item, label: item }))
  const currencyOptions = currencies.map((item) => ({ value: item.code, label: item.code }))
  const supplierOptions = [
    { value: '', label: t.selectSupplier },
    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  ]
  const purchase = parseNumber(form.purchase)
  const selling = parseNumber(form.selling)
  const profit = selling - purchase
  const margin = purchase > 0 ? (profit / purchase) * 100 : 0
  const applyMargin = () => {
    if (!purchase) return
    update('selling', String((purchase * (1 + parseNumber(marginPercent) / 100)).toFixed(2)))
  }
  const saveCategory = () => {
    const category = newCategory.trim()
    if (!category) return
    onCategoryAdd(category)
    update('category', category)
    setNewCategory('')
    setCategoryMode(false)
  }

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <form
        className="entity-modal product-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!form.name.trim() || !form.category.trim()) return
          onProductSave({ ...form, createdAt: form.createdAt ?? new Date().toISOString(), id: form.id ?? crypto.randomUUID(), status: Number(form.quantity || 0) > 0 ? 'In Stock' : 'Out of Stock' })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <h2>{initialProduct ? t.editProduct : t.addNewProduct}</h2>
        <label className="wide"><span>{t.productName} <em className="required-star">*</em></span><input className={submitted && !form.name.trim() ? 'field-invalid' : ''} placeholder={t.productNamePlaceholder} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label className="wide"><span>{t.code}</span><input placeholder={t.codePlaceholder} value={form.code} onChange={(e) => update('code', e.target.value)} /></label>
        <label className="wide"><span>{t.barcode}</span><div className="inline-field"><input placeholder={t.barcodePlaceholder} value={form.barcode} onChange={(e) => update('barcode', e.target.value)} /><button className="barcode-generate-btn" type="button" onClick={generateBarcode}>⟳</button></div></label>
        <label className="wide">
          <span className="label-row">
            <span>{t.category} <em className="required-star">*</em></span>
            <button
              className="tiny-plus"
              type="button"
              title="Add Category"
              onClick={() => setCategoryMode(true)}
            >
              +
            </button>
          </span>
          {categoryMode ? (
            <div className="inline-field">
              <input autoFocus placeholder={t.categoryName ?? 'Category name'} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
              <button type="button" onClick={saveCategory}>{t.add}</button>
              <button type="button" onClick={() => { setCategoryMode(false); setNewCategory('') }}>{t.cancel}</button>
            </div>
          ) : <CategorySearchInput categories={categories} onAdd={onCategoryAdd} onChange={(value) => update('category', value)} t={t} value={form.category} />}
        </label>
        <label><span>{t.purchasePrice}</span><input placeholder="0.00" value={form.purchase} onChange={(e) => update('purchase', e.target.value)} /></label>
        <label><span>{t.sellingPrice}</span><input placeholder="0.00" value={form.selling} onChange={(e) => update('selling', e.target.value)} /></label>
        <div className="margin-helper wide"><strong>% {t.marginHelper}</strong><div className="inline-field"><input placeholder="e.g. 30" value={marginPercent} onChange={(event) => setMarginPercent(event.target.value)} /><button className="margin-apply-btn" type="button" onClick={applyMargin}>{t.applyPercent}</button></div><small>{t.marginFormula}</small></div>
        <label><span>{t.expiryDate} <small>({t.optional})</small></span><input type="date" value={form.expiry} onChange={(e) => update('expiry', e.target.value)} /></label>
        <label>
          <span>{t.alertMeBefore}</span>
          <CustomSelect ariaLabel={t.alertMeBefore} options={alertOptions} value={form.alertBefore} onChange={(value) => update('alertBefore', value)} />
        </label>
        <label className="wide"><span>{t.lowStockThreshold} <small>({t.optional})</small></span><input placeholder="e.g. 10 pcs" value={form.lowStock} onChange={(e) => update('lowStock', e.target.value)} /></label>
        {(form.purchase || form.selling) && (
          <div className="profit-per-unit wide">
            <span>{t.profitPerUnit ?? 'Profit per Unit'}:</span>
            <strong className={profit >= 0 ? 'success-text' : 'danger-text'}>{formatMoney(profit, form.currency)} <small>({margin.toFixed(1)}% {t.margin ?? 'margin'})</small></strong>
          </div>
        )}
        <div className="inventory-line wide">
          <label className="col-4"><span>{t.quantity}</span><input placeholder="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} /></label>
          <label className="col-4"><span>{t.unit}</span><CustomSelect ariaLabel={t.unit} options={unitOptions} value={form.unit} onChange={(value) => update('unit', value)} /></label>
          <label className="col-4"><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={form.currency} onChange={(value) => update('currency', value)} /></label>
        </div>
        <label className="wide supplier-select-box"><span>{t.suppliers} <small>({t.optional})</small></span><div className="inline-field"><CustomSelect ariaLabel={t.suppliers} options={supplierOptions} value={form.supplierId} onChange={(value) => update('supplierId', value)} /><button className="supplier-custom-btn" type="button" onClick={(event) => { event.stopPropagation(); setSupplierModalOpen(true) }}>+</button></div></label>
        <button className="primary-btn wide" type="submit">{initialProduct ? t.saveChanges : t.addProduct}</button>
      </form>
      {supplierModalOpen && (
        <SupplierModal
          onClose={() => setSupplierModalOpen(false)}
          onSave={(supplier) => {
            onSupplierSave(supplier)
            update('supplierId', supplier.id)
            setSupplierModalOpen(false)
          }}
          t={t}
        />
      )}
    </div>
  )
}

function ProductsPage({ categories, companyInfo, onCategoryAdd, onMoveToRecycle, onNotify, onProductsChange, onSuppliersChange, printSettings, products, suppliers, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [viewProduct, setViewProduct] = useState(null)
  const [barcodeProduct, setBarcodeProduct] = useState(null)

  const categoryOptions = useMemo(() => {
    const usedCategories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    return [
      { value: 'all', label: t.allCategories },
      ...usedCategories.map((item) => ({ value: item, label: item })),
    ]
  }, [products, t.allCategories])

  const stockOptions = useMemo(() => [
    { value: 'all', label: t.stockStatusAll },
    { value: 'in', label: t.inStock },
    { value: 'low', label: t.lowStock },
    { value: 'out', label: t.outOfStock },
    { value: 'expiring', label: t.expiringSoon },
    { value: 'expired', label: t.expired },
  ], [t.expired, t.expiringSoon, t.inStock, t.lowStock, t.outOfStock, t.stockStatusAll])

  const dateOptions = useMemo(() => [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today ?? 'Today' },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ], [t.allTime, t.annual, t.custom, t.monthly, t.today, t.weekly])

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const soon = new Date()
    soon.setDate(today.getDate() + 30)
    const dateFromRange = {
      start: customStartDate ? new Date(`${customStartDate}T00:00:00`) : null,
      end: customEndDate ? new Date(`${customEndDate}T23:59:59`) : null,
    }
    return products.filter((product) => {
      const quantity = Number(product.quantity || 0)
      const lowStock = Number(product.lowStock || 0)
      const expiryDate = product.expiry ? new Date(`${product.expiry}T12:00:00`) : null
      const createdAt = product.createdAt ? new Date(product.createdAt) : null
      const daysOld = createdAt ? Math.floor((today - new Date(createdAt.toDateString())) / 86400000) : 0
      const matchesSearch = !needle || `${product.name} ${product.code} ${product.barcode}`.toLowerCase().includes(needle)
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'in' && quantity > 0)
        || (stockFilter === 'out' && quantity <= 0)
        || (stockFilter === 'low' && quantity > 0 && lowStock > 0 && quantity <= lowStock)
        || (stockFilter === 'expired' && expiryDate && expiryDate < today)
        || (stockFilter === 'expiring' && expiryDate && expiryDate >= today && expiryDate <= soon)
      const matchesDate = dateFilter === 'all'
        || !createdAt
        || (dateFilter === 'today' && daysOld === 0)
        || (dateFilter === 'weekly' && daysOld <= 7)
        || (dateFilter === 'monthly' && daysOld <= 31)
        || (dateFilter === 'annual' && daysOld <= 366)
        || (dateFilter === 'custom' && (!dateFromRange.start || createdAt >= dateFromRange.start) && (!dateFromRange.end || createdAt <= dateFromRange.end))
      return matchesSearch && matchesCategory && matchesStock && matchesDate
    })
  }, [categoryFilter, customEndDate, customStartDate, dateFilter, products, search, stockFilter])

  const saveProduct = (product) => {
    onProductsChange((current) => {
      const exists = current.some((item) => item.id === product.id)
      return exists ? current.map((item) => item.id === product.id ? product : item) : [...current, product]
    })
    setModalOpen(false)
    setEditingProduct(null)
    onNotify?.(t.savedSuccessfully)
  }

  const saveSupplier = (supplier) => {
    onSuppliersChange((current) => [...current, supplier])
  }

  const deleteProduct = (product) => {
    onMoveToRecycle('products', product)
  }

  const editProduct = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  return (
    <div className="entity-content products-content">
      <div className="entity-heading">
        <div><h1>{t.products}</h1><p>{t.manageProductInventory}</p></div>
        <div className="entity-actions"><button type="button" onClick={() => setPrintOpen(true)}>{t.printReport}</button><button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.addProduct}</button></div>
      </div>
      <div className="filter-card">
        <div className="products-search-field"><Search size={17} />
        <input placeholder={t.searchProducts} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <CustomSelect ariaLabel={t.category} options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} />
        <CustomSelect ariaLabel={t.stock} className="stock-select" options={stockOptions} value={stockFilter} onChange={setStockFilter} />
        <div className="products-date-filter"><CalendarDays size={16} /><CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} /></div>
        {dateFilter === 'custom' && (
          <ProductDateRangePicker
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
      <div className="data-panel">
        <h2 className="products-panel-title"><Box size={20} /> {t.products} ({filteredProducts.length})</h2>
        <table className="data-table">
          <thead><tr><th>{t.name}</th><th>{t.code}</th><th>{t.category}</th><th>{t.purchase}</th><th>{t.selling}</th><th>{t.profit}</th><th>{t.stock}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {filteredProducts.length === 0 ? <tr><td colSpan="9" className="empty-cell">{t.noProductsFound}</td></tr> : filteredProducts.map((product) => {
              const profit = Number(product.selling || 0) - Number(product.purchase || 0)
              return (
                <tr key={product.id}>
                  <td>{product.name}</td><td>{product.code}</td><td><span className="soft-pill">{product.category}</span></td><td>{product.purchase || '0.00'} ؋</td><td>{product.selling || '0.00'} ؋</td><td className="success-text">{profit.toFixed(2)} ؋</td><td>{product.quantity || 0} {product.unit}</td><td><span className={product.status === 'Out of Stock' ? 'status-pill danger' : 'status-pill active'}>{product.status === 'Out of Stock' ? t.outOfStock : t.inStock}</span></td>
                  <td>
                    <ProductActionMenu
                      onBarcode={setBarcodeProduct}
                      onDelete={deleteProduct}
                      onEdit={() => editProduct(product)}
                      onView={setViewProduct}
                      product={product}
                      t={t}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {modalOpen && <ProductModal categories={categories} initialProduct={editingProduct} onCategoryAdd={onCategoryAdd} onClose={() => { setModalOpen(false); setEditingProduct(null) }} onProductSave={saveProduct} onSupplierSave={saveSupplier} suppliers={suppliers} t={t} />}
      {viewProduct && <ProductDetailsModal onClose={() => setViewProduct(null)} product={viewProduct} t={t} />}
      {barcodeProduct && <BarcodeModal onClose={() => setBarcodeProduct(null)} onNotify={onNotify} product={barcodeProduct} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={filteredProducts} title={t.productInventoryReport} columns={[{ key: 'name', label: t.name }, { key: 'code', label: t.code }, { key: 'category', label: t.category }, { key: 'purchase', label: t.purchase }, { key: 'selling', label: t.selling }, { key: 'quantity', label: t.stock }, { key: 'status', label: t.status }]} t={t} />}
    </div>
  )
}

export default ProductsPage
