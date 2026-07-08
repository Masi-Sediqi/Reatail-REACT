import { useMemo, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import { currencies } from '../data/dashboardData.js'
import { BriefcaseBusiness, ChevronLeft, CreditCard, DollarSign, Eye, Plus, Trash2, UserPlus } from '../components/Icons.jsx'
import './Staff.css'

const employmentTypes = ['Full-time', 'Part-time', 'Contract']
const paymentMethods = ['cash', 'creditCard', 'bankTransfer', 'onlinePayment']

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
  payrollHistory: [],
}

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const parseDateInput = (value) => (value ? new Date(`${value}T12:00:00`) : null)
const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const getMonthStart = (date = new Date()) => formatDateInput(new Date(date.getFullYear(), date.getMonth(), 1))
const getMonthEnd = (date = new Date()) => formatDateInput(new Date(date.getFullYear(), date.getMonth() + 1, 0))
const getDateLabel = (isoDate) => new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const getDaysInclusive = (start, end) => {
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return 1
  return Math.max(1, Math.round((endDate - startDate) / 86400000) + 1)
}
const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function StaffActionMenu({ onDelete, onEdit, onPaySalary, onViewProfile, staff, t }) {
  return <FloatingActionMenu ariaLabel={t.actions} actions={[
    { icon: <Eye size={15} />, label: t.viewProfile ?? 'View profile', onClick: () => onViewProfile(staff) },
    { icon: <DollarSign size={15} />, label: t.paySalary ?? 'Pay Salary', onClick: () => onPaySalary(staff) },
    { label: t.edit, onClick: onEdit },
    { danger: true, icon: <Trash2 size={15} />, label: t.delete, onClick: () => onDelete(staff) },
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
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), status: 'Active', payrollHistory: form.payrollHistory || [] })
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

