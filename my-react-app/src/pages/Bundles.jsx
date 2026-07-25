import { Fragment, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import {
  Box,
  CalendarDays,
  Download,
  Eye,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from '../components/Icons.jsx'
import { currencies } from '../data/dashboardData.js'
import { formatBusinessCurrencyAmount } from '../utils/currencyExchange.js'
import { SupplierModal } from './Suppliers.jsx'
import './Bundles.css'

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const todayInput = () => new Date().toISOString().slice(0, 10)
const bundleCode = () => `BDL-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
const money = (value, currency = 'AFN') => formatBusinessCurrencyAmount(value, currency)

const dateLabel = (value) => {
  if (!value) return '-'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const shamsiLabel = (value) => {
  try {
    return value ? new Intl.DateTimeFormat('en-CA-u-ca-persian', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`)) : ''
  } catch {
    return ''
  }
}

const emptyRow = () => ({
  id: crypto.randomUUID(),
  checked: false,
  itemCode: '',
  stockQty: '',
  stockUnit: 'pcs',
  qty: '',
  unit: 'pcs',
  cost: '',
  tax: '',
  expense: '',
  color: '',
  arrivalDate: '',
})

const emptyBundle = {
  code: '',
  name: '',
  supplierId: '',
  currency: 'AFN',
  arrivalDate: '',
  color: '',
  parentTax: '0',
  expense: '',
  parentGroup: '',
  status: 'pending',
  rows: [],
}

const normalizeBundle = (bundle) => ({
  ...emptyBundle,
  ...bundle,
  code: bundle?.code || bundleCode(),
  rows: Array.isArray(bundle?.rows) && bundle.rows.length ? bundle.rows : [emptyRow()],
})

const rowTotal = (row) => {
  const base = parseNumber(row.qty) * parseNumber(row.cost)
  const tax = base * (parseNumber(row.tax) / 100)
  return base + tax + parseNumber(row.expense)
}

const bundleTotal = (bundle) => {
  const itemsTotal = (bundle.rows || []).reduce((sum, row) => sum + rowTotal(row), 0)
  const parentTax = itemsTotal * (parseNumber(bundle.parentTax) / 100)
  return itemsTotal + parentTax + parseNumber(bundle.expense)
}

