import { useMemo, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import { currencies } from '../data/dashboardData.js'
import { UserPlus } from '../components/Icons.jsx'
import './Staff.css'

const employmentTypes = ['Full-time', 'Part-time', 'Contract']

const emptyStaff = {
  name: '',
  phone: '',
  email: '',
  role: '',
  department: '',
  employmentType: 'Full-time',
  salary: '',
  currency: 'AFN',
  paid: '0',
  payable: '0',
}

function StaffActionMenu({ isOpen, onDelete, onEdit, onToggle, staff, t }) {
  void isOpen
  void onToggle
  return <FloatingActionMenu ariaLabel={t.actions} actions={[
    { label: t.edit, onClick: onEdit },
    { danger: true, label: t.delete, onClick: () => onDelete(staff) },
  ]} />
}

function StaffModal({ initialStaff, onClose, onSave, t }) {
  const [form, setForm] = useState(initialStaff ?? emptyStaff)
  const [submitted, setSubmitted] = useState(false)
  const [closing, setClosing] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }
  const employmentOptions = employmentTypes.map((item) => ({ value: item, label: t.employmentTypes?.[item] ?? item }))
  const currencyOptions = currencies.map((item) => ({ value: item.code, label: item.code }))

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <form
        className="entity-modal staff-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!form.name.trim() || !form.role.trim()) return
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), status: 'Active' })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <h2>{initialStaff ? t.editStaff : t.addNewStaff}</h2>
        <label className="wide"><span>{t.fullName} *</span><input autoFocus className={submitted && !form.name.trim() ? 'field-invalid' : ''} placeholder={t.staffNamePlaceholder} value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label><span>{t.phoneNumber}</span><input placeholder={t.phonePlaceholder} value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
        <label><span>{t.email}</span><input placeholder={t.email} value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
        <label><span>{t.role} *</span><input className={submitted && !form.role.trim() ? 'field-invalid' : ''} placeholder={t.jobTitle} value={form.role} onChange={(event) => update('role', event.target.value)} /></label>
        <label><span>{t.department}</span><input placeholder={t.department} value={form.department} onChange={(event) => update('department', event.target.value)} /></label>
        <label className="wide">
          <span>{t.employmentType}</span>
          <CustomSelect ariaLabel={t.employmentType} options={employmentOptions} value={form.employmentType} onChange={(value) => update('employmentType', value)} />
        </label>
        <label><span>{t.monthlySalary}</span><input inputMode="decimal" placeholder="0" value={form.salary} onChange={(event) => update('salary', event.target.value)} /></label>
        <label><span>{t.baseCurrency}</span><CustomSelect ariaLabel={t.baseCurrency} options={currencyOptions} value={form.currency} onChange={(value) => update('currency', value)} /></label>
        <button className="primary-btn wide" type="submit">{initialStaff ? t.saveChanges : t.addStaffMember}</button>
      </form>
    </div>
  )
}

function StaffPage({ companyInfo, onMoveToRecycle, onNotify, onStaffChange, printSettings, staffMembers, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const filteredStaff = useMemo(() => staffMembers.filter((staff) => {
    const matchesSearch = `${staff.name} ${staff.role} ${staff.department}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter
    return matchesSearch && matchesStatus
  }), [search, staffMembers, statusFilter])

  const monthlyPayroll = staffMembers.reduce((sum, staff) => sum + Number(staff.salary || 0), 0)
  const staffPaid = staffMembers.reduce((sum, staff) => sum + Number(staff.paid || 0), 0)
  const staffPayable = staffMembers.reduce((sum, staff) => sum + Number(staff.payable || 0), 0)
  const statusOptions = useMemo(() => [
    { value: 'all', label: t.allStatuses },
    { value: 'Active', label: t.active },
  ], [t.active, t.allStatuses])
  const dateOptions = useMemo(() => [{ value: 'all', label: t.allTime }], [t.allTime])

  const saveStaff = (staff) => {
    onStaffChange((current) => {
      const exists = current.some((item) => item.id === staff.id)
      return exists ? current.map((item) => (item.id === staff.id ? staff : item)) : [...current, staff]
    })
    setModalOpen(false)
    setEditingStaff(null)
    onNotify?.(t.savedSuccessfully)
  }

  const deleteStaff = (staff) => {
    onMoveToRecycle('staffMembers', staff)
  }

  return (
    <div className="entity-content staff-content">
      <div className="entity-heading">
        <div><h1>{t.staff}</h1><p>{t.staffOverview}</p></div>
        <div className="entity-actions">
          <button type="button" onClick={() => setPrintOpen(true)}>{t.printReport}</button>
          <button type="button" className="payroll-btn">{t.payroll}</button>
          <button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.addStaffMember}</button>
        </div>
      </div>

      <div className="summary-grid four">
        <article className="tone-blue"><span>{t.totalStaff}</span><strong>{staffMembers.length}</strong></article>
        <article className="tone-orange"><span>{t.monthlyPayroll}</span><strong>{monthlyPayroll.toFixed(2)} ؋</strong></article>
        <article className="tone-green"><span>{t.staffPaid}</span><strong>{staffPaid.toFixed(2)} ؋</strong></article>
        <article className="tone-orange"><span>{t.staffPayable}</span><strong>{staffPayable.toFixed(2)} ؋</strong></article>
      </div>

      <div className="filter-card staff-filter">
        <input placeholder={t.searchStaff} value={search} onChange={(event) => setSearch(event.target.value)} />
        <CustomSelect ariaLabel={t.status} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="data-panel staff-panel">
        <h2><UserPlus size={20} /> {t.staffMembers} ({filteredStaff.length})</h2>
        {filteredStaff.length === 0 ? (
          <div className="staff-empty">
            <UserPlus size={42} />
            <strong>{t.noStaffFound}</strong>
            <span>{t.addFirstStaff}</span>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>{t.name}</th><th>{t.contact}</th><th>{t.role}</th><th>{t.department}</th><th>{t.monthlySalary}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td>{staff.name}</td>
                  <td><span className="stacked-cell">{staff.phone}<small>{staff.email}</small></span></td>
                  <td>{staff.role}</td>
                  <td>{staff.department}</td>
                  <td>{Number(staff.salary || 0).toFixed(2)} {staff.currency}</td>
                  <td><span className="status-pill active">{t.active}</span></td>
                  <td>
                    <StaffActionMenu
                      onDelete={deleteStaff}
                      onEdit={() => { setEditingStaff(staff); setModalOpen(true) }}
                      staff={staff}
                      t={t}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <StaffModal initialStaff={editingStaff} onClose={() => { setModalOpen(false); setEditingStaff(null) }} onSave={saveStaff} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={filteredStaff} title={t.staffReport} columns={[{ key: 'name', label: t.name }, { key: 'phone', label: t.phoneNumber }, { key: 'role', label: t.role }, { key: 'department', label: t.department }, { key: 'salary', label: t.monthlySalary }]} t={t} />}
    </div>
  )
}

export default StaffPage