function PayrollModal({ initialStaff, lockedStaff = false, onClose, onSave, staffMembers, t }) {
  const today = new Date()
  const [staffId, setStaffId] = useState(initialStaff?.id || '')
  const [period, setPeriod] = useState('monthly')
  const [start, setStart] = useState(getMonthStart(today))
  const [end, setEnd] = useState(getMonthEnd(today))
  const selectedStaff = staffMembers.find((staff) => staff.id === staffId) || initialStaff || null
  const [baseSalary, setBaseSalary] = useState(String(initialStaff?.salary || ''))
  const [currency, setCurrency] = useState(initialStaff?.currency || 'AFN')
  const [paidAmount, setPaidAmount] = useState('0.00')
  const [method, setMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const staffOptions = [
    { value: '', label: t.selectStaffMember ?? 'Select staff member' },
    ...staffMembers.map((staff) => ({ value: staff.id, label: `${staff.name} — ${staff.role || '-'} (${Number(staff.salary || 0)} ${staff.currency || 'AFN'})` })),
  ]
  const periodOptions = [
    { value: 'daily', label: t.daily ?? 'Daily' },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ]
  const methodOptions = paymentMethods.map((item) => ({ value: item, label: t[item] ?? item }))
  const currencyOptions = currencies.map((item) => ({ value: item.code, label: `${item.symbol} ${item.code}` }))
  const days = getDaysInclusive(start, end)
  const monthlySalary = parseNumber(baseSalary || selectedStaff?.salary)
  const suggested = period === 'monthly'
    ? monthlySalary
    : (monthlySalary / 30) * days
  const alreadyPaid = (selectedStaff?.payrollHistory || [])
    .filter((entry) => entry.start === start && entry.end === end)
    .reduce((sum, entry) => sum + parseNumber(entry.paidAmount), 0)
  const remaining = Math.max(0, suggested - alreadyPaid - parseNumber(paidAmount))
  const canSave = selectedStaff && parseNumber(paidAmount) > 0 && parseNumber(paidAmount) <= Math.max(0, suggested - alreadyPaid)

  const setPeriodRange = (nextPeriod) => {
    setPeriod(nextPeriod)
    if (nextPeriod === 'daily') {
      setStart(formatDateInput(today))
      setEnd(formatDateInput(today))
    } else if (nextPeriod === 'weekly') {
      setStart(formatDateInput(today))
      setEnd(formatDateInput(addDays(today, 6)))
    } else if (nextPeriod === 'monthly') {
      setStart(getMonthStart(today))
      setEnd(getMonthEnd(today))
    }
  }

  const selectStaff = (value) => {
    setStaffId(value)
    const staff = staffMembers.find((item) => item.id === value)
    if (staff) {
      setBaseSalary(String(staff.salary || ''))
      setCurrency(staff.currency || 'AFN')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="payroll-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canSave) return
          onSave(selectedStaff, {
            id: crypto.randomUUID(),
            period,
            start,
            end,
            baseSalary: monthlySalary,
            currency,
            suggested: Number(suggested.toFixed(2)),
            paidAmount: parseNumber(paidAmount),
            payable: Number(Math.max(0, suggested - alreadyPaid - parseNumber(paidAmount)).toFixed(2)),
            method,
            notes: notes.trim(),
            createdAt: new Date().toISOString(),
          })
        }}
      >
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <h2>{t.paySalary ?? 'Pay Salary'}{selectedStaff ? ` — ${selectedStaff.name}` : ''}</h2>
        {!lockedStaff && (
          <label className="wide">
            <span>{t.staffMembers}</span>
            <CustomSelect ariaLabel={t.staffMembers} options={staffOptions} value={staffId} onChange={selectStaff} />
          </label>
        )}
        <label className="wide">
          <span>{t.period ?? 'Period'}</span>
          <CustomSelect ariaLabel={t.period ?? 'Period'} options={periodOptions} value={period} onChange={setPeriodRange} />
        </label>
        <label><span>{t.start ?? 'Start'}</span><input type="date" value={start} onChange={(event) => { setStart(event.target.value); if (period !== 'custom') setPeriod('custom') }} /></label>
        <label><span>{t.end ?? 'End'}</span><input type="date" value={end} onChange={(event) => { setEnd(event.target.value); if (period !== 'custom') setPeriod('custom') }} /></label>
        <label><span>{t.baseSalary ?? 'Base Salary'}</span><input inputMode="decimal" value={baseSalary} onChange={(event) => setBaseSalary(event.target.value)} /></label>
        <label><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={currency} onChange={setCurrency} /></label>
        <label className="wide">
          <span>{t.paidAmount} <small>({t.suggested ?? 'Suggested'}: {suggested.toFixed(2)} {currency} • {days} {t.days ?? 'days'})</small></span>
          <input inputMode="decimal" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
          <small>{t.alreadyPaidForPeriod ?? 'Already paid for this period'}: <strong>{alreadyPaid.toFixed(2)} {currency}</strong> · {t.remainingForPeriod ?? 'Remaining for this period'}: <strong className="success-text">{remaining.toFixed(2)} {currency}</strong></small>
        </label>
        <label className="wide">
          <span>{t.paymentMethod}</span>
          <CustomSelect ariaLabel={t.paymentMethod} options={methodOptions} value={method} onChange={setMethod} />
        </label>
        <label className="wide"><span>{t.notes ?? 'Notes'}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <div className="modal-actions wide">
          <button type="button" onClick={onClose}>{t.cancel}</button>
          <button className="primary-btn" type="submit" disabled={!canSave}>{t.saveChanges}</button>
        </div>
      </form>
    </div>
  )
}

