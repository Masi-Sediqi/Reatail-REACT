import { useEffect, useMemo, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import { currencies } from '../data/dashboardData.js'
import { Search, WalletCards } from '../components/Icons.jsx'
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
}

const readExpenseCategories = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem('retail-expense-categories') || '[]')
    const merged = [...defaultExpenseCategories, ...(Array.isArray(stored) ? stored : [])]
    return merged.filter((category, index) => merged.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index)
  } catch {
    return defaultExpenseCategories
  }
}

const getCategoryLabel = (category, t) => t.expenseCategories?.[category] ?? category

function ExpenseActionMenu({ expense, isOpen, onDelete, onEdit, onToggle, t }) {
  void isOpen
  void onToggle
  return <FloatingActionMenu ariaLabel={t.actions} actions={[
    { label: t.edit, onClick: onEdit },
    { danger: true, label: t.delete, onClick: () => onDelete(expense) },
  ]} />
}

function ExpenseModal({ categories, initialExpense, onCategoryAdd, onClose, onSave, t }) {
  const [form, setForm] = useState(initialExpense ?? emptyExpense)
  const [categoryMode, setCategoryMode] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [closing, setClosing] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
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
          if (!form.description.trim() || !String(form.amount).trim()) return
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
        <button className="primary-btn wide" type="submit">{initialExpense ? t.saveChanges : t.addExpense}</button>
      </form>
    </div>
  )
}

function ExpensesPage({ companyInfo, expenses, onExpensesChange, onMoveToRecycle, onNotify, printSettings, t }) {
  const [categories, setCategories] = useState(readExpenseCategories)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    window.localStorage.setItem('retail-expense-categories', JSON.stringify(categories.filter((category) => !defaultExpenseCategories.includes(category))))
  }, [categories])

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesSearch = `${expense.description} ${expense.category}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    const matchesMethod = methodFilter === 'all' || expense.method === methodFilter
    return matchesSearch && matchesCategory && matchesMethod
  }), [categoryFilter, expenses, methodFilter, search])

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
    ...categories.map((category) => ({ value: category, label: getCategoryLabel(category, t) })),
  ], [categories, t])
  const methodOptions = useMemo(() => [
    { value: 'all', label: t.allMethods },
    ...paymentMethods.map((item) => ({ value: item, label: t.paymentMethods?.[item] ?? item })),
  ], [t])
  const dateOptions = useMemo(() => [{ value: 'all', label: t.allTime }], [t.allTime])

  const addCategory = (category) => {
    setCategories((current) => current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category])
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
        <div className="entity-actions">
          <button type="button" onClick={() => setPrintOpen(true)}>{t.printReport}</button>
          <button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.addExpense}</button>
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
        <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
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

      {modalOpen && <ExpenseModal categories={categories} initialExpense={editingExpense} onCategoryAdd={addCategory} onClose={() => { setModalOpen(false); setEditingExpense(null) }} onSave={saveExpense} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printableExpenses} title={t.expenseReport} columns={[{ key: 'category', label: t.category }, { key: 'description', label: t.description }, { key: 'amount', label: t.amount }, { key: 'currency', label: t.currency }, { key: 'method', label: t.paymentMethod }]} t={t} />}
    </div>
  )
}

export default ExpensesPage
