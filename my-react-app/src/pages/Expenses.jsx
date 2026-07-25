import { useEffect, useMemo, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import CustomFieldInputs from '../components/CustomFieldInputs.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import { currencies } from '../data/dashboardData.js'
import {
  Plus,
  Printer,
  Search,
  Trash2,
  WalletCards,
} from '../components/Icons.jsx'
import './Expenses.css'

const defaultExpenseCategories = ['Miscellaneous', 'Rent', 'Utilities', 'Transport', 'Salary', 'Inventory', 'Maintenance', 'Marketing', 'Food', 'Office Supplies']
const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Mobile Money']

const emptyExpense = {
  category: 'Miscellaneous',
  description: '',
  amount: '',
  currency: 'AFN',
  method: 'Cash',
  notes: '',
  date: '',
  customFields: {},
}

function EditIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

const getCategoryLabel = (category, t) => t.expenseCategories?.[category] ?? category

const parseExpenseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getDateMatches = (dateValue, filter, customStartDate, customEndDate) => {
  if (filter === 'all') return true
  const date = parseExpenseDate(dateValue)
  if (!date) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)
  const daysOld = Math.floor((today - dateOnly) / 86400000)
  const rangeStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
  const rangeEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
  return (filter === 'today' && daysOld === 0)
    || (filter === 'weekly' && daysOld >= 0 && daysOld <= 7)
    || (filter === 'monthly' && daysOld >= 0 && daysOld <= 31)
    || (filter === 'annual' && daysOld >= 0 && daysOld <= 366)
    || (filter === 'custom' && (!rangeStart || date >= rangeStart) && (!rangeEnd || date <= rangeEnd))
}

function ExpenseActionMenu({
  expense,
  isOpen,
  onDelete,
  onEdit,
  onToggle,
  t,
}) {
  void isOpen
  void onToggle

  return (
    <FloatingActionMenu
      ariaLabel={t.actions}
      actions={[
        {
          icon: <EditIcon size={15} />,
          label: t.edit ?? 'Edit',
          onClick: onEdit,
        },
        {
          danger: true,
          icon: <Trash2 size={15} />,
          label: t.delete ?? 'Delete',
          onClick: () => onDelete(expense),
        },
      ]}
    />
  )
}

function ExpenseModal({ categories, customFields = [], initialExpense, onCategoryAdd, onClose, onSave, t }) {
  const [form, setForm] = useState(() => ({ ...emptyExpense, ...(initialExpense ?? {}), customFields: { ...(initialExpense?.customFields ?? {}) } }))
  const [categoryMode, setCategoryMode] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [closing, setClosing] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateCustomField = (fieldId, value) => setForm((current) => ({
    ...current,
    customFields: { ...(current.customFields ?? {}), [fieldId]: value },
  }))
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }
  const saveCategory = () => {
    const category = newCategory.trim()
    if (!category) return
    onCategoryAdd(category)
    update('category', category)
    setNewCategory('')
    setCategoryMode(false)
  }
  const categoryOptions = categories.map((category) => ({ value: category, label: getCategoryLabel(category, t) }))
  const currencyOptions = currencies.map((item) => ({ value: item.code, label: item.code }))
  const methodOptions = paymentMethods.map((item) => ({ value: item, label: t.paymentMethods?.[item] ?? item }))

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <form
        className="entity-modal expense-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          const missingCustomField = customFields.some((field) => field.required && !String(form.customFields?.[field.id] ?? '').trim())
          if (!form.description.trim() || !String(form.amount).trim() || missingCustomField) return
          onSave({ ...form, id: form.id ?? crypto.randomUUID(), date: form.date || new Date().toISOString() })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <h2>{initialExpense ? t.editExpense : t.addExpense}</h2>
        <label className="wide">
          <span className="label-row">{t.category}<button className="tiny-plus" type="button" onClick={() => setCategoryMode(true)}>+ {t.custom}</button></span>
          {categoryMode ? (
            <div className="inline-field">
              <input autoFocus placeholder={t.categoryName} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
              <button type="button" onClick={saveCategory}>{t.add}</button>
              <button type="button" onClick={() => setCategoryMode(false)}>{t.cancel}</button>
            </div>
          ) : <CustomSelect ariaLabel={t.category} options={categoryOptions} value={form.category} onChange={(value) => update('category', value)} />}
        </label>
        <label className="wide"><span>{t.description} *</span><input className={submitted && !form.description.trim() ? 'field-invalid' : ''} placeholder={t.expenseDescriptionPlaceholder} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        <label><span>{t.amount} *</span><input className={submitted && !String(form.amount).trim() ? 'field-invalid' : ''} inputMode="decimal" placeholder="0" value={form.amount} onChange={(event) => update('amount', event.target.value)} /></label>
        <label><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={form.currency} onChange={(value) => update('currency', value)} /></label>
        <label className="wide"><span>{t.paymentMethod}</span><CustomSelect ariaLabel={t.paymentMethod} options={methodOptions} value={form.method} onChange={(value) => update('method', value)} /></label>
        <label className="wide"><span>{t.notes}</span><textarea placeholder={t.additionalNotes} value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
        <CustomFieldInputs fields={customFields} onChange={updateCustomField} submitted={submitted} values={form.customFields} />
        <button className="primary-btn wide" type="submit">{initialExpense ? t.saveChanges : t.addExpense}</button>
      </form>
    </div>
  )
}