function StaffProfile({ onBack, onDeletePayroll, onPaySalary, staff, t }) {
  const history = staff.payrollHistory || []
  const paid = history.reduce((sum, entry) => sum + parseNumber(entry.paidAmount), 0)
  const payable = Math.max(0, parseNumber(staff.payable))

  return (
    <div className="entity-content staff-content">
      <div className="staff-profile-heading">
        <button type="button" onClick={onBack} aria-label={t.back ?? 'Back'}><ChevronLeft size={18} /></button>
        <div><h1>{staff.name}</h1><p>{staff.role || '-'} · {staff.department || '-'} · {staff.employmentType || '-' } · {staff.phone || '-'}</p></div>
        <button className="primary-btn" type="button" onClick={() => onPaySalary(staff)}><Plus size={16} /> {t.paySalary ?? 'Pay Salary'}</button>
      </div>
      <div className="summary-grid four">
        <article className="tone-blue"><span>{t.baseSalary ?? 'Base Salary'}</span><strong>{Number(staff.salary || 0).toFixed(2)} {staff.currency}</strong><UserPlus size={22} /></article>
        <article className="tone-green"><span>{t.staffPaid}</span><strong>{paid.toFixed(2)} {staff.currency}</strong><DollarSign size={22} /></article>
        <article className="tone-orange"><span>{t.staffPayable}</span><strong>{payable.toFixed(2)} {staff.currency}</strong><BriefcaseBusiness size={22} /></article>
        <article className="tone-navy"><span>{t.payrollHistory ?? 'Payroll History'}</span><strong>{history.length}</strong><CreditCard size={22} /></article>
      </div>
      <div className="data-panel staff-panel">
        <h2><CreditCard size={20} /> {t.payrollHistory ?? 'Payroll History'} ({history.length})</h2>
        <table className="data-table payroll-history-table">
          <thead><tr><th>{t.date}</th><th>{t.period ?? 'Period'}</th><th>{t.baseSalary ?? 'Base Salary'}</th><th>{t.paidAmount}</th><th>{t.staffPayable}</th><th>{t.status}</th><th>{t.paymentMethod}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan="8" className="empty-cell">{t.noPayrollHistory ?? 'No payroll history yet'}</td></tr>
            ) : history.map((entry) => (
              <tr key={entry.id}>
                <td>{getDateLabel(entry.createdAt.slice(0, 10))}</td>
                <td>{getDateLabel(entry.start)} – {getDateLabel(entry.end)}</td>
                <td>{Number(entry.baseSalary || 0).toFixed(2)} {entry.currency}</td>
                <td><strong>{Number(entry.paidAmount || 0).toFixed(2)} {entry.currency}</strong></td>
                <td className="success-text">{Number(entry.payable || 0).toFixed(2)} {entry.currency}</td>
                <td><span className="status-pill active">{t.paid}</span></td>
                <td>{t[entry.method] ?? entry.method}</td>
                <td><button className="payroll-delete-btn" type="button" onClick={() => onDeletePayroll(staff, entry)} aria-label={t.delete}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StaffPage({ companyInfo, onMoveToRecycle, onNotify, onStaffChange, printSettings, staffMembers, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [payrollStaff, setPayrollStaff] = useState(null)
  const [payrollOpen, setPayrollOpen] = useState(false)
  const [profileStaffId, setProfileStaffId] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const profileStaff = staffMembers.find((staff) => staff.id === profileStaffId)

  const filteredStaff = useMemo(() => staffMembers.filter((staff) => {
    const matchesSearch = `${staff.name} ${staff.role} ${staff.department}`.toLowerCase().includes(search.toLowerCase())
    const staffStatus = String(staff.status || 'Active').toLowerCase()
    const matchesStatus = statusFilter === 'all' || staffStatus === statusFilter
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const createdAt = staff.createdAt ? parseDateInput(staff.createdAt.slice(0, 10)) : null
    const daysOld = createdAt ? Math.floor((now - new Date(createdAt.toDateString())) / 86400000) : 0
    const rangeStart = parseDateInput(customStartDate)
    const rangeEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
    const matchesDate = !createdAt
      || dateFilter === 'all'
      || (dateFilter === 'today' && daysOld === 0)
      || (dateFilter === 'weekly' && daysOld <= 7)
      || (dateFilter === 'monthly' && daysOld <= 31)
      || (dateFilter === 'annual' && daysOld <= 366)
      || (dateFilter === 'custom' && (!rangeStart || createdAt >= rangeStart) && (!rangeEnd || createdAt <= rangeEnd))
    return matchesSearch && matchesStatus && matchesDate
  }), [customEndDate, customStartDate, dateFilter, search, staffMembers, statusFilter])

  const monthlyPayroll = staffMembers.reduce((sum, staff) => sum + Number(staff.salary || 0), 0)
  const staffPaid = staffMembers.reduce((sum, staff) => sum + (staff.payrollHistory || []).reduce((total, entry) => total + Number(entry.paidAmount || 0), 0), 0)
  const staffPayable = staffMembers.reduce((sum, staff) => sum + Number(staff.payable || 0), 0)
  const statusOptions = useMemo(() => [
    { value: 'all', label: t.allStatuses },
    { value: 'active', label: t.active },
    { value: 'inactive', label: t.inactive ?? 'Inactive' },
  ], [t.active, t.allStatuses, t.inactive])
  const dateOptions = useMemo(() => [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ], [t.allTime, t.annual, t.custom, t.monthly, t.today, t.weekly])

  const saveStaff = (staff) => {
    onStaffChange((current) => {
      const exists = current.some((item) => item.id === staff.id)
      const nextStaff = { ...staff, createdAt: staff.createdAt || new Date().toISOString() }
      return exists ? current.map((item) => (item.id === staff.id ? nextStaff : item)) : [...current, nextStaff]
    })
    setModalOpen(false)
    setEditingStaff(null)
    onNotify?.(t.savedSuccessfully)
  }

  const openPayroll = (staff = null) => {
    setPayrollStaff(staff)
    setPayrollOpen(true)
  }

  const savePayroll = (staff, entry) => {
    onStaffChange((current) => current.map((item) => {
      if (item.id !== staff.id) return item
      const history = [...(item.payrollHistory || []), entry]
      const paid = history.reduce((sum, currentEntry) => sum + parseNumber(currentEntry.paidAmount), 0)
      return { ...item, paid: paid.toFixed(2), payable: String(entry.payable), payrollHistory: history }
    }))
    setPayrollOpen(false)
    setPayrollStaff(null)
    onNotify?.(t.paymentRecorded ?? t.savedSuccessfully)
  }

  const deletePayroll = (staff, entry) => {
    onStaffChange((current) => current.map((item) => {
      if (item.id !== staff.id) return item
      const history = (item.payrollHistory || []).filter((record) => record.id !== entry.id)
      const paid = history.reduce((sum, currentEntry) => sum + parseNumber(currentEntry.paidAmount), 0)
      return { ...item, paid: paid.toFixed(2), payable: String(Math.max(0, parseNumber(item.payable) + parseNumber(entry.paidAmount))), payrollHistory: history }
    }))
  }

  const deleteStaff = (staff) => {
    onMoveToRecycle('staffMembers', staff)
  }

  if (profileStaff) {
    return (
      <>
        <StaffProfile
          onBack={() => setProfileStaffId('')}
          onDeletePayroll={deletePayroll}
          onPaySalary={openPayroll}
          staff={profileStaff}
          t={t}
        />
        {payrollOpen && <PayrollModal initialStaff={payrollStaff} lockedStaff={Boolean(payrollStaff)} onClose={() => { setPayrollOpen(false); setPayrollStaff(null) }} onSave={savePayroll} staffMembers={staffMembers} t={t} />}
      </>
    )
  }

  return (
    <div className="entity-content staff-content">
      <div className="entity-heading">
        <div><h1>{t.staff}</h1><p>{t.staffOverview}</p></div>
        <div className="entity-actions">
          <button type="button" onClick={() => setPrintOpen(true)}>{t.printReport}</button>
          <button type="button" className="payroll-btn" onClick={() => openPayroll()}>{t.payroll}</button>
          <button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.addStaffMember}</button>
        </div>
      </div>

      <div className="summary-grid four staff-summary-grid">
  <article className="tone-blue">
    <span>{t.totalStaff}</span>
    <strong>{staffMembers.length}</strong>
    <UserPlus size={22} />
  </article>

  <article className="tone-orange">
    <span>{t.monthlyPayroll}</span>
    <strong>{monthlyPayroll.toFixed(2)} ؋</strong>
    <DollarSign size={22} />
  </article>

  <article className="tone-green">
    <span>{t.staffPaid}</span>
    <strong>{staffPaid.toFixed(2)} ؋</strong>
    <CreditCard size={22} />
  </article>

  <article className="tone-orange">
    <span>{t.staffPayable}</span>
    <strong>{staffPayable.toFixed(2)} ؋</strong>
    <BriefcaseBusiness size={22} />
  </article>
</div>

      <div className="filter-card staff-filter">
        <input placeholder={t.searchStaff} value={search} onChange={(event) => setSearch(event.target.value)} />
        <CustomSelect ariaLabel={t.status} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
        {dateFilter === 'custom' && (
          <DateRangePicker
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
                  <td><span className={String(staff.status || 'Active').toLowerCase() === 'inactive' ? 'status-pill warning' : 'status-pill active'}>{String(staff.status || 'Active').toLowerCase() === 'inactive' ? (t.inactive ?? 'Inactive') : t.active}</span></td>
                  <td>
                    <StaffActionMenu
                      onDelete={deleteStaff}
                      onEdit={() => { setEditingStaff(staff); setModalOpen(true) }}
                      onPaySalary={openPayroll}
                      onViewProfile={(item) => setProfileStaffId(item.id)}
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
      {payrollOpen && <PayrollModal initialStaff={payrollStaff} lockedStaff={Boolean(payrollStaff)} onClose={() => { setPayrollOpen(false); setPayrollStaff(null) }} onSave={savePayroll} staffMembers={staffMembers} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={filteredStaff} title={t.staffReport} columns={[{ key: 'name', label: t.name }, { key: 'phone', label: t.phoneNumber }, { key: 'role', label: t.role }, { key: 'department', label: t.department }, { key: 'salary', label: t.monthlySalary }]} t={t} />}
    </div>
  )
}

export default StaffPage
