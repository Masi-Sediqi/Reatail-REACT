import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Camera,
  CreditCard,
  Download,
  Mail,
  MessageCircle,
  Printer,
  ReceiptText,
  Search,
  Share2,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from '../components/Icons.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import { formatBusinessCurrencyAmount } from '../utils/currencyExchange.js'
import './Billing.css'

const currencyOptions = [
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SAR', symbol: 'ریال', name: 'Saudi Riyal' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'IRR', symbol: 'ریال', name: 'Iranian Rial' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
]

const defaultPaymentMethods = ['cash', 'creditCard', 'bankTransfer', 'onlinePayment']
const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseMoney = (value) => Number.parseFloat(value || 0) || 0

const getCurrency = (code) => currencyOptions.find((item) => item.code === code) ?? currencyOptions[0]

const formatMoney = (value, currencyCode) => {
  return formatBusinessCurrencyAmount(value, getCurrency(currencyCode).code)
}

const getGregorianLabel = (isoDate) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const getShamsiLabel = (isoDate) => {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${isoDate}T12:00:00`))
  } catch {
    return isoDate
  }
}

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

function CurrencySelect({ label, onChange, value }) {
  const options = currencyOptions.map((currency) => ({
    label: `${currency.symbol} ${currency.name}`,
    value: currency.code,
  }))

  return (
    <div className="billing-field currency-field">
      <span>{label}</span>
      <CustomSelect ariaLabel={label} className="currency-select" options={options} value={value} onChange={onChange} />
    </div>
  )
}

function ScannerModal({ onClose, onScan, t }) {
  const [manualCode, setManualCode] = useState('')
  const [cameraState, setCameraState] = useState('idle')
  const [closing, setClosing] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const frameRef = useRef(0)

  const stopCamera = () => {
    window.cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    stopCamera()
    window.setTimeout(onClose, 160)
  }

  const submitManual = () => {
    const code = manualCode.trim()
    if (!code) return
    onScan(code)
    setManualCode('')
  }

  const startCamera = async () => {
    try {
      setCameraState('starting')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraState('active')

      if (!('BarcodeDetector' in window)) return
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code'] })
      const scan = async () => {
        try {
          if (videoRef.current?.readyState >= 2) {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              onScan(codes[0].rawValue)
              requestClose()
              return
            }
          }
        } catch {
          setCameraState('manual')
        }
        frameRef.current = window.requestAnimationFrame(scan)
      }
      frameRef.current = window.requestAnimationFrame(scan)
    } catch {
      setCameraState('denied')
    }
  }

  useEffect(() => stopCamera, [])

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="scanner-modal" onClick={(event) => event.stopPropagation()}>
        <h2><Camera size={18} /> {t.barcodeScanner}</h2>
        <div className="scanner-view">
          <video ref={videoRef} muted playsInline />
          {cameraState !== 'active' && (
            <div className="scanner-placeholder">
              <Camera size={54} />
              <span>{cameraState === 'denied' ? t.cameraDenied : t.pointCamera}</span>
              <button type="button" onClick={startCamera}>{cameraState === 'starting' ? t.scanning : t.startCamera}</button>
            </div>
          )}
        </div>
        <label className="manual-scan">
          <span>{t.manualInput}</span>
          <div>
            <input
              autoFocus
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitManual()}
              placeholder={t.enterBarcode}
            />
            <button type="button" onClick={submitManual}><Search size={16} /> {t.search}</button>
          </div>
        </label>
        <small>{t.scanHint}</small>
      </div>
    </div>
  )
}

function InvoicePreviewModal({ companyInfo, invoice, onClose, t }) {
  const [closing, setClosing] = useState(false)
  const invoiceRef = useRef(null)
  const encodedSubject = encodeURIComponent(`${t.invoicePreview} ${invoice.invoiceNumber}`)
  const encodedBody = encodeURIComponent(`${invoice.invoiceNumber}\n${invoice.customerName}\n${formatMoney(invoice.total, invoice.currency)}`)

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }

  const openPrint = () => {
    const html = invoiceRef.current?.outerHTML
    if (!html) return
    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) return
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap');
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4; margin: 10mm; }
            body { margin: 0; background: #e5e7eb; font-family: "Vazirmatn", Arial, sans-serif; }
            .invoice-paper { width: 190mm; min-height: 270mm; margin: 0 auto; background: #fff; color: #111827; position: relative; overflow: hidden; }
            .invoice-ribbon { height: 62px; background: linear-gradient(100deg, #1e5265, #20c765); border-bottom-left-radius: 58% 22px; border-bottom-right-radius: 8px; }
            .invoice-head { display: flex; justify-content: space-between; gap: 24px; padding: 22px 38px 12px; }
            .invoice-brand { display: flex; align-items: center; gap: 16px; }
            .invoice-logo { width: 80px; height: 46px; border-radius: 14px; object-fit: cover; background: #e5e7eb; }
            .invoice-title-box { border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 6px; padding: 12px 18px; text-align: right; }
            .invoice-title-box h1 { margin: 0; color: #16a34a; letter-spacing: 3px; font-size: 18px; }
            .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; margin: 28px 38px 8px; font-size: 12px; }
            .invoice-table { width: calc(100% - 76px); margin: 12px 38px; border-collapse: collapse; }
            .invoice-table th, .invoice-table td { padding: 11px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: left; }
            .invoice-table th { background: #f1f5f9; color: #1e3a5f; letter-spacing: 1px; }
            .invoice-watermark { position: absolute; left: 50%; top: 68%; transform: translate(-50%, -50%); width: 180px; height: 180px; border-radius: 30px; background: #f1f5f9; display: grid; place-items: center; color: #fff; font-size: 96px; opacity: .72; }
            .invoice-summary { width: 300px; margin: 18px 38px 0 auto; display: grid; gap: 7px; font-size: 12px; }
            .invoice-summary div { display: flex; justify-content: space-between; gap: 20px; }
            .invoice-summary .remaining-total strong { color: #f59e0b; }
            .invoice-summary .grand { border-top: 1px solid #cbd5e1; padding-top: 8px; font-weight: 800; }
            @media print { body { background: #fff; } .invoice-paper { width: 190mm; min-height: auto; margin: 0 auto; } }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 250)
  }

  return (
    <div className={`modal-backdrop print-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="invoice-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="invoice-preview-top">
          <strong>{t.invoicePreview} — {invoice.invoiceNumber}</strong>
          <div className="print-action-bar">
            <button type="button" onClick={requestClose}><X size={14} /> {t.cancel}</button>
            <button type="button" onClick={() => navigator.share?.({ title: invoice.invoiceNumber, text: encodedBody })}><Share2 size={15} /> {t.share}</button>
            <a className="print-top-link" href={`https://wa.me/?text=${encodedSubject}%20${encodedBody}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a>
            <a className="print-top-link" href={`mailto:?subject=${encodedSubject}&body=${encodedBody}`}><Mail size={15} /> Email</a>
            <button type="button" onClick={openPrint}><Download size={15} /> PDF</button>
            <button className="primary-btn print-confirm-btn" type="button" onClick={openPrint}><Printer size={15} /> {t.print}</button>
          </div>
        </div>
        <div className="invoice-scroll">
          <article className="invoice-paper" ref={invoiceRef}>
            <div className="invoice-ribbon" />
            <header className="invoice-head">
              <div className="invoice-brand">
                {companyInfo.logo ? <img className="invoice-logo" src={companyInfo.logo} alt="" /> : <div className="invoice-logo" />}
                <div>
                  <h2>{companyInfo.name || 'RetailPro'}</h2>
                  <p>{companyInfo.tagline || t.retailManagement}</p>
                </div>
              </div>
              <div className="invoice-title-box">
                <h1>INVOICE</h1>
                <span>#{invoice.invoiceNumber}</span>
              </div>
            </header>
            <div className="invoice-dev">{t.invoiceDevLine}</div>
            <section className="invoice-meta">
              <span>{t.billTo}: <strong>{invoice.customerName}</strong></span>
              <span>{t.status}: <strong className={invoice.paymentStatus === 'paid' ? 'success-text' : 'warning-text'}>{invoice.paymentStatus === 'paid' ? t.paid : t.loan}</strong></span>
              <span>{t.invoice}: <strong>{invoice.invoiceNumber}</strong></span>
              <span>{t.date}: <strong>{getGregorianLabel(invoice.date)}</strong> / {getShamsiShortLabel(invoice.date)}</span>
              <span>{t.paymentMethod}: <strong>{t[invoice.paymentMethod] ?? invoice.paymentMethod}</strong></span>
              <span>{t.total}: <strong>{formatMoney(invoice.total, invoice.currency)}</strong></span>
            </section>
            <table className="invoice-table">
              <thead>
                <tr><th>{t.item}</th><th>{t.code}</th><th>{t.qty}</th><th>{t.price}</th><th>{t.total}</th></tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.name}</td>
                    <td>{item.code}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{formatMoney(item.price, invoice.currency)}</td>
                    <td><strong>{formatMoney(item.lineTotal, invoice.currency)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-summary">
              <div><span>{t.subtotal}</span><strong>{formatMoney(invoice.subtotal, invoice.currency)}</strong></div>
              <div><span>{t.discount}</span><strong>{formatMoney(invoice.discountTotal, invoice.currency)}</strong></div>
              {invoice.balance > 0 && <div className="remaining-total"><span>{t.remaining}</span><strong>{formatMoney(invoice.balance, invoice.currency)}</strong></div>}
              <div className="grand"><span>{t.total}</span><strong>{formatMoney(invoice.total, invoice.currency)}</strong></div>
            </div>
            <div className="invoice-watermark">$</div>
          </article>
        </div>
      </div>
    </div>
  )
}

function CustomerSearchSelect({ customers, onChange, t, value }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selectedCustomer = customers.find((customer) => customer.id === value)
  const filteredCustomers = customers
    .filter((customer) => `${customer.name} ${customer.phone || ''} ${customer.email || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8)

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="customer-search-select" ref={rootRef}>
      <button className="customer-search-btn" type="button" onClick={() => setOpen((current) => !current)}>
        <span>{selectedCustomer?.name || t.selectCustomer}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="customer-search-menu">
          <div className="customer-search-input">
            <Search size={15} />
            <input
              autoFocus
              placeholder={t.searchCustomer ?? t.searchCustomers ?? 'Search customer...'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            className={!value ? 'selected' : ''}
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
              setQuery('')
            }}
          >
            {t.selectCustomer}
          </button>
          {filteredCustomers.map((customer) => (
            <button
              className={customer.id === value ? 'selected' : ''}
              key={customer.id}
              type="button"
              onClick={() => {
                onChange(customer.id)
                setOpen(false)
                setQuery('')
              }}
            >
              <span>{customer.name}</span>
              {(customer.phone || customer.email) && <small>{customer.phone || customer.email}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BillingPage({
  companyInfo,
  customers,
  editingSale,
  onCancelEdit,
  onCustomersChange,
  onEditComplete,
  onNotify,
  onProductsChange,
  onSalesChange,
  products,
  sales,
  t,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [walkInName, setWalkInName] = useState('')
  const [currency, setCurrency] = useState('AFN')
  const [discountMode, setDiscountMode] = useState('flat')
  const [discount, setDiscount] = useState('0')
  const [dateMode, setDateMode] = useState('greg')
  const [billDate, setBillDate] = useState(formatDateInput(new Date()))
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmountInput, setPaidAmountInput] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [scannerEnabled, setScannerEnabled] = useState(true)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const isEditing = Boolean(editingSale)
  const paymentMethodOptions = useMemo(() => defaultPaymentMethods.map((method) => ({ value: method, label: t[method] })), [t])

  useEffect(() => {
    if (!editingSale) return
    setItems(editingSale.items.map((item) => {
      const product = products.find((current) => current.id === item.productId)
      return {
        ...item,
        discount: parseMoney(item.discount),
        price: parseMoney(item.price),
        quantity: parseMoney(item.quantity) || 1,
        stock: parseMoney(product?.quantity) + parseMoney(item.quantity),
      }
    }))
    setCustomerId(editingSale.customerId || '')
    setWalkInName(editingSale.customerId ? '' : editingSale.customerName || '')
    setCurrency(editingSale.currency || 'AFN')
    setDiscountMode(editingSale.discountMode || 'flat')
    setDiscount(String(editingSale.discount ?? 0))
    setBillDate(editingSale.date || formatDateInput(new Date()))
    setPaymentMethod(editingSale.paymentMethod || 'cash')
    setPaidAmountInput(String(editingSale.paidAmount ?? ''))
    setPaymentError('')
    setSearchTerm('')
  }, [editingSale, products])

  const findProduct = (query) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return null
    return products.find((product) => [product.barcode, product.code, product.name].some((value) => String(value || '').toLowerCase() === needle))
      ?? products.find((product) => [product.barcode, product.code, product.name].some((value) => String(value || '').toLowerCase().includes(needle)))
  }

  const addProductToBill = (query) => {
    const product = findProduct(query)
    if (!product) {
      onNotify?.(t.productNotFound)
      return
    }
    const stock = parseMoney(product.quantity)
    if (stock <= 0) {
      onNotify?.(t.outOfStock ?? 'Out of stock')
      return
    }
    setItems((current) => {
      const exists = current.find((item) => item.productId === product.id)
      if (exists) {
        if (exists.quantity >= stock) {
          onNotify?.(t.insufficientStock)
          return current
        }
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name || t.product,
          code: product.code || product.barcode || '-',
          unit: product.unit || 'pcs',
          price: parseMoney(product.selling),
          discount: 0,
          quantity: 1,
          stock,
        },
      ]
    })
    setSearchTerm('')
  }

  const searchResults = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    if (!needle) return []
    return products
      .filter((product) => [product.barcode, product.code, product.name].some((value) => String(value || '').toLowerCase().includes(needle)))
      .slice(0, 6)
  }, [products, searchTerm])

  const updateItem = (productId, patch) => {
    setItems((current) => current.map((item) => {
      if (item.productId !== productId) return item
      const nextItem = { ...item, ...patch }
      if ('quantity' in patch) {
        const requestedQuantity = Math.max(1, parseMoney(patch.quantity))
        nextItem.quantity = item.stock > 0 ? Math.min(item.stock, requestedQuantity) : 1
        if (requestedQuantity > item.stock) onNotify?.(t.insufficientStock)
      }
      return nextItem
    }))
  }

  const removeItem = (productId) => setItems((current) => current.filter((item) => item.productId !== productId))

  const subtotal = useMemo(() => items.reduce((sum, item) => {
    const lineBeforeDiscount = item.price * item.quantity
    return sum + Math.max(0, lineBeforeDiscount - parseMoney(item.discount))
  }, 0), [items])

  const billDiscount = discountMode === 'percent' ? subtotal * (parseMoney(discount) / 100) : parseMoney(discount)
  const total = Math.max(0, subtotal - billDiscount)
  const paidAmountValue = parseMoney(paidAmountInput)
  const paymentTooHigh = paidAmountValue > total
  const balanceDue = Math.max(0, total - Math.min(paidAmountValue, total))
  const autoPaymentStatus = balanceDue <= 0 ? 'paid' : 'loan'

  const createInvoice = () => {
    const selectedCustomer = customers.find((customer) => customer.id === customerId)
    const invoiceNumber = editingSale?.invoiceNumber || `INV-${billDate.replaceAll('-', '').slice(2)}-${String(sales.length + 1).padStart(3, '0')}`
    const paidAmount = Math.min(paidAmountValue, total)
    const balance = Math.max(0, total - paidAmount)
    return {
      id: editingSale?.id || crypto.randomUUID(),
      invoiceNumber,
      customerId: selectedCustomer?.id || '',
      customerName: selectedCustomer?.name || walkInName.trim() || t.walkInCustomer,
      currency,
      date: billDate,
      items: items.map((item) => {
        const lineTotal = Math.max(0, item.price * item.quantity - parseMoney(item.discount))
        return { ...item, lineTotal }
      }),
      subtotal,
      discountMode,
      discount: parseMoney(discount),
      discountTotal: billDiscount,
      total,
      paidAmount,
      balance,
      paymentMethod,
      paymentStatus: balance <= 0 ? 'paid' : 'loan',
      paymentHistory: editingSale?.paymentHistory || [],
      createdAt: editingSale?.createdAt || new Date().toISOString(),
      updatedAt: isEditing ? new Date().toISOString() : undefined,
    }
  }

  const saveInvoice = (shouldPrint = false) => {
    if (items.length === 0) {
      onNotify?.(t.addItemsToBill)
      return
    }
    if (paymentTooHigh) {
      setPaymentError(t.paidAmountCannotExceedTotal)
      onNotify?.(t.paidAmountCannotExceedTotal)
      return
    }
    setPaymentError('')
    const invoice = createInvoice()
    onSalesChange((current) => isEditing ? current.map((sale) => (sale.id === invoice.id ? invoice : sale)) : [invoice, ...current])
    onProductsChange((current) => current.map((product) => {
      const soldItem = invoice.items.find((item) => item.productId === product.id)
      const previousItem = editingSale?.items?.find((item) => item.productId === product.id)
      if (!soldItem && !previousItem) return product
      const quantityDelta = parseMoney(soldItem?.quantity) - parseMoney(previousItem?.quantity)
      const nextQuantity = Math.max(0, parseMoney(product.quantity) - quantityDelta)
      return { ...product, quantity: String(nextQuantity), status: nextQuantity > 0 ? 'In Stock' : 'Out of Stock' }
    }))
    if (invoice.customerId || editingSale?.customerId) {
      onCustomersChange((current) => current.map((customer) => customer.id === invoice.customerId
        ? {
          ...customer,
          purchases: (parseMoney(customer.purchases) + invoice.total - (editingSale?.customerId === customer.id ? parseMoney(editingSale.total) : 0)).toFixed(2),
          pending: (parseMoney(customer.pending) + invoice.balance - (editingSale?.customerId === customer.id ? parseMoney(editingSale.balance) : 0)).toFixed(2),
        }
        : customer.id === editingSale?.customerId
          ? {
            ...customer,
            purchases: Math.max(0, parseMoney(customer.purchases) - parseMoney(editingSale.total)).toFixed(2),
            pending: Math.max(0, parseMoney(customer.pending) - parseMoney(editingSale.balance)).toFixed(2),
          }
          : customer))
    }
    setItems([])
    setDiscount('0')
    setPaidAmountInput('')
    setWalkInName('')
    setCustomerId('')
    onEditComplete?.()
    onNotify?.(isEditing ? t.billUpdated : t.saleSaved)
    if (shouldPrint) setPreviewInvoice(invoice)
    if (isEditing && !shouldPrint) onCancelEdit?.()
  }

  return (
    <div className="billing-content">
      <div className="entity-heading billing-heading">
        <div><h1>{isEditing ? t.editBill : t.billing}</h1><p>{isEditing ? t.modifyExistingInvoice : t.billingSubtitle}</p></div>
        <div className="entity-actions">
          {isEditing && <button className="cancel-edit-btn" type="button" onClick={onCancelEdit}>{t.cancel}</button>}
          <button
            className={scannerEnabled ? 'scanner-active-btn' : 'scanner-active-btn scanner-off'}
            type="button"
            onClick={() => setScannerEnabled((current) => !current)}
          >
            <ReceiptText size={16} /> {scannerEnabled ? (t.scannerActive ?? 'Scanner Active') : (t.scannerOff ?? 'Scanner Off')}
          </button>
          <button className="camera-icon-btn" type="button" onClick={() => scannerEnabled ? setScannerOpen(true) : onNotify?.(t.scannerOff ?? 'Scanner Off')} aria-label={t.barcodeScanner}><Camera size={18} /></button>
        </div>
      </div>

      <div className="billing-layout">
        <section className="billing-left">
          <div className="billing-panel search-panel">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addProductToBill(searchTerm)}
              placeholder={t.searchProductsByBarcode}
            />
            {searchResults.length > 0 && (
              <div className="billing-search-results">
                {searchResults.map((product) => {
                  const stock = parseMoney(product.quantity)
                  const isUnavailable = stock <= 0
                  return (
                  <button className={isUnavailable ? 'out-of-stock-result' : ''} disabled={isUnavailable} key={product.id} type="button" onClick={() => addProductToBill(product.barcode || product.code || product.name)}>
                    <strong>{product.name || t.product}</strong>
                    <span>{product.code || '-'} · {product.barcode || '-'} · {formatMoney(product.selling, currency)}</span>
                    <small>{stock} {product.unit || 'pcs'} {isUnavailable ? (t.outOfStock ?? 'Out of stock') : (t.available ?? 'available')}</small>
                  </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="billing-panel bill-items-panel">
            <h2>{t.billItems}</h2>
            {items.length === 0 ? (
              <div className="empty-bill">
                <ShoppingCart size={32} />
                <strong>{t.noItemsAdded}</strong>
                <span>{t.scanOrSearch}</span>
              </div>
            ) : items.map((item) => (
              <div className="bill-item" key={item.productId}>
                <div className="bill-item-name">
                  <strong>{item.name}</strong>
                  <span>{item.quantity} × {formatMoney(item.price, currency)} · {item.code}</span>
                </div>
                <label><small>{t.price}</small><input type="number" value={item.price} min="0" onChange={(event) => updateItem(item.productId, { price: parseMoney(event.target.value) })} /></label>
                <label><small>{t.discount}</small><input type="number" value={item.discount} min="0" onChange={(event) => updateItem(item.productId, { discount: parseMoney(event.target.value) })} /></label>
                <div className="qty-stepper">
                  <button type="button" onClick={() => updateItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })}>−</button>
                  <input type="number" value={item.quantity} min="1" max={item.stock || undefined} onChange={(event) => updateItem(item.productId, { quantity: event.target.value })} />
                  <button type="button" onClick={() => updateItem(item.productId, { quantity: item.stock ? Math.min(item.stock, item.quantity + 1) : item.quantity + 1 })}>+</button>
                </div>
                <strong className="line-total">{formatMoney(Math.max(0, item.price * item.quantity - parseMoney(item.discount)), currency)}</strong>
                <button className="delete-line-btn" type="button" onClick={() => removeItem(item.productId)} aria-label={t.delete}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>

        <aside className="billing-right">
          <div className="billing-panel side-card">
            <h2><UserPlus size={18} /> {t.customer}</h2>
            <CustomerSearchSelect customers={customers} onChange={setCustomerId} t={t} value={customerId} />
            <div className="or-divider">{t.or}</div>
            <input value={walkInName} onChange={(event) => setWalkInName(event.target.value)} placeholder={t.enterCustomerName} />
          </div>

          <div className="billing-panel side-card">
            <CurrencySelect label={t.currency} onChange={setCurrency} value={currency} />
            <label className="billing-field">
              <span>{t.discount}</span>
              <div className="segmented-row">
                <button className={discountMode === 'flat' ? 'active' : ''} type="button" onClick={() => setDiscountMode('flat')}>{t.flat}</button>
                <button className={discountMode === 'percent' ? 'active' : ''} type="button" onClick={() => setDiscountMode('percent')}>%</button>
              </div>
              <input type="number" value={discount} min="0" onChange={(event) => setDiscount(event.target.value)} />
            </label>
            <label className="billing-field date-field">
              <span>{t.date}</span>
              <div className="segmented-row">
                <button className={dateMode === 'greg' ? 'active' : ''} type="button" onClick={() => setDateMode('greg')}>{t.greg}</button>
                <button className={dateMode === 'shamsi' ? 'active' : ''} type="button" onClick={() => setDateMode('shamsi')}>{t.shamsi}</button>
              </div>
              <div className="date-input-shell">
                <CalendarDays size={17} />
                <input type="date" value={billDate} onChange={(event) => setBillDate(event.target.value)} aria-label={t.date} />
                <strong>{dateMode === 'greg' ? getGregorianLabel(billDate) : getShamsiLabel(billDate)}</strong>
                <small>{dateMode === 'greg' ? getShamsiShortLabel(billDate) : billDate}</small>
              </div>
            </label>
          </div>

          <div className="billing-panel side-card">
            <h2><CreditCard size={18} /> {t.paymentMethod}</h2>
            <label className="billing-field">
              <span>{t.paymentMethod}</span>
              <CustomSelect ariaLabel={t.paymentMethod} options={paymentMethodOptions} value={paymentMethod} onChange={setPaymentMethod} />
            </label>
            <label className="billing-field">
              <span>{t.paidAmount}</span>
              <input
                className={paymentTooHigh || paymentError ? 'field-invalid' : ''}
                max={total}
                min="0"
                type="number"
                value={paidAmountInput}
                onChange={(event) => {
                  setPaidAmountInput(event.target.value)
                  setPaymentError('')
                }}
                placeholder="0"
              />
              <small className={paymentTooHigh || paymentError ? 'payment-error' : ''}>
                {paymentTooHigh || paymentError ? t.paidAmountCannotExceedTotal : `${t.remaining}: ${formatMoney(balanceDue, currency)} · ${autoPaymentStatus === 'paid' ? t.paid : t.loan}`}
              </small>
            </label>
          </div>

          <div className="billing-panel totals-card">
            <div><span>{t.subtotal}</span><strong>{formatMoney(subtotal, currency)}</strong></div>
            <div><span>{t.discount}</span><strong>{formatMoney(billDiscount, currency)}</strong></div>
            {paidAmountInput !== '' && balanceDue > 0 && <div className="remaining-total"><span>{t.remaining}</span><strong>{formatMoney(balanceDue, currency)}</strong></div>}
            <div className="grand-total"><span>{t.total}</span><strong>{formatMoney(total, currency)}</strong></div>
            <div className="billing-actions">
              <button type="button" onClick={() => saveInvoice(false)}>{isEditing ? t.updateBill : t.saveBill}</button>
              <button className="primary-btn" type="button" onClick={() => saveInvoice(true)}>{isEditing ? t.updateAndPrint : t.saveAndPrint}</button>
            </div>
          </div>
        </aside>
      </div>

      {scannerOpen && (
        <ScannerModal
          onClose={() => setScannerOpen(false)}
          onScan={(code) => {
            addProductToBill(code)
            setScannerOpen(false)
          }}
          t={t}
        />
      )}
      {previewInvoice && <InvoicePreviewModal companyInfo={companyInfo} invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} t={t} />}
    </div>
  )
}

export default BillingPage