function BundleForm({ bundle, onBack, onSave, onSupplierSave, suppliers, t }) {
  const [form, setForm] = useState(() => normalizeBundle(bundle))
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const supplierOptions = [{ value: '', label: 'Supplier' }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]
  const currencyOptions = currencies.map((currency) => ({ value: currency.code, label: `${currency.code} — ${currency.symbol}` }))
  const unitOptions = ['pcs', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'box', 'pack', 'carton', 'dozen'].map((unit) => ({ value: unit, label: unit }))
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateRow = (id, field, value) => setForm((current) => ({ ...current, rows: current.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)) }))
  const addRow = () => setForm((current) => ({ ...current, rows: [...current.rows, emptyRow()] }))
  const removeRow = (id) => setForm((current) => ({ ...current, rows: current.rows.length <= 1 ? current.rows : current.rows.filter((row) => row.id !== id) }))

  return (
    <section className="entity-content bundle-form-page">
      <div className="entity-heading bundle-form-heading">
  <div className="back-title-row">
    <button
      className="back-btn"
      type="button"
      onClick={onBack}
      aria-label="Back"
      title="Back"
    >
      ‹
    </button>

    <div>
      <h1>
        {bundle ? 'Edit bundle' : 'Create new bundle'}
      </h1>

      <p>
        Register imported bundles and track each bag inside.
      </p>
    </div>
  </div>

  <div className="entity-actions bundle-form-actions">
    <button
      className="bundle-form-cancel-btn"
      type="button"
      onClick={onBack}
    >
      <X size={15} />
      <span>Cancel</span>
    </button>

    <button
      className="primary-btn bundle-form-save-btn"
      type="button"
      onClick={() => {
        if (!form.name.trim()) return

        onSave({
          ...form,
          id: form.id || crypto.randomUUID(),
          status: form.status || 'pending',
          createdAt:
            form.createdAt || new Date().toISOString(),
        })
      }}
    >
      <span>
        {bundle ? 'Save Changes' : 'Create bundle'}
      </span>
    </button>
  </div>
</div>

      <div className="bundle-edit-card">
        <label><span>Bundle code</span><input value={form.code} onChange={(event) => update('code', event.target.value)} /></label>
        <label><span>Bundle name *</span><input placeholder="e.g. Khan's textile bag" value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label className="bundle-supplier-field">
          <span>Supplier</span>

          <div className="inline-field bundle-supplier-control">
            <CustomSelect
              ariaLabel="Supplier"
              className="bundle-supplier-select"
              options={supplierOptions}
              value={form.supplierId}
              onChange={(value) =>
                update('supplierId', value)
              }
            />

            <button
              className="bundle-supplier-add-btn"
              type="button"
              aria-label="Create supplier"
              title="Create supplier"
              onClick={() => setSupplierModalOpen(true)}
            >
              <Plus size={15} />
            </button>
          </div>
        </label>
        <label><span>Currency</span><CustomSelect ariaLabel="Currency" options={currencyOptions} value={form.currency} onChange={(value) => update('currency', value)} /></label>
        <label><span>Arrival date</span><input type="date" value={form.arrivalDate} onChange={(event) => update('arrivalDate', event.target.value)} /></label>
        <label><span>Color</span><input placeholder="#000 / red" value={form.color} onChange={(event) => update('color', event.target.value)} /></label>
        <label><span>Parent tax (%)</span><input type="number" value={form.parentTax} onChange={(event) => update('parentTax', event.target.value)} /></label>
        <label><span>Expense</span><input type="number" placeholder="0.00" value={form.expense} onChange={(event) => update('expense', event.target.value)} /></label>
        <label className="wide"><span>Parent group (optional)</span><input placeholder="e.g. Container-2026-01 (groups multiple bundles)" value={form.parentGroup} onChange={(event) => update('parentGroup', event.target.value)} /></label>
      </div>

      <div className="bundle-items-head">
        <h2 className="bundle-items-title">
          Bag items
          <span>{form.rows.length}</span>
        </h2>
        <button type="button" onClick={addRow}><Plus size={15} /> Add row</button>
      </div>
      <div className="bundle-items-table-wrap">
        <table className="data-table bundle-items-table">
          <thead><tr><th>✓</th><th>#</th><th>Item code</th><th>Stock qty</th><th>Stock unit</th><th>Qty</th><th>Unit</th><th>Cost / unit</th><th>Tax %</th><th>Expense</th><th>Color</th><th>Arrival date</th><th>Total price</th><th /></tr></thead>
          <tbody>
            {form.rows.map((row, index) => (
              <tr key={row.id}>
                <td><input type="checkbox" checked={row.checked} onChange={(event) => updateRow(row.id, 'checked', event.target.checked)} /></td>
                <td>{index + 1}</td>
                <td><input placeholder="e.g. CB-001" value={row.itemCode} onChange={(event) => updateRow(row.id, 'itemCode', event.target.value)} /></td>
                <td><input type="number" placeholder="e.g. 20" value={row.stockQty} onChange={(event) => updateRow(row.id, 'stockQty', event.target.value)} /></td>
                <td><CustomSelect ariaLabel="Stock unit" className="bundle-unit-select" menuClassName="bundle-unit-menu" options={unitOptions} value={row.stockUnit} onChange={(value) => updateRow(row.id, 'stockUnit', value)} /></td>
                <td><input type="number" value={row.qty} onChange={(event) => updateRow(row.id, 'qty', event.target.value)} /></td>
                <td><CustomSelect ariaLabel="Unit" className="bundle-unit-select" menuClassName="bundle-unit-menu" options={unitOptions} value={row.unit} onChange={(value) => updateRow(row.id, 'unit', value)} /></td>
                <td><input type="number" value={row.cost} onChange={(event) => updateRow(row.id, 'cost', event.target.value)} /></td>
                <td><input type="number" value={row.tax} onChange={(event) => updateRow(row.id, 'tax', event.target.value)} /></td>
                <td><input type="number" value={row.expense} onChange={(event) => updateRow(row.id, 'expense', event.target.value)} /></td>
                <td><input placeholder="e.g. red" value={row.color} onChange={(event) => updateRow(row.id, 'color', event.target.value)} /></td>
                <td><input type="date" value={row.arrivalDate} onChange={(event) => updateRow(row.id, 'arrivalDate', event.target.value)} /></td>
                <td><strong>{rowTotal(row).toFixed(2)}</strong></td>
                <td><button className="bundle-row-delete" type="button" aria-label="Delete row" onClick={() => removeRow(row.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan="12" /><td><strong>Grand Total:</strong></td><td><strong>{money(bundleTotal(form), form.currency)}</strong></td></tr></tfoot>
        </table>
      </div>
      {supplierModalOpen && <SupplierModal onClose={() => setSupplierModalOpen(false)} onSave={(supplier) => { onSupplierSave(supplier); update('supplierId', supplier.id); setSupplierModalOpen(false) }} t={t} />}
    </section>
  )
}

function BundleDetails({ bundle, onBack, onEdit, onPrint, onToggleStatus, suppliers }) {
  const supplier = suppliers.find((item) => item.id === bundle.supplierId)
  const totalStock = (bundle.rows || []).reduce((sum, row) => sum + parseNumber(row.stockQty), 0)
  const totalQty = (bundle.rows || []).reduce((sum, row) => sum + parseNumber(row.qty), 0)
  const rowsTotal = (bundle.rows || []).reduce((sum, row) => sum + rowTotal(row), 0)
  const parentTax = rowsTotal * (parseNumber(bundle.parentTax) / 100)
  const grandTotal = bundleTotal(bundle)

  return (
    <section className="entity-content bundle-details-page">
      <div className="entity-heading">
  <div className="back-title-row">
    <button
      className="back-btn"
      type="button"
      onClick={onBack}
      aria-label="Back"
      title="Back"
    >
      ‹
    </button>

    <div>
      <h1>
        {bundle
          ? 'Edit bundle'
          : 'Create new bundle'}
      </h1>

      <p>
        Register imported bundles and track each bag inside.
      </p>
    </div>
  </div>

  <div className="entity-actions bundle-form-actions">
    <button
      className="bundle-form-cancel-btn"
      type="button"
      onClick={onBack}
    >
      <X size={15} />
      <span>Cancel</span>
    </button>

    <button
      className="primary-btn bundle-form-save-btn"
      type="button"
      onClick={() =>
        onSave({
          ...form,
          id: form.id || crypto.randomUUID(),
          createdAt:
            form.createdAt ||
            new Date().toISOString(),
        })
      }
    >
      <span>
        {bundle ? 'Save Changes' : 'Create bundle'}
      </span>
    </button>
  </div>
</div>
      <div className="summary-grid four bundle-detail-summary">
        <article><span>Supplier</span><strong>{supplier?.name || '-'}</strong></article>
        <article><span>Arrival date</span><strong>{dateLabel(bundle.arrivalDate || todayInput())}</strong><small>{shamsiLabel(bundle.arrivalDate || todayInput())}</small></article>
        <article><span>Bags</span><strong>{bundle.rows?.length || 0}</strong></article>
        <article><span>Grand Total</span><strong>{money(grandTotal, bundle.currency)}</strong></article>
      </div>
      <div className="data-panel bundle-detail-card">
        <div className="bundle-detail-items-head">
  <div className="bundle-detail-items-icon">
    <Package size={17} />
  </div>

  <div>
    <h2>Bag items</h2>

    <p>
      {bundle.rows?.length || 0} item
      {(bundle.rows?.length || 0) === 1 ? '' : 's'} in this bundle
    </p>
  </div>

  <span className="bundle-detail-items-count">
    {bundle.rows?.length || 0}
  </span>
</div>
        <table className="data-table">
          <thead><tr><th>✓</th><th>#</th><th>Stock qty</th><th>Item code</th><th>Qty</th><th>Cost / unit</th><th>Tax%</th><th>Expense</th><th>Color</th><th>Arrival date</th><th>Total price</th></tr></thead>
          <tbody>{(bundle.rows || []).map((row, index) => <tr key={row.id}><td><input type="checkbox" checked={!!row.checked} readOnly /></td><td>{index + 1}</td><td>{row.stockQty || 0} {row.stockUnit}</td><td>{row.itemCode || '-'}</td><td>{row.qty || 0} {row.unit}</td><td>{Number(row.cost || 0).toFixed(2)}</td><td>{row.tax || 0}</td><td>{Number(row.expense || 0).toFixed(2)}</td><td>{row.color || '-'}</td><td>{dateLabel(row.arrivalDate || bundle.arrivalDate)}</td><td>{rowTotal(row).toFixed(2)}</td></tr>)}</tbody>
        </table>
        <div className="bundle-total-box">
          <span>Items total <strong>{rowsTotal.toFixed(2)}</strong></span>
          <span>Items expense <strong>{(bundle.rows || []).reduce((sum, row) => sum + parseNumber(row.expense), 0).toFixed(2)}</strong></span>
          <span>Items tax <strong>{(bundle.rows || []).reduce((sum, row) => sum + (parseNumber(row.qty) * parseNumber(row.cost) * parseNumber(row.tax) / 100), 0).toFixed(2)}</strong></span>
          <span>Expense <strong>{parseNumber(bundle.expense).toFixed(2)}</strong></span>
          <span>Parent tax ({parseNumber(bundle.parentTax)}%) <strong>{parentTax.toFixed(2)}</strong></span>
          <span>Total stock <strong>{totalStock} pcs</strong></span>
          <span>Total quantity <strong>{totalQty} pcs</strong></span>
          <span className="grand">Grand Total <strong>{money(grandTotal, bundle.currency)}</strong></span>
        </div>
      </div>
    </section>
  )
}

function BundleTableRow({
  bundle,
  getStatus,
  onCheckIn,
  onDelete,
  onEdit,
  onPrint,
  onView,
  suppliers,
  t,
}) {
  const displayStatus = getStatus(bundle)

  const statusLabel =
    displayStatus === 'checked-in'
      ? 'Checked-in'
      : displayStatus === 'upcoming'
        ? 'Upcoming'
        : displayStatus === 'overdue'
          ? 'Overdue'
          : 'Pending'

  const supplierName =
    suppliers.find(
      (item) => item.id === bundle.supplierId,
    )?.name || '-'

  return (
    <tr>
      <td>
        <button
          className={`bundle-checkin-btn ${
            bundle.status === 'checked-in'
              ? 'checked-in'
              : ''
          }`}
          type="button"
          aria-label={
            bundle.status === 'checked-in'
              ? 'Mark as pending'
              : 'Mark as checked-in'
          }
          title={
            bundle.status === 'checked-in'
              ? 'Mark as pending'
              : 'Mark as checked-in'
          }
          onClick={() => onCheckIn(bundle)}
        >
          <span />
        </button>
      </td>

      <td>{bundle.code}</td>

      <td>{bundle.name || '-'}</td>

      <td>{supplierName}</td>

      <td>{dateLabel(bundle.arrivalDate)}</td>

      <td>{bundle.rows?.length || 0}</td>

      <td>
        {money(
          bundleTotal(bundle),
          bundle.currency,
        )}
      </td>

      <td>
        <span
          className={`bundle-status-pill ${displayStatus}`}
        >
          {statusLabel}
        </span>
      </td>

      <td>
        <FloatingActionMenu
          ariaLabel={t.actions}
          actions={[
            {
              icon: <Eye size={15} />,
              label: 'View',
              onClick: onView,
            },
            {
  icon: <Package size={15} />,
  label: t.edit ?? 'Edit',
  onClick: onEdit,
},
            {
              icon: <Printer size={15} />,
              label: t.print,
              onClick: onPrint,
            },
            {
              danger: true,
              icon: <Trash2 size={15} />,
              label: t.delete,
              onClick: onDelete,
            },
          ]}
        />
      </td>
    </tr>
  )
}

function BundlePrintModal({
  bundle,
  companyInfo,
  onClose,
}) {
  if (!bundle) return null

  const rows = Array.isArray(bundle.rows)
    ? bundle.rows
    : []

  const companyName =
    companyInfo?.companyName ||
    companyInfo?.name ||
    'RetailPro'

  const companySubtitle =
    companyInfo?.systemSubtitle ||
    companyInfo?.tagline ||
    'Retail Management System'

  const itemsTotal = rows.reduce(
    (sum, row) =>
      sum +
      parseNumber(row.qty) *
        parseNumber(row.cost),
    0,
  )

  const itemsExpense = rows.reduce(
    (sum, row) =>
      sum + parseNumber(row.expense),
    0,
  )

  const itemsTax = rows.reduce(
    (sum, row) => {
      const base =
        parseNumber(row.qty) *
        parseNumber(row.cost)

      return (
        sum +
        base *
          (parseNumber(row.tax) / 100)
      )
    },
    0,
  )

  const totalStock = rows.reduce(
    (sum, row) =>
      sum + parseNumber(row.stockQty),
    0,
  )

  const totalQuantity = rows.reduce(
    (sum, row) =>
      sum + parseNumber(row.qty),
    0,
  )

  const parentTax =
    (itemsTotal + itemsTax + itemsExpense) *
    (parseNumber(bundle.parentTax) / 100)

  const grandTotal = bundleTotal(bundle)

  const printDate =
    new Date().toLocaleDateString('en-GB')

  const openPrintWindow = () => {
    const printable =
      document.querySelector(
        '.bundle-statement-paper',
      )?.outerHTML

    if (!printable) return

    const printWindow = window.open(
      '',
      '_blank',
      'width=1000,height=1100',
    )

    if (!printWindow) return

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />

          <title>
            Bundle Statement — ${bundle.name || bundle.code}
          </title>

          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            .bundle-statement-paper {
              width: 100%;
              max-width: 186mm;
              margin: 0 auto;
              padding: 0;
              background: #ffffff;
            }

            .bundle-print-brand {
              display: grid;
              grid-template-columns:
                minmax(0, 1fr) auto;
              align-items: center;
              gap: 18px;

              padding: 15px 17px;

              border-radius: 8px;

              background: #142247;
              color: #ffffff;
            }

            .bundle-print-company {
              display: flex;
              align-items: center;
              gap: 11px;
              min-width: 0;
            }

            .bundle-print-logo {
              width: 50px;
              height: 40px;
              display: grid;
              place-items: center;
              overflow: hidden;
              border-radius: 6px;
              background: #ffffff;
            }

            .bundle-print-logo img {
              display: block;
              width: 100%;
              max-width: 45px;
              height: 100%;
              max-height: 35px;
              object-fit: contain;
            }

            .bundle-print-company h3 {
              margin: 0;
              font-size: 17px;
            }

            .bundle-print-company p {
              margin: 4px 0 0;
              color: rgba(255,255,255,.72);
              font-size: 9px;
            }

            .bundle-print-type {
              min-width: 170px;
              padding: 9px 12px;

              border: 1px solid
                rgba(255,255,255,.28);
              border-radius: 7px;

              font-size: 11px;
              font-weight: 800;
              text-align: center;
            }

            .bundle-print-date {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,.72);
              font-size: 8px;
              font-weight: 500;
            }

            .bundle-print-summary {
              display: grid;
              grid-template-columns:
                minmax(0, 1fr) auto;
              gap: 16px;

              margin: 12px 0;
              padding: 12px;

              border: 1px solid #dbe3ef;
              border-radius: 8px;

              background: #f8fafc;
            }

            .bundle-print-summary h2 {
              margin: 0;
              font-size: 14px;
            }

            .bundle-print-summary p {
              margin: 5px 0 0;
              color: #64748b;
              font-size: 9px;
            }

            .bundle-print-total {
              text-align: end;
            }

            .bundle-print-total span {
              display: block;
              color: #64748b;
              font-size: 8px;
            }

            .bundle-print-total strong {
              display: block;
              margin-top: 4px;
              font-size: 16px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
              font-size: 8px;
            }

            thead {
              display: table-header-group;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            th {
              padding: 7px 6px;
              background: #142247;
              color: #ffffff;
              font-size: 8px;
              text-align: start;
            }

            td {
              padding: 7px 6px;
              border-bottom: 1px solid #dbe3ef;
              color: #0f172a;
              font-size: 8px;
              vertical-align: middle;
            }

            tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .bundle-print-calculation {
              width: 300px;
              margin: 16px 0 0 auto;
              display: grid;
              gap: 7px;
            }

            .bundle-print-calculation div {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              font-size: 8px;
            }

            .bundle-print-grand-total {
              margin-top: 4px;
              padding: 9px 12px;

              background: #142247;
              color: #ffffff;

              font-size: 10px !important;
              font-weight: 800;
            }

            .bundle-print-footer {
              margin-top: 10px;
              padding-top: 9px;

              border-top: 1px solid #dbe3ef;

              color: #64748b;
              font-size: 8px;
              text-align: center;
            }

            @media print {
              body {
                width: 210mm;
              }
            }
          </style>
        </head>

        <body>
          ${printable}

          <script>
            window.addEventListener(
              'load',
              () => {
                setTimeout(() => {
                  window.focus()
                  window.print()
                }, 250)
              },
            )
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <section
        className="bundle-print-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header className="bundle-print-modal-header">
          <div>
            <h2>
              Print — {bundle.name || bundle.code}
            </h2>

            <p>Bundle statement preview</p>
          </div>

          <div className="bundle-print-controls">
            <label>
              <span>Rows per page</span>

              <select defaultValue="25">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>

            <button
              className="bundle-download-btn"
              type="button"
              onClick={openPrintWindow}
            >
              <Download size={15} />
              <span>Download</span>
            </button>

            <button
              className="bundle-print-btn"
              type="button"
              onClick={openPrintWindow}
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
          </div>

          <button
            className="bundle-print-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </header>

        <div className="bundle-print-preview">
          <article className="bundle-statement-paper">
            <header className="bundle-print-brand">
              <div className="bundle-print-company">
                {companyInfo?.logo && (
                  <div className="bundle-print-logo">
                    <img
                      src={companyInfo.logo}
                      alt={companyName}
                    />
                  </div>
                )}

                <div>
                  <h3>{companyName}</h3>
                  <p>{companySubtitle}</p>
                </div>
              </div>

              <div className="bundle-print-type">
                BUNDLE STATEMENT

                <span className="bundle-print-date">
                  Print Date: {printDate}
                </span>
              </div>
            </header>

            <section className="bundle-print-summary">
              <div>
                <h2>
                  {bundle.name ||
                    bundle.code ||
                    'Bundle'}
                </h2>

                <p>{bundle.code}</p>

                <p>
                  Status:{' '}
                  <strong>
                    {bundle.status === 'checked-in'
                      ? 'Checked-in'
                      : 'Pending'}
                  </strong>
                </p>
              </div>

              <div className="bundle-print-total">
                <span>Grand Total</span>

                <strong>
                  {money(
                    grandTotal,
                    bundle.currency,
                  )}
                </strong>

                <span>
                  Bags: {rows.length}
                </span>
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item name</th>
                  <th>Item code</th>
                  <th>Qty</th>
                  <th>Cost / unit</th>
                  <th>Tax%</th>
                  <th>Expense</th>
                  <th>Color</th>
                  <th>Arrival date</th>
                  <th>Total price</th>
                  <th>✓</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id || index}>
                    <td>{index + 1}</td>

                    <td>
                      {row.name ||
                        row.itemName ||
                        '-'}
                    </td>

                    <td>
                      {row.itemCode || '-'}
                    </td>

                    <td>
                      {row.qty || 0}{' '}
                      {row.unit || 'pcs'}
                    </td>

                    <td>
                      {Number(
                        row.cost || 0,
                      ).toFixed(2)}
                    </td>

                    <td>{row.tax || 0}</td>

                    <td>
                      {Number(
                        row.expense || 0,
                      ).toFixed(2)}
                    </td>

                    <td>{row.color || '-'}</td>

                    <td>
                      {dateLabel(
                        row.arrivalDate ||
                          bundle.arrivalDate,
                      )}
                    </td>

                    <td>
                      {rowTotal(row).toFixed(2)}
                    </td>

                    <td>
                      {row.checked ? '✓' : '○'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="bundle-print-calculation">
              <div>
                <span>Items total</span>
                <strong>
                  {itemsTotal.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Items expense</span>
                <strong>
                  {itemsExpense.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Items tax</span>
                <strong>
                  {itemsTax.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Expense</span>
                <strong>
                  {parseNumber(
                    bundle.expense,
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Parent tax (
                  {parseNumber(
                    bundle.parentTax,
                  )}
                  %)
                </span>

                <strong>
                  {parentTax.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Total stock</span>
                <strong>
                  {totalStock} pcs
                </strong>
              </div>

              <div>
                <span>Total quantity</span>
                <strong>
                  {totalQuantity} pcs
                </strong>
              </div>

              <div className="bundle-print-grand-total">
                <span>Grand Total</span>

                <strong>
                  {money(
                    grandTotal,
                    bundle.currency,
                  )}
                </strong>
              </div>
            </section>

            <footer className="bundle-print-footer">
              Bags: {rows.length} | Generated:{' '}
              {new Date().toLocaleString()}
            </footer>
          </article>
        </div>
      </section>
    </div>
  )
}

function BundleDeleteModal({
  bundle,
  onCancel,
  onConfirm,
}) {
  if (!bundle) return null

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
    >
      <section
        className="bundle-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bundle-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="bundle-delete-close"
          type="button"
          aria-label="Close"
          title="Close"
          onClick={onCancel}
        >
          <X size={15} />
        </button>

        <div className="bundle-delete-icon">
          <Trash2 size={20} />
        </div>

        <div className="bundle-delete-content">
          <h2 id="bundle-delete-title">
            Delete bundle?
          </h2>

          <p>
            Are you sure you want to delete{' '}
            <strong>
              {bundle.name || bundle.code || 'this bundle'}
            </strong>
            ?
          </p>

          <small>
            This action cannot be undone.
          </small>
        </div>

        <div className="bundle-delete-actions">
          <button
            className="bundle-delete-cancel"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="bundle-delete-confirm"
            type="button"
            onClick={onConfirm}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </section>
    </div>
  )
}

function BundlesPage({ bundles = [], companyInfo, onBundlesChange, onSuppliersChange, printSettings, suppliers = [], t }) {
  const [mode, setMode] = useState('list')
  const [deleteBundleTarget, setDeleteBundleTarget] =
  useState(null)
  const [editingBundle, setEditingBundle] = useState(null)
  const [detailBundle, setDetailBundle] = useState(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [groupByParent, setGroupByParent] = useState(false)
  const getBundleFilterStatus = (bundle) => {
  if (bundle.status === 'checked-in') {
    return 'checked-in'
  }

  if (!bundle.arrivalDate) {
    return 'pending'
  }

  const arrival = new Date(
    `${String(bundle.arrivalDate).slice(0, 10)}T12:00:00`,
  )

  if (Number.isNaN(arrival.getTime())) {
    return 'pending'
  }

  const today = new Date()

  today.setHours(0, 0, 0, 0)
  arrival.setHours(0, 0, 0, 0)

  if (arrival < today) {
    return 'overdue'
  }

  if (arrival > today) {
    return 'upcoming'
  }

  return 'pending'
}
  const [printBundle, setPrintBundle] = useState(null)
  const now = new Date()
const filtered = bundles
  .filter((bundle) => {
    const supplierName =
      suppliers.find(
        (item) => item.id === bundle.supplierId,
      )?.name || ''

    const text = [
      bundle.code,
      bundle.name,
      supplierName,
      bundle.arrivalDate,
      bundle.parentGroup,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch =
      !query.trim() ||
      text.includes(query.trim().toLowerCase())

    const bundleFilterStatus =
      getBundleFilterStatus(bundle)

    const matchesStatus =
      status === 'all' ||
      bundleFilterStatus === status

    return matchesSearch && matchesStatus
  })
  .sort((a, b) => {
    if (!groupByParent) return 0

    const firstGroup =
      String(a.parentGroup?.trim() || 'Ungrouped')

    const secondGroup =
      String(b.parentGroup?.trim() || 'Ungrouped')

    return (
      firstGroup.localeCompare(secondGroup) ||
      String(a.code || '').localeCompare(
        String(b.code || ''),
      )
    )
  })

const groupedBundles = filtered.reduce(
  (groups, bundle) => {
    const groupName =
      bundle.parentGroup?.trim() || 'Ungrouped'

    if (!groups[groupName]) {
      groups[groupName] = []
    }

    groups[groupName].push(bundle)

    return groups
  },
  {},
)

const totalCost = bundles.reduce(
  (sum, bundle) => sum + bundleTotal(bundle),
  0,
)
  const totalBags = bundles.reduce((sum, bundle) => sum + (bundle.rows?.length || 0), 0)
  const arrived = bundles.filter((bundle) => bundle.status === 'checked-in').length
  const pending = bundles.filter((bundle) => bundle.status !== 'checked-in').length
  const upcoming = bundles.filter((bundle) => bundle.arrivalDate && new Date(`${bundle.arrivalDate}T12:00:00`) >= now && bundle.status !== 'checked-in').length
  const overdue = bundles.filter((bundle) => bundle.arrivalDate && new Date(`${bundle.arrivalDate}T12:00:00`) < now && bundle.status !== 'checked-in').length

  const saveBundle = (bundle) => {
    const nextBundle = { ...bundle, status: bundle.status || 'pending' }
    onBundlesChange((current) => current.some((item) => item.id === nextBundle.id) ? current.map((item) => (item.id === nextBundle.id ? nextBundle : item)) : [nextBundle, ...current])
    setMode('list')
    setEditingBundle(null)
  }
  const requestDeleteBundle = (bundle) => {
  setDeleteBundleTarget(bundle)
}

const confirmDeleteBundle = () => {
  if (!deleteBundleTarget) return

  onBundlesChange((current) =>
    current.filter(
      (item) => item.id !== deleteBundleTarget.id,
    ),
  )

  if (detailBundle?.id === deleteBundleTarget.id) {
    setDetailBundle(null)
  }

  setDeleteBundleTarget(null)
}
  const toggleStatus = (bundle) => {
    const next = { ...bundle, status: bundle.status === 'checked-in' ? 'pending' : 'checked-in' }
    onBundlesChange((current) => current.map((item) => (item.id === bundle.id ? next : item)))
    setDetailBundle(next)
  }
  const toggleBundleCheckIn = (bundle) => {
    const nextStatus =
      bundle.status === 'checked-in'
        ? 'pending'
        : 'checked-in'

    onBundlesChange((current) =>
      current.map((item) =>
        item.id === bundle.id
          ? {
            ...item,
            status: nextStatus,
            checkedInAt:
              nextStatus === 'checked-in'
                ? new Date().toISOString()
                : '',
          }
          : item,
      ),
    )
  }
  const openEdit = (bundle) => {
    setEditingBundle(bundle)
    setMode('form')
  }

  const saveSupplier = (supplier) => {
    onSuppliersChange?.((current) => current.some((item) => item.id === supplier.id) ? current.map((item) => (item.id === supplier.id ? supplier : item)) : [...current, supplier])
  }

  if (mode === 'form') return <BundleForm bundle={editingBundle} onBack={() => { setMode('list'); setEditingBundle(null) }} onSave={saveBundle} onSupplierSave={saveSupplier} suppliers={suppliers} t={t} />
if (detailBundle) {
  return (
    <>
      <BundleDetails
        bundle={detailBundle}
        onBack={() => setDetailBundle(null)}
        onEdit={openEdit}
        onPrint={setPrintBundle}
        onToggleStatus={toggleStatus}
        suppliers={suppliers}
      />

      {printBundle && (
        <BundlePrintModal
          bundle={printBundle}
          companyInfo={companyInfo}
          onClose={() => setPrintBundle(null)}
        />
      )}

      {deleteBundleTarget && (
        <BundleDeleteModal
          bundle={deleteBundleTarget}
          onCancel={() =>
            setDeleteBundleTarget(null)
          }
          onConfirm={confirmDeleteBundle}
        />
      )}
    </>
  )
}
  return (
    <section className="entity-content bundles-page">
      <div className="entity-heading">
        <div><h1><Box size={24} /> Bundles Management</h1><p>Register imported bundles and track each bag inside.</p></div>
        <div className="entity-actions"><button className="primary-btn" type="button" onClick={() => { setEditingBundle(null); setMode('form') }}><Plus size={16} /> Create new bundle</button></div>
      </div>
      <div className="summary-grid seven bundle-summary-grid">
        <article className="tone-navy"><span>Total bundles</span><strong>{bundles.length}</strong><Box size={22} /></article>
        <article className="tone-green"><span>Total arrived</span><strong>{arrived}</strong><Package size={22} /></article>
        <article className="tone-orange"><span>Total pending</span><strong>{pending}</strong><CalendarDays size={22} /></article>
        <article className="tone-navy"><span>Upcoming arrivals</span><strong>{upcoming}</strong><CalendarDays size={22} /></article>
        <article className="tone-red"><span>Overdue arrivals</span><strong>{overdue}</strong><CalendarDays size={22} /></article>
        <article className="tone-navy"><span>Total bags</span><strong>{totalBags}</strong><Package size={22} /></article>
        <article className="tone-navy"><span>Total cost</span><strong>{money(totalCost, companyInfo.currency || 'AFN')}</strong></article>
      </div>
      <div className="filter-card bundle-filter-card">
        <div className="search-field"><Search size={17} /><input placeholder="Search by code, name, supplier, date, bags..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <CustomSelect
          ariaLabel="Bundle status"
          className="bundle-status-filter"
          options={[
            { value: 'all', label: 'All' },
            {
              value: 'checked-in',
              label: 'Checked-in',
            },
            {
              value: 'pending',
              label: 'Pending',
            },
            {
              value: 'upcoming',
              label: 'Upcoming',
            },
            {
              value: 'overdue',
              label: 'Overdue',
            },
          ]}
          value={status}
          onChange={setStatus}
        />
        <button
          className={`bundle-group-filter-btn ${groupByParent ? 'active' : ''
            }`}
          type="button"
          aria-pressed={groupByParent}
          onClick={() =>
            setGroupByParent((current) => !current)
          }
        >
          <Box size={15} />

          <span>
            {groupByParent
              ? 'Grouped by parent'
              : 'Group by parent'}
          </span>
        </button>
      </div>
      <div className="data-panel bundle-list-card">
        {filtered.length === 0 ? <div className="empty-detail-state"><p>No bundles yet. Create your first bundle.</p></div> : (
          <table className="data-table">
            <thead><tr><th /><th>Bundle code</th><th>Name</th><th>Supplier</th><th>Arrival date</th><th>Bags</th><th>Grand Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
  {groupByParent
    ? Object.entries(groupedBundles).map(
        ([groupName, groupBundles]) => (
          <Fragment key={groupName}>
            <tr className="bundle-group-row">
              <td colSpan="9">
                <div className="bundle-group-heading">
                  <Box size={15} />

                  <strong>{groupName}</strong>

                  <span>
                    {groupBundles.length}
                  </span>
                </div>
              </td>
            </tr>

            {groupBundles.map((bundle) => (
              <BundleTableRow
                key={bundle.id}
                bundle={bundle}
                suppliers={suppliers}
                t={t}
                onCheckIn={
                  toggleBundleCheckIn
                }
                onView={() =>
                  setDetailBundle(bundle)
                }
                onEdit={() =>
                  openEdit(bundle)
                }
                onPrint={() =>
                  setPrintBundle(bundle)
                }
                onDelete={() =>
  requestDeleteBundle(bundle)
}
                getStatus={
                  getBundleFilterStatus
                }
              />
            ))}
          </Fragment>
        ),
      )
    : filtered.map((bundle) => (
        <BundleTableRow
          key={bundle.id}
          bundle={bundle}
          suppliers={suppliers}
          t={t}
          onCheckIn={toggleBundleCheckIn}
          onView={() =>
            setDetailBundle(bundle)
          }
          onEdit={() => openEdit(bundle)}
          onPrint={() =>
            setPrintBundle(bundle)
          }
          onDelete={() =>
  requestDeleteBundle(bundle)
}
          getStatus={getBundleFilterStatus}
        />
      ))}
</tbody>
          </table>
        )}
      </div>
{printBundle && (
  <BundlePrintModal
    bundle={printBundle}
    companyInfo={companyInfo}
    onClose={() => setPrintBundle(null)}
  />
)}

{deleteBundleTarget && (
  <BundleDeleteModal
    bundle={deleteBundleTarget}
    onCancel={() => setDeleteBundleTarget(null)}
    onConfirm={confirmDeleteBundle}
  />
)}
    </section>
  )
}

export default BundlesPage
