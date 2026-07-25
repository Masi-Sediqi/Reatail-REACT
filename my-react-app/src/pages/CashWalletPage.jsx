import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import { CalendarDays, ChevronLeft, DollarSign, Download, Plus, Printer, Search, SquareMenu, Trash2, Upload, WalletCards, X } from '../components/Icons.jsx'
import { currencies } from '../data/dashboardData.js'
import { calculateBusinessMetrics, dateOptionsFor, filterByDate, formatMoney, getExpenseCategory, parseNumber } from '../utils/businessMetrics.js'
import './CashWalletPage.css'

const currencyOptions = currencies.map((currency) => ({
  value: currency.code,
  label: `${currency.code} - ${currency.name}`,
}))

const dateLabel = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).includes('T') ? value : `${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const shamsiLabel = (value) => {
  const date = new Date(String(value || '').includes('T') ? value : `${value || new Date().toISOString().slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fa-AF-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function CashWalletModal({ baseCurrency, initialEntry, onClose, onSave, t }) {
  const [mode, setMode] = useState(initialEntry?.type || 'deposit')
  const [amount, setAmount] = useState(initialEntry?.amount ? String(initialEntry.amount) : '')
  const [currency, setCurrency] = useState(initialEntry?.currency || baseCurrency || 'AFN')
  const [note, setNote] = useState(initialEntry?.note || '')
  const parsedAmount = parseNumber(amount)
  const canSubmit = parsedAmount > 0

  const save = () => {
    if (!canSubmit) return
    onSave({
      id: initialEntry?.id || crypto.randomUUID(),
      amount: parsedAmount,
      createdAt: initialEntry?.createdAt || new Date().toISOString(),
      currency,
      date: initialEntry?.date || new Date().toISOString().slice(0, 10),
      note: note.trim() || (mode === 'deposit' ? t.deposit : t.withdraw),
      type: mode,
    })
  }

  return (
    <div className="modal-backdrop cash-wallet-backdrop" onClick={onClose}>
      <section className="cash-wallet-modal cash-wallet-header-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}><X size={17} /></button>
        <header className="cash-wallet-modal-head header-shared-modal-head">
          <span className="header-shared-modal-icon"><WalletCards size={18} /></span>
          <div>
            <h2>{t.cashWallet ?? 'Cash Wallet'}</h2>
            <p>{t.cashWalletHint ?? 'Track owner cash deposits and withdrawals.'}</p>
          </div>
        </header>
        <div className="cash-wallet-mode-tabs wallet-mode-tabs">
          <button className={`deposit-mode ${mode === 'deposit' ? 'active' : ''}`} type="button" onClick={() => setMode('deposit')}><Download size={15} /> <span>{t.deposit ?? 'Deposit'}</span></button>
          <button className={`withdraw-mode ${mode === 'withdraw' ? 'active' : ''}`} type="button" onClick={() => setMode('withdraw')}><Upload size={15} /> <span>{t.withdraw ?? 'Withdraw'}</span></button>
        </div>
        <div className="cash-wallet-form-grid wallet-form-grid">
          <label>
            <span>{t.amount ?? 'Amount'} *</span>
            <input autoFocus min="0" step="0.01" type="number" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label>
            <span>{t.currency ?? 'Currency'}</span>
            <CustomSelect ariaLabel={t.currency ?? 'Currency'} buttonClassName="wallet-currency-select" options={currencyOptions} value={currency} onChange={setCurrency} />
          </label>
          <label className="wide">
            <span>{t.reasonNote ?? 'Reason / Note'}</span>
            <textarea placeholder={t.walletNotePlaceholder ?? 'e.g. Owner injection from personal funds'} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
        </div>
        <footer className="modal-actions wallet-modal-actions">
          <button className="wallet-cancel-btn" type="button" onClick={onClose}>{t.cancel ?? 'Cancel'}</button>
          <button className={`wallet-save-btn ${mode}`} disabled={!canSubmit} type="button" onClick={save}>{mode === 'deposit' ? (t.saveDeposit ?? 'Save Deposit') : (t.saveWithdraw ?? 'Save Withdraw')}</button>
        </footer>
      </section>
    </div>
  )
}

function CashWalletPrintModal({ companyInfo, filterLabel, onClose, records, t }) {
  const [rowsPerPage, setRowsPerPage] = useState('25')
  const pageRows = records.slice(0, Number(rowsPerPage))
  let balance = 0
  const rows = pageRows.map((record, index) => {
    balance += record.direction === 'in' ? record.amount : -record.amount
    return { ...record, balance, number: index + 1 }
  })
  const deposits = records.filter((record) => record.direction === 'in').reduce((sum, record) => sum + record.amount, 0)
  const withdrawals = records.filter((record) => record.direction === 'out').reduce((sum, record) => sum + record.amount, 0)
  const currentBalance = deposits - withdrawals

  const print = () => {
    const paper = document.querySelector('.cash-statement-paper')?.outerHTML
    const win = window.open('', '_blank', 'width=960,height=720')
    if (!win || !paper) return
    win.document.write(`<html><head><title>${t.printStatement ?? 'Print Statement'}</title><style>body{font-family:Arial;margin:24px;color:#10172a}.cash-statement-paper{max-width:900px;margin:auto}.cash-print-brand{background:#172137;color:#fff;padding:22px;display:flex;justify-content:space-between;align-items:center}.cash-print-logo{display:flex;gap:14px;align-items:center}.cash-print-logo img{width:74px;height:56px;object-fit:cover;border-radius:4px}.cash-print-badge{border:1px solid #ffffff66;border-radius:6px;padding:10px 22px;font-weight:700}.cash-print-balance{border:1px solid #d8e0eb;border-radius:8px;margin:18px 0;padding:16px;display:flex;justify-content:space-between}.cash-print-table{width:100%;border-collapse:collapse}.cash-print-table th{background:#172137;color:#fff}.cash-print-table th,.cash-print-table td{padding:10px;border-bottom:1px solid #d8e0eb;font-size:12px;text-align:left}.success{color:#00a85a}.danger{color:#ef4444}.cash-print-total td{background:#172137;color:#fff;font-weight:700}.cash-print-footer{text-align:center;margin-top:20px;color:#52627a;font-size:12px}@media print{button{display:none}}</style></head><body>${paper}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="modal-backdrop cash-print-backdrop" onClick={onClose}>
      <section className="cash-print-modal" onClick={(event) => event.stopPropagation()}>
        <header className="cash-print-toolbar">
          <strong>{t.printStatement ?? 'Print Statement'} - {filterLabel}</strong>
          <div className="cash-print-actions">
            <label><span>{t.rowsPerPage ?? 'rowsPerPage'}</span><CustomSelect ariaLabel={t.rowsPerPage ?? 'rowsPerPage'} options={['25', '50', '100'].map((value) => ({ value, label: value }))} value={rowsPerPage} onChange={setRowsPerPage} /></label>
            <button type="button"><Download size={16} /> {t.download ?? 'Download'}</button>
            <button className="primary-btn" type="button" onClick={print}><Printer size={16} /> {t.print ?? 'Print'}</button>
            <button className="icon-only" type="button" onClick={onClose}><X size={16} /></button>
          </div>
        </header>
        <div className="cash-print-stage">
          <article className="cash-statement-paper">
            <header className="cash-print-brand">
              <div className="cash-print-logo">
                {companyInfo?.logo ? <img alt="" src={companyInfo.logo} /> : <span className="cash-print-logo-fallback">{(companyInfo?.name || 'R').slice(0, 1)}</span>}
                <div>
                  <h2>{companyInfo?.name || 'RetailPro'}</h2>
                  <p>{companyInfo?.tagline || 'Retail Management System'}</p>
                  <small>{companyInfo?.phone || ''} {companyInfo?.email || ''}</small>
                </div>
              </div>
              <div>
                <div className="cash-print-badge">{t.cashWalletStatement ?? 'Cash Wallet Statement'}</div>
                <small>{t.printDate ?? 'Print Date'}: {dateLabel(new Date().toISOString())} / {shamsiLabel(new Date().toISOString())}</small>
              </div>
            </header>
            <section className="cash-print-balance">
              <strong>{filterLabel} - AFN</strong>
              <div><span>{t.currentBalance ?? 'Current Balance'}</span><b className={currentBalance >= 0 ? 'success' : 'danger'}>{formatMoney(currentBalance)}</b></div>
              <div><span>{t.previousBalance ?? 'Previous Balance'}</span><b>{formatMoney(0)}</b></div>
            </section>
            <table className="cash-print-table">
              <thead><tr><th>#</th><th>{t.date ?? 'Date'}</th><th>{t.description ?? 'Description'}</th><th>{t.deposit ?? 'Deposit'}</th><th>{t.withdraw ?? 'Withdraw'}</th><th>{t.balance ?? 'Balance'}</th><th>{t.currency ?? 'Currency'}</th></tr></thead>
              <tbody>
                {rows.map((record) => (
                  <tr key={record.id}>
                    <td>{record.number}</td>
                    <td>{dateLabel(record.date)}<br /><small>{shamsiLabel(record.date)}</small></td>
                    <td>{record.note}</td>
                    <td className="success">{record.direction === 'in' ? formatMoney(record.amount, record.currency) : '-'}</td>
                    <td className="danger">{record.direction === 'out' ? formatMoney(record.amount, record.currency) : '-'}</td>
                    <td className={record.balance >= 0 ? 'success' : 'danger'}>{formatMoney(record.balance, record.currency)}</td>
                    <td>{record.currency || 'AFN'}</td>
                  </tr>
                ))}
                <tr className="cash-print-total"><td colSpan="3">{t.total ?? 'Total'}</td><td>{formatMoney(deposits)}</td><td>{formatMoney(withdrawals)}</td><td>{formatMoney(currentBalance)}</td><td>AFN</td></tr>
              </tbody>
            </table>
            <footer className="cash-print-footer">{t.totalEntries ?? 'Total Entries'}: {records.length} | {t.generated ?? 'Generated'}: {dateLabel(new Date().toISOString())}</footer>
          </article>
        </div>
      </section>
    </div>
  )
}

function CashWalletPage({ cashWallet, companyInfo, expenses = [], onBack, onCashWalletChange, onWalletEntriesChange, products = [], sales = [], staffMembers = [], suppliers = [], t, walletEntries = [] }) {
  const [activeType, setActiveType] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [search, setSearch] = useState('')
  const [supplierFilter] = useState('all')
  const [categoryFilter] = useState('all')
  const [editingEntry, setEditingEntry] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)

  const metrics = useMemo(() => calculateBusinessMetrics({ cashWallet, expenses, products, sales, staffMembers }), [cashWallet, expenses, products, sales, staffMembers])
  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers])
  const records = useMemo(() => {
    const paidRows = sales.filter((sale) => parseNumber(sale.paidAmount) > 0).map((sale) => ({
      amount: parseNumber(sale.paidAmount),
      category: 'sales',
      currency: sale.currency || 'AFN',
      date: sale.date || sale.createdAt,
      direction: 'in',
      group: 'paid',
      id: `sale-${sale.id}`,
      note: sale.invoiceNumber || t.sales,
      supplier: '',
      typeLabel: t.totalPaidFromSales ?? 'Total Paid (from sales)',
    }))
    const expenseRows = expenses.map((expense) => ({
      amount: parseNumber(expense.amount),
      category: getExpenseCategory(expense),
      currency: expense.currency || 'AFN',
      date: expense.date || expense.createdAt,
      direction: 'out',
      group: 'expenses',
      id: `expense-${expense.id}`,
      note: expense.description || getExpenseCategory(expense),
      supplier: supplierMap.get(expense.supplierId) || expense.supplier || expense.supplierName || '',
      typeLabel: t.expenses ?? 'Expenses',
    }))
    const walletRows = walletEntries.map((entry) => ({
      amount: parseNumber(entry.amount),
      category: entry.type === 'deposit' ? 'deposit' : 'withdraw',
      currency: entry.currency || 'AFN',
      date: entry.date || entry.createdAt,
      direction: entry.type === 'deposit' ? 'in' : 'out',
      group: entry.type === 'deposit' ? 'deposit' : 'withdraw',
      id: entry.id,
      source: entry,
      note: entry.note || (entry.type === 'deposit' ? t.deposit : t.withdraw),
      supplier: '',
      typeLabel: entry.type === 'deposit' ? (t.deposit ?? 'Deposit') : (t.withdraw ?? 'Withdraw'),
    }))
    return [...paidRows, ...walletRows, ...expenseRows].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }, [expenses, sales, supplierMap, t, walletEntries])

  const cards = [
    { key: 'paid', label: t.totalPaidFromSales ?? 'Total Paid (from sales)', value: sales.reduce((sum, sale) => sum + parseNumber(sale.paidAmount), 0), icon: WalletCards, tone: 'green' },
    { key: 'profit', label: t.pureProfit ?? 'Pure Profit', value: metrics.pureProfit, icon: DollarSign, tone: 'blue' },
    { key: 'deposit', label: t.totalDeposits ?? 'Total Deposits', value: records.filter((record) => record.group === 'deposit').reduce((sum, record) => sum + record.amount, 0), icon: Download, tone: 'blue' },
    { key: 'withdraw', label: t.totalWithdrawals ?? 'Total Withdrawals', value: records.filter((record) => record.group === 'withdraw').reduce((sum, record) => sum + record.amount, 0), icon: CalendarDays, tone: 'orange' },
  ]
  const typeOptions = [
    { value: 'all', label: t.filterAll ?? 'filter_all' },
    ...cards.map((card) => ({ value: card.key, label: card.label })),
    { value: 'expenses', label: t.expenses ?? 'Expenses' },
  ]
  const visibleRecords = filterByDate(records, dateFilter, customRange.start, customRange.end).filter((record) => {
    const byType = activeType === 'all' || (activeType === 'profit' ? ['paid', 'expenses'].includes(record.group) : record.group === activeType)
    const bySupplier = supplierFilter === 'all' || record.supplier === supplierFilter
    const byCategory = categoryFilter === 'all' || record.category === categoryFilter
    const query = search.trim().toLowerCase()
    const bySearch = !query || `${record.note} ${record.typeLabel} ${record.amount} ${record.category} ${record.supplier}`.toLowerCase().includes(query)
    return byType && bySupplier && byCategory && bySearch
  })
  const filterLabel = typeOptions.find((option) => option.value === activeType)?.label ?? (t.filterAll ?? 'filter_all')

  const signedWalletAmount = (entry) => (entry.type === 'deposit' ? entry.amount : -entry.amount)

  const saveWalletEntry = (entry) => {
    if (editingEntry) {
      onWalletEntriesChange((current) => current.map((item) => (item.id === editingEntry.id ? entry : item)))
      onCashWalletChange((current) => Number(current || 0) - signedWalletAmount(editingEntry) + signedWalletAmount(entry))
      setEditingEntry(null)
    } else {
      onWalletEntriesChange((current) => [entry, ...current])
      onCashWalletChange((current) => Number(current || 0) + signedWalletAmount(entry))
    }
    setModalOpen(false)
  }

  const openEditEntry = (entry) => {
    setEditingEntry(entry)
    setModalOpen(true)
  }

  const deleteWalletEntry = (entry) => {
    const ok = window.confirm(t.confirmDeleteWalletEntry ?? t.confirmDelete ?? 'Delete this wallet entry?')
    if (!ok) return
    onWalletEntriesChange((current) => current.filter((item) => item.id !== entry.id))
    onCashWalletChange((current) => Number(current || 0) - signedWalletAmount(entry))
  }

  const closeWalletModal = () => {
    setModalOpen(false)
    setEditingEntry(null)
  }

  const resetDateFilter = () => {
    setDateFilter('all')
    setCustomRange({ start: '', end: '' })
  }

  return (
    <section className="entity-content cash-wallet-page">
      <div className="entity-heading cash-wallet-heading">
        <div className="metric-detail-title">
          <button className="back-icon-btn" type="button" onClick={onBack}><ChevronLeft size={18} /></button>
          <div>
            <h1>{t.cashWallet ?? 'Cash Wallet'}</h1>
            <p>{t.cashWalletSubtitle ?? 'Includes pure profit - Owner cash deposits and withdrawals - expenses'}</p>
          </div>
        </div>
        <div className={`cash-wallet-top-actions ${dateFilter === 'custom' ? 'has-custom-range' : ''}`.trim()}>
          <div className="cash-wallet-action-select">
            <CustomSelect ariaLabel={t.filter ?? 'Filter'} options={typeOptions} value={activeType} onChange={setActiveType} />
          </div>
          <div className="cash-wallet-action-select">
            <CustomSelect ariaLabel={t.allTime ?? 'All Time'} options={dateOptionsFor(t)} value={dateFilter} onChange={setDateFilter} />
          </div>
          {dateFilter === 'custom' && (
            <>
              <DateRangePicker className="cash-wallet-date-range" end={customRange.end} onChange={setCustomRange} start={customRange.start} t={t} />
              <button className="cash-wallet-reset-filter" title={t.clear ?? 'Clear'} type="button" onClick={resetDateFilter}><X size={16} /></button>
            </>
          )}
          <button className="cash-wallet-add-btn" title={t.cashWallet ?? 'Cash Wallet'} type="button" onClick={() => setModalOpen(true)}><Plus size={20} /></button>
          <button className="cash-wallet-print-btn" type="button" onClick={() => setPrintOpen(true)}><Printer size={16} /> {t.printStatement ?? 'Print Statement'}</button>
        </div>
      </div>

      <div className="summary-grid four cash-wallet-summary">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <button className={`cash-wallet-card tone-${card.tone} ${activeType === card.key ? 'active' : ''}`} key={card.key} type="button" onClick={() => setActiveType(card.key)}>
              <span>{card.label}</span>
              <strong>{formatMoney(card.value)}</strong>
              <i><Icon size={20} /></i>
            </button>
          )
        })}
      </div>

      <div className="filter-card cash-wallet-filters">
        <div className="search-field"><Search size={17} /><input placeholder={t.searchPlaceholder ?? 'Search...'} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>

      <div className="data-panel cash-wallet-table-panel">
        <h2><WalletCards size={20} /> {filterLabel} ({visibleRecords.length})</h2>
        {visibleRecords.length === 0 ? (
          <div className="cash-wallet-empty-state">{t.noResultsFound ?? 'No results found'}</div>
        ) : (
          <div className="metric-detail-table-wrap">
            <table className="data-table cash-wallet-table">
              <thead><tr><th>{t.date ?? 'Date'}</th><th>{t.type ?? 'Type'}</th><th>{t.amount ?? 'Amount'}</th><th>{t.reasonNote ?? 'Reason / Note'}</th><th>{t.actions ?? 'Actions'}</th></tr></thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{dateLabel(record.date)}<br /><small>{shamsiLabel(record.date)}</small></td>
                    <td><span className={`cash-type-pill ${record.direction === 'in' ? 'deposit' : 'withdraw'}`}>{record.typeLabel}</span></td>
                    <td className={record.direction === 'in' ? 'success-text' : 'danger-text'}>{record.direction === 'in' ? '+ ' : '- '}{formatMoney(record.amount, record.currency)}</td>
                    <td>{record.note}</td>
                    <td className="cash-wallet-actions-cell">
  {record.source ? (
    <div className="cash-wallet-row-actions">
      <button
        className="cash-wallet-edit-action"
        type="button"
        onClick={() => openEditEntry(record.source)}
        aria-label={t.edit ?? 'Edit'}
        title={t.edit ?? 'Edit'}
      >
        <SquareMenu size={14} />
      </button>

      <button
        className="cash-wallet-delete-action"
        type="button"
        onClick={() => deleteWalletEntry(record.source)}
        aria-label={t.delete ?? 'Delete'}
        title={t.delete ?? 'Delete'}
      >
        <Trash2 size={14} />
      </button>
    </div>
  ) : (
    <span className="cash-wallet-derived-row">—</span>
  )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && <CashWalletModal baseCurrency="AFN" initialEntry={editingEntry} onClose={closeWalletModal} onSave={saveWalletEntry} t={t} />}
      {printOpen && <CashWalletPrintModal companyInfo={companyInfo} filterLabel={filterLabel} onClose={() => setPrintOpen(false)} records={visibleRecords} t={t} />}
    </section>
  )
}

export default CashWalletPage
