import { useEffect, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
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
}

function CustomerActionMenu({ customer, isOpen, onDelete, onEdit, onToggle, t }) {
  return (
    <div className="row-actions" onPointerDown={(event) => event.stopPropagation()}>
      <button className="dots-btn" type="button" onClick={onToggle} aria-label={t.actions}>...</button>
      {isOpen && (
        <div className="row-action-menu">
          <button type="button">{t.view}</button>
          <button type="button" onClick={onEdit}>{t.edit}</button>
          <button className="danger" type="button" onClick={() => onDelete(customer)}>{t.delete}</button>
        </div>
      )}
    </div>
  )
}

function CustomerModal({ initialCustomer, onClose, onSave, t }) {
  const [form, setForm] = useState(initialCustomer ?? emptyCustomer)
  const [closing, setClosing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
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
          if (!form.name.trim()) return
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), status: 'Active' })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <h2>{initialCustomer ? t.editCustomer : t.addNewCustomer}</h2>
        <label className="wide"><span>{t.name} *</span><input autoFocus className={submitted && !form.name.trim() ? 'field-invalid' : ''} placeholder={t.customerNamePlaceholder} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label><span>{t.phoneNumber}</span><input placeholder={t.phonePlaceholder} value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
        <label><span>{t.email}</span><input placeholder={t.emailAddress} value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
        <label className="wide"><span>{t.address}</span><input placeholder={t.address} value={form.address} onChange={(e) => update('address', e.target.value)} /></label>
        <label className="wide"><span>{t.notes}</span><textarea placeholder={t.additionalNotes} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
        <label className="toggle-label wide">
          <button className={form.vip ? 'toggle on' : 'toggle'} type="button" onClick={() => update('vip', !form.vip)}><span>{form.vip ? 'ON' : ''}</span></button>
          <span>{t.vipCustomer}</span>
        </label>
        <button className="primary-btn wide" type="submit">{initialCustomer ? t.saveChanges : t.addCustomer}</button>
      </form>
    </div>
  )
}

function CustomersPage({ companyInfo, customers, onCustomersChange, onMoveToRecycle, onNotify, printSettings, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [openActionId, setOpenActionId] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const totalPurchases = customers.reduce((sum, customer) => sum + Number(customer.purchases || 0), 0)
  const totalPending = customers.reduce((sum, customer) => sum + Number(customer.pending || 0), 0)

  useEffect(() => {
    if (!openActionId) return undefined
    const closeMenu = () => setOpenActionId('')
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [openActionId])

  const saveCustomer = (customer) => {
    onCustomersChange((current) => {
      const exists = current.some((item) => item.id === customer.id)
      return exists ? current.map((item) => (item.id === customer.id ? customer : item)) : [...current, customer]
    })
    setModalOpen(false)
    setEditingCustomer(null)
    onNotify?.(t.savedSuccessfully)
  }

  const deleteCustomer = (customer) => {
    onMoveToRecycle('customers', customer)
    setOpenActionId('')
  }

  return (
    <div className="entity-content">
      <div className="entity-heading">
        <div><h1>{t.customerManagement}</h1><p>{t.manageCustomerRelationships}</p></div>
        <div className="entity-actions">
          <button type="button" onClick={() => setPrintOpen(true)}>{t.printReport}</button>
          <button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.addCustomer}</button>
        </div>
      </div>

      <div className="summary-grid four">
        <article className="tone-blue"><span>{t.totalCustomers}</span><strong>{customers.length}</strong></article>
        <article className="tone-green"><span>{t.vipCustomers}</span><strong>{customers.filter((customer) => customer.vip).length}</strong></article>
        <article className="tone-navy"><span>{t.totalPurchases}</span><strong>{totalPurchases.toFixed(2)} ؋</strong></article>
        <article className="tone-orange"><span>{t.totalPending}</span><strong>{totalPending.toFixed(2)} ؋</strong></article>
      </div>

      <div className="filter-card">
        <input placeholder={t.searchCustomers} />
        <select><option>{t.allStatuses}</option><option>{t.active}</option><option>{t.vipCustomers}</option></select>
        <select><option>{t.paymentStatus}</option><option>{t.pendingPayments}</option><option>{t.settledPlain}</option></select>
        <select><option>{t.allTime}</option></select>
      </div>

      <div className="data-panel">
        <h2>{t.customers} ({customers.length})</h2>
        <table className="data-table">
          <thead><tr><th>{t.name}</th><th>{t.contact}</th><th>{t.purchases}</th><th>{t.pending}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {customers.length === 0 ? <tr><td colSpan="6" className="empty-cell">{t.noCustomersFound}</td></tr> : customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td><span className="stacked-cell">{customer.phone}<small>{customer.email}</small></span></td>
                <td>{customer.purchases || '0.00'} ؋</td>
                <td className="warning-text">{customer.pending || '0.00'} ؋</td>
                <td><span className="status-pill active">{t.active}</span></td>
                <td>
                  <CustomerActionMenu
                    customer={customer}
                    isOpen={openActionId === customer.id}
                    onDelete={deleteCustomer}
                    onEdit={() => { setEditingCustomer(customer); setModalOpen(true); setOpenActionId('') }}
                    onToggle={() => setOpenActionId((current) => current === customer.id ? '' : customer.id)}
                    t={t}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <CustomerModal initialCustomer={editingCustomer} onClose={() => { setModalOpen(false); setEditingCustomer(null) }} onSave={saveCustomer} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={customers} title={t.customerReport} columns={[{ key: 'name', label: t.name }, { key: 'phone', label: t.phoneNumber }, { key: 'email', label: t.email }, { key: 'purchases', label: t.purchases }, { key: 'pending', label: t.pending }]} t={t} />}
    </div>
  )
}

export default CustomersPage