function ExpensesPage({ companyInfo, expenseCategories = defaultExpenseCategories, expenses, onExpenseCategoriesChange, onExpensesChange, onMoveToRecycle, onNotify, printSettings, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const expenseCustomFields = companyInfo?.customFormFields?.expenses ?? []

  const usedExpenseCategories = useMemo(() => (
    [...new Set(expenses.map((expense) => expense.category).filter(Boolean))]
  ), [expenses])

  useEffect(() => {
    if (categoryFilter !== 'all' && !usedExpenseCategories.includes(categoryFilter)) setCategoryFilter('all')
  }, [categoryFilter, usedExpenseCategories])

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesSearch = `${expense.description} ${expense.category}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    const matchesMethod = methodFilter === 'all' || expense.method === methodFilter
    const matchesDate = getDateMatches(expense.date, dateFilter, customStartDate, customEndDate)
    return matchesSearch && matchesCategory && matchesMethod && matchesDate
  }), [categoryFilter, customEndDate, customStartDate, dateFilter, expenses, methodFilter, search])

  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const thisMonthTotal = expenses.reduce((sum, expense) => {
    const date = expense.date ? new Date(expense.date) : new Date()
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() ? sum + Number(expense.amount || 0) : sum
  }, 0)
  const printableExpenses = useMemo(() => filteredExpenses.map((expense) => ({
    ...expense,
    category: getCategoryLabel(expense.category, t),
    method: t.paymentMethods?.[expense.method] ?? expense.method,
  })), [filteredExpenses, t])
  const categoryOptions = useMemo(() => [
    { value: 'all', label: t.allCategories },
    ...usedExpenseCategories.map((category) => ({ value: category, label: getCategoryLabel(category, t) })),
  ], [usedExpenseCategories, t])
  const methodOptions = useMemo(() => [
    { value: 'all', label: t.allMethods },
    ...paymentMethods.map((item) => ({ value: item, label: t.paymentMethods?.[item] ?? item })),
  ], [t])
  const dateOptions = useMemo(() => [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today ?? 'Today' },
    { value: 'weekly', label: t.weekly ?? 'Weekly' },
    { value: 'monthly', label: t.monthly ?? 'Monthly' },
    { value: 'annual', label: t.annual ?? 'Annual' },
    { value: 'custom', label: t.custom ?? 'Custom' },
  ], [t.allTime, t.annual, t.custom, t.monthly, t.today, t.weekly])

  const addCategory = (category) => {
    onExpenseCategoriesChange?.((current) => current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category])
  }

  const saveExpense = (expense) => {
    onExpensesChange((current) => {
      const exists = current.some((item) => item.id === expense.id)
      return exists ? current.map((item) => (item.id === expense.id ? expense : item)) : [...current, expense]
    })
    setModalOpen(false)
    setEditingExpense(null)
    onNotify?.(t.savedSuccessfully)
  }

  const deleteExpense = (expense) => {
    onMoveToRecycle('expenses', expense)
  }

  return (
    <div className="entity-content expenses-content">
      <div className="entity-heading">
        <div><h1>{t.expensesManagement}</h1><p>{t.trackBusinessExpenses}</p></div>
        <div className="entity-actions expense-header-actions">
  <button
    className="expense-print-report-btn"
    type="button"
    onClick={() => setPrintOpen(true)}
  >
    <Printer size={15} />

    <span>
      {t.printReport ?? 'Print Report'}
    </span>
  </button>

  <button
    className="primary-btn expense-add-btn"
    type="button"
    onClick={() => {
      setEditingExpense(null)
      setModalOpen(true)
    }}
  >
    <Plus size={15} />

    <span>
      {t.addExpense ?? 'Add Expense'}
    </span>
  </button>
</div>
      </div>

      <div className="summary-grid three expenses-summary">
        <article className="tone-red"><span>{t.filteredTotal}</span><strong>{filteredTotal.toFixed(2)} ؋</strong></article>
        <article className="tone-orange"><span>{t.thisMonth}</span><strong>{thisMonthTotal.toFixed(2)} ؋</strong></article>
        <article className="tone-blue"><span>{t.expenseCount}</span><strong>{filteredExpenses.length}</strong></article>
      </div>

      <div className="filter-card expenses-filter">
        <div className="filter-search">
          <Search size={18} />
          <input placeholder={t.searchExpenses} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <CustomSelect ariaLabel={t.category} options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} />
        <CustomSelect ariaLabel={t.paymentMethod} options={methodOptions} value={methodFilter} onChange={setMethodFilter} />
        <div className="expense-date-filter">
          <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
          {dateFilter === 'custom' && (
            <DateRangePicker
              className="expense-date-range"
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
      </div>

      <div className="data-panel expense-panel">
        <h2><WalletCards size={20} /> {t.expenses} ({filteredExpenses.length})</h2>
        {filteredExpenses.length === 0 ? (
          <div className="expense-empty">
            <WalletCards size={42} />
            <strong>{t.noExpensesFound}</strong>
            <span>{t.addFirstExpense}</span>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>{t.category}</th><th>{t.description}</th><th>{t.amount}</th><th>{t.paymentMethod}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td><span className="soft-pill">{getCategoryLabel(expense.category, t)}</span></td>
                  <td>{expense.description}</td>
                  <td className="danger-text">{Number(expense.amount || 0).toFixed(2)} {expense.currency}</td>
                  <td>{t.paymentMethods?.[expense.method] ?? expense.method}</td>
                  <td>{expense.date ? new Date(expense.date).toLocaleDateString() : '-'}</td>
                  <td>
                    <ExpenseActionMenu
                      expense={expense}
                      onDelete={deleteExpense}
                      onEdit={() => { setEditingExpense(expense); setModalOpen(true) }}
                      t={t}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <ExpenseModal categories={expenseCategories} customFields={expenseCustomFields} initialExpense={editingExpense} onCategoryAdd={addCategory} onClose={() => { setModalOpen(false); setEditingExpense(null) }} onSave={saveExpense} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printableExpenses} title={t.expenseReport} columns={[{ key: 'category', label: t.category }, { key: 'description', label: t.description }, { key: 'amount', label: t.amount }, { key: 'currency', label: t.currency }, { key: 'method', label: t.paymentMethod }]} t={t} />}
    </div>
  )
}

export default ExpensesPage
