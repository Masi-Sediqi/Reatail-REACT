import { useEffect, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { currencies } from '../data/dashboardData.js'
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

function ActionMenu({ isOpen, onDelete, onEdit, onToggle, supplier, t }) {
  return (
    <div className="row-actions" onPointerDown={(event) => event.stopPropagation()}>
      <button className="dots-btn" type="button" onClick={onToggle} aria-label={t.actions}>
        ...
      </button>
      {isOpen && (
        <div className="row-action-menu">
          <button type="button" onClick={onEdit}>{t.edit}</button>
          <button className="danger" type="button" onClick={() => onDelete(supplier)}>{t.delete}</button>
        </div>
      )}
    </div>
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

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={(event) => { event.stopPropagation(); requestClose() }}>
      <form
        className="entity-modal supplier-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!form.name.trim()) return
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), status: 'Active' })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <h2>{initialSupplier ? t.editSupplier : t.createSupplierAccount}</h2>
        <label className="wide"><span>{t.name} *</span><input autoFocus className={submitted && !form.name.trim() ? 'field-invalid' : ''} placeholder={t.supplierName} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label><span>{t.phoneNumber}</span><input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
        <label><span>{t.businessType}</span><input placeholder={t.businessTypePlaceholder} value={form.businessType} onChange={(e) => update('businessType', e.target.value)} /></label>
        <label className="wide"><span>{t.address}</span><input value={form.address} onChange={(e) => update('address', e.target.value)} /></label>
        <label className="wide"><span>{t.currency}</span><select value={form.currency} onChange={(e) => update('currency', e.target.value)}>{currencies.map((c) => <option value={c.code} key={c.code}>{c.symbol} {c.name}</option>)}</select></label>
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
                  {item} <span>×</span>
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

function SuppliersPage({ companyInfo, onMoveToRecycle, onNotify, onSuppliersChange, printSettings, suppliers, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [openActionId, setOpenActionId] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const totalPayables = suppliers.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0)

  useEffect(() => {
    if (!openActionId) return undefined
    const closeMenu = () => setOpenActionId('')
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [openActionId])

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
    setOpenActionId('')
  }

  const editSupplier = (supplier) => {
    setEditingSupplier(supplier)
    setModalOpen(true)
    setOpenActionId('')
  }

  return (
    <div className="entity-content">
      <div className="entity-heading">
        <div><h1>{t.suppliers}</h1><p>{t.manageSupplierLedgers}</p></div>
        <div className="entity-actions">
          <button type="button" onClick={() => setPrintOpen(true)}>{t.print}</button>
          <button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.createSupplierAccount}</button>
        </div>
      </div>
      <div className="summary-grid four">
        <article><span>{t.totalSuppliers}</span><strong>{suppliers.length}</strong></article>
        <article><span>{t.totalPayables}</span><strong className="danger-text">{totalPayables.toFixed(2)} ؋</strong></article>
        <article><span>{t.totalReceivables}</span><strong className="success-text">0.00 ؋</strong></article>
        <article><span>{t.netBalance}</span><strong>{totalPayables.toFixed(2)} ؋</strong><small>{t.settled}</small></article>
      </div>
      <div className="filter-bar"><input placeholder={t.searchSuppliers} /><select><option>{t.all}</option><option>{t.payable}</option><option>{t.receivable}</option><option>{t.settledPlain}</option></select></div>
      <div className="chip-row"><span className="active">{t.all}</span><span>{t.payable}</span><span>{t.receivable}</span><span>{t.settledPlain}</span></div>
      <div className="data-panel">
        <table className="data-table">
          <thead><tr><th>{t.name}</th><th>{t.phoneNumber}</th><th>{t.address}</th><th>{t.currency}</th><th>{t.balance}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {suppliers.length === 0 ? <tr><td colSpan="7" className="empty-cell">{t.noSuppliersFound}</td></tr> : suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td><td>{supplier.phone}</td><td>{supplier.address}</td><td>{supplier.currency}</td><td>{supplier.balance || '0.00'}</td><td><span className="status-pill active">{t.active}</span></td>
                <td>
                  <ActionMenu
                    isOpen={openActionId === supplier.id}
                    onDelete={deleteSupplier}
                    onEdit={() => editSupplier(supplier)}
                    onToggle={() => setOpenActionId((current) => current === supplier.id ? '' : supplier.id)}
                    supplier={supplier}
                    t={t}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && <SupplierModal initialSupplier={editingSupplier} onClose={() => { setModalOpen(false); setEditingSupplier(null) }} onSave={saveSupplier} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={suppliers} title={t.supplierReport} columns={[{ key: 'name', label: t.name }, { key: 'phone', label: t.phoneNumber }, { key: 'currency', label: t.currency }, { key: 'balance', label: t.balance }]} t={t} />}
    </div>
  )
}

export default SuppliersPage
