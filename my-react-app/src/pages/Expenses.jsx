import { useEffect, useMemo, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { currencies } from '../data/dashboardData.js'
import { WalletCards } from '../components/Icons.jsx'
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

function ExpenseActionMenu({ expense, isOpen, onDelete, onEdit, onToggle, t }) {
  return (
    <div className="row-actions" onPointerDown={(event) => event.stopPropagation()}>
      <button className="dots-btn" type="button" onClick={onToggle} aria-label={t.actions}>...</button>
      {isOpen && (
        <div className="row-action-menu">
          <button type="button" onClick={onEdit}>{t.edit}</button>
          <button className="danger" type="button" onClick={() => onDelete(expense)}>{t.delete}</button>
        </div>
      )}
    </div>
  )
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
          ) : (
            <select value={form.category} onChange={(event) => update('category', event.target.value)}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          )}
        </label>
        <label className="wide"><span>{t.description} *</span><input className={submitted && !form.description.trim() ? 'field-invalid' : ''} placeholder={t.expenseDescriptionPlaceholder} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        <label><span>{t.amount} *</span><input className={submitted && !String(form.amount).trim() ? 'field-invalid' : ''} inputMode="decimal" placeholder="0" value={form.amount} onChange={(event) => update('amount', event.target.value)} /></label>
        <label><span>{t.currency}</span><select value={form.currency} onChange={(event) => update('currency', event.target.value)}>{currencies.map((item) => <option value={item.code} key={item.code}>{item.code}</option>)}</select></label>
        <label className="wide"><span>{t.paymentMethod}</span><select value={form.method} onChange={(event) => update('method', event.target.value)}>{paymentMethods.map((item) => <option value={item} key={item}>{t.paymentMethods?.[item] ?? item}</option>)}</select></label>
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
  const [openActionId, setOpenActionId] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  useEffect(() => {
    window.localStorage.setItem('retail-expense-categories', JSON.stringify(categories.filter((category) => !defaultExpenseCategories.includes(category))))
  }, [categories])

  useEffect(() => {
    if (!openActionId) return undefined
    const closeMenu = () => setOpenActionId('')
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [openActionId])

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
    setOpenActionId('')
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
        <input placeholder={t.searchExpenses} value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">{t.allCategories}</option>
          {categories.map((category) => <option value={category} key={category}>{category}</option>)}
        </select>
        <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
          <option value="all">{t.allMethods}</option>
          {paymentMethods.map((item) => <option value={item} key={item}>{t.paymentMethods?.[item] ?? item}</option>)}
        </select>
        <select><option>{t.allTime}</option></select>
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
                  <td><span className="soft-pill">{expense.category}</span></td>
                  <td>{expense.description}</td>
                  <td className="danger-text">{Number(expense.amount || 0).toFixed(2)} {expense.currency}</td>
                  <td>{t.paymentMethods?.[expense.method] ?? expense.method}</td>
                  <td>{expense.date ? new Date(expense.date).toLocaleDateString() : '-'}</td>
                  <td>
                    <ExpenseActionMenu
                      expense={expense}
                      isOpen={openActionId === expense.id}
                      onDelete={deleteExpense}
                      onEdit={() => { setEditingExpense(expense); setModalOpen(true); setOpenActionId('') }}
                      onToggle={() => setOpenActionId((current) => current === expense.id ? '' : expense.id)}
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
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={filteredExpenses} title={t.expenseReport} columns={[{ key: 'category', label: t.category }, { key: 'description', label: t.description }, { key: 'amount', label: t.amount }, { key: 'currency', label: t.currency }, { key: 'method', label: t.paymentMethod }]} t={t} />}
    </div>
  )
}

export default ExpensesPage
