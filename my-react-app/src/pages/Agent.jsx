import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Search, Send, Trash2, X } from '../components/Icons.jsx'
import { formatBusinessCurrencyAmount } from '../utils/currencyExchange.js'
import './Agent.css'

function MoreHorizontalIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  )
}

function RenameIcon({ size = 15 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const normalize = (value) => String(value || '').toLowerCase()

const defaultSuggestions = [
  'How many customers do I have?',
  'Which customers owe me money?',
  'How many products are out of stock?',
  'Show my low stock products.',
  'What is my total sales amount?',
  'How much payment is pending?',
  'What is my cash wallet balance?',
  'Which suppliers do I owe?',
  'Show today sales.',
  'Show monthly sales.',
  'How much expense do I have?',
  'What is my net profit?',
  'Which products expire soon?',
  'How many staff members do I have?',
  'What is my total stock quantity?',
  'What is my stock value?',
  'Show refunded sales.',
  'Show loan invoices.',
  'Who are my top customers?',
  'Give me a quick business summary.',
  'Show system alerts.',
  'How many invoices are paid?',
  'How many invoices are unpaid?',
  'What is total supplier payable?',
  'What is total customer receivable?',
  'Show active products.',
  'Show expired products.',
  'Show sales count.',
  'Show product categories.',
  'Show expense categories.',
  'Show staff payable.',
  'Show staff paid.',
  'Show cash deposits.',
  'Show cash withdrawals.',
  'What should I check first today?',
  'Prepare advanced report.',
  'Show inventory health.',
  'Show customer debt report.',
  'Show financial health.',
  'Show recent activity summary.',
]

const getCurrency = (companyInfo) => companyInfo?.currency || 'AFN'
const money = (value, companyInfo) => formatBusinessCurrencyAmount(value, getCurrency(companyInfo))

const dateOnly = (value) => (value ? new Date(`${String(value).slice(0, 10)}T12:00:00`) : null)
const daysUntil = (value) => {
  const date = dateOnly(value)
  if (!date) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.ceil((date - today) / 86400000)
}

const buildInsights = ({ cashWallet, cashWalletEntries = [], customers = [], expenses = [], godownEntries = [], products = [], sales = [], staffMembers = [], suppliers = [], companyInfo }) => {
  const totalSales = sales.reduce((sum, sale) => sum + parseNumber(sale.total), 0)
  const totalPaid = sales.reduce((sum, sale) => sum + parseNumber(sale.paidAmount), 0)
  const totalPending = sales.reduce((sum, sale) => sum + Math.max(0, parseNumber(sale.balance)), 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseNumber(expense.amount), 0)
  const totalRefunds = sales.reduce((sum, sale) => sum + (sale.refundHistory || []).reduce((inner, refund) => inner + parseNumber(refund.amount), 0), 0)
  const netProfit = totalPaid - totalExpenses - totalRefunds
  const customerDebt = customers
    .map((customer) => ({
      id: customer.id || customer.name,
      name: customer.name || customer.customerName || 'Customer',
      amount: parseNumber(customer.pending),
    }))
    .filter((item) => item.amount > 0)
  const saleDebt = sales
    .filter((sale) => parseNumber(sale.balance) > 0)
    .map((sale) => ({
      id: sale.customerId || sale.customerName || sale.id,
      name: sale.customerName || 'Customer',
      amount: parseNumber(sale.balance),
    }))
  const debtMap = new Map()
  ;[...customerDebt, ...saleDebt].forEach((item) => {
    const key = item.id || item.name
    const current = debtMap.get(key) || { name: item.name, amount: 0 }
    debtMap.set(key, { ...current, amount: current.amount + item.amount })
  })
  const debtors = [...debtMap.values()].sort((a, b) => b.amount - a.amount)
  const lowStock = products.filter((product) => {
    const quantity = parseNumber(product.quantity)
    const limit = parseNumber(product.lowStock || product.lowStockThreshold)
    return limit > 0 && quantity > 0 && quantity <= limit
  })
  const outOfStock = products.filter((product) => parseNumber(product.quantity) <= 0)
  const expiringSoon = products.filter((product) => {
    const days = daysUntil(product.expiry || product.expiryDate)
    return days !== null && days >= 0 && days <= 30
  })
  const expired = products.filter((product) => {
    const days = daysUntil(product.expiry || product.expiryDate)
    return days !== null && days < 0
  })
  const supplierPayable = suppliers.filter((supplier) => parseNumber(supplier.balance) > 0)
  const supplierReceivable = suppliers.filter((supplier) => parseNumber(supplier.balance) < 0)
  const stockQuantity = products.reduce((sum, product) => sum + parseNumber(product.quantity), 0)
  const stockValue = products.reduce((sum, product) => sum + parseNumber(product.quantity) * parseNumber(product.selling || product.purchase), 0)
  const staffPayable = staffMembers.reduce((sum, staff) => sum + parseNumber(staff.payable || staff.balance), 0)
  const staffPaid = staffMembers.reduce((sum, staff) => sum + parseNumber(staff.paid || staff.paidAmount), 0)
  const deposits = cashWalletEntries.filter((entry) => entry.group === 'deposit').reduce((sum, entry) => sum + parseNumber(entry.amount), 0)
  const withdrawals = cashWalletEntries.filter((entry) => entry.group === 'withdraw').reduce((sum, entry) => sum + parseNumber(entry.amount), 0)
  const alerts = [
    ...lowStock.map((product) => `${product.name}: low stock (${product.quantity || 0})`),
    ...outOfStock.map((product) => `${product.name}: out of stock`),
    ...expiringSoon.map((product) => `${product.name}: expires soon`),
    ...expired.map((product) => `${product.name}: expired`),
    ...debtors.slice(0, 6).map((item) => `${item.name}: customer debt ${money(item.amount, companyInfo)}`),
    ...supplierPayable.slice(0, 6).map((supplier) => `${supplier.name}: supplier payable ${money(supplier.balance, companyInfo)}`),
  ]

  return {
    alerts,
    cashWallet,
    customerCount: customers.length,
    debtors,
    deposits,
    expenses,
    expiringSoon,
    expired,
    godownEntries,
    lowStock,
    netProfit,
    outOfStock,
    products,
    sales,
    staffMembers,
    staffPaid,
    staffPayable,
    stockQuantity,
    stockValue,
    supplierPayable,
    supplierReceivable,
    suppliers,
    totalExpenses,
    totalPaid,
    totalPending,
    totalRefunds,
    totalSales,
    withdrawals,
  }
}

const listNames = (items, emptyText, render = (item) => item.name) => {
  if (!items.length) return emptyText
  return items.slice(0, 8).map((item, index) => `${index + 1}. ${render(item)}`).join('\n')
}

const makeAnswer = (question, insights, t, companyInfo) => {
  const q = normalize(question)
  const suggestionIndex = (t.agentQuestions || defaultSuggestions).findIndex((item) => normalize(item) === q)
  const has = (...words) => words.some((word) => q.includes(word))
  if (suggestionIndex === 0) return `${t.agentCustomerCountAnswer ?? 'Total customers'}: ${insights.customerCount}`
  if ([1, 37].includes(suggestionIndex)) {
    return insights.debtors.length
      ? `${t.agentDebtorsAnswer ?? 'Customers with debt:'}\n${listNames(insights.debtors, '', (item) => `${item.name} - ${money(item.amount, companyInfo)}`)}`
      : (t.agentNoDebtors ?? 'No customer debt found.')
  }
  if ([7, 23].includes(suggestionIndex)) {
    return insights.supplierPayable.length
      ? `${t.agentSupplierPayableAnswer ?? 'Suppliers you owe:'}\n${listNames(insights.supplierPayable, '', (supplier) => `${supplier.name} - ${money(supplier.balance, companyInfo)}`)}`
      : (t.agentNoSupplierPayable ?? 'No supplier payable found.')
  }
  if ([20, 34].includes(suggestionIndex)) {
    return insights.alerts.length
      ? `${t.agentAlertsAnswer ?? 'System alerts:'}\n${listNames(insights.alerts.map((name) => ({ name })), '', (item) => item.name)}`
      : (t.agentNoAlerts ?? 'No important alerts right now.')
  }
  if (suggestionIndex === 2) return `${t.outOfStock}: ${insights.outOfStock.length}\n${listNames(insights.outOfStock, t.agentNoOutOfStock ?? 'No out of stock products.')}`
  if (suggestionIndex === 3) return `${t.lowStock ?? 'Low stock'}: ${insights.lowStock.length}\n${listNames(insights.lowStock, t.agentNoLowStock ?? 'No low stock products.')}`
  if (suggestionIndex === 12) return `${t.agentExpiringSoon ?? 'Expiring soon'}: ${insights.expiringSoon.length}\n${listNames(insights.expiringSoon, t.agentNoExpiring ?? 'No products expiring soon.')}`
  if ([14, 25, 26].includes(suggestionIndex)) return `${t.stockQuantity}: ${insights.stockQuantity.toLocaleString()}\n${t.activeProducts}: ${insights.products.length}`
  if (suggestionIndex === 15) return `${t.globalStockValue}: ${money(insights.stockValue, companyInfo)}`
  if ([4, 8, 9, 16, 21, 22, 27].includes(suggestionIndex)) return `${t.totalSales}: ${money(insights.totalSales, companyInfo)}\n${t.totalPaid ?? 'Total paid'}: ${money(insights.totalPaid, companyInfo)}\n${t.pendingPayments}: ${money(insights.totalPending, companyInfo)}\n${t.sales}: ${insights.sales.length}`
  if ([10, 29].includes(suggestionIndex)) return `${t.totalExpenses}: ${money(insights.totalExpenses, companyInfo)}\n${t.allExpenses ?? 'Expenses'}: ${insights.expenses.length}`
  if ([11, 38].includes(suggestionIndex)) return `${t.netProfit}: ${money(insights.netProfit, companyInfo)}\n${t.totalRevenue}: ${money(insights.totalPaid, companyInfo)}\n${t.totalExpenses}: ${money(insights.totalExpenses, companyInfo)}\n${t.totalRefunds}: ${money(insights.totalRefunds, companyInfo)}`
  if ([6, 32, 33].includes(suggestionIndex)) return `${t.currentCashWallet}: ${money(insights.cashWallet, companyInfo)}\n${t.totalDeposits ?? 'Deposits'}: ${money(insights.deposits, companyInfo)}\n${t.totalWithdrawals ?? 'Withdrawals'}: ${money(insights.withdrawals, companyInfo)}`
  if ([13, 30, 31].includes(suggestionIndex)) return `${t.totalStaff}: ${insights.staffMembers.length}\n${t.staffPayable}: ${money(insights.staffPayable, companyInfo)}\n${t.staffPaid}: ${money(insights.staffPaid, companyInfo)}`
  if ([19, 35, 36, 39].includes(suggestionIndex)) return `${t.agentSummaryAnswer ?? 'Quick business summary:'}\n${t.totalCustomers}: ${insights.customerCount}\n${t.products}: ${insights.products.length}\n${t.sales}: ${insights.sales.length}\n${t.totalRevenue}: ${money(insights.totalSales, companyInfo)}\n${t.pendingPayments}: ${money(insights.totalPending, companyInfo)}\n${t.totalExpenses}: ${money(insights.totalExpenses, companyInfo)}\n${t.currentCashWallet}: ${money(insights.cashWallet, companyInfo)}\n${t.agentAlerts ?? 'Alerts'}: ${insights.alerts.length}`
  if (has('customer', 'مشتری', 'پېرود')) {
    if (has('owe', 'debt', 'loan', 'قرض', 'پور', 'باقی')) {
      return insights.debtors.length
        ? `${t.agentDebtorsAnswer ?? 'Customers with debt:'}\n${listNames(insights.debtors, '', (item) => `${item.name} - ${money(item.amount, companyInfo)}`)}`
        : (t.agentNoDebtors ?? 'No customer debt found.')
    }
    return `${t.agentCustomerCountAnswer ?? 'Total customers'}: ${insights.customerCount}`
  }
  if (has('supplier', 'تامین', 'عرضه', 'katanama')) {
    return insights.supplierPayable.length
      ? `${t.agentSupplierPayableAnswer ?? 'Suppliers you owe:'}\n${listNames(insights.supplierPayable, '', (supplier) => `${supplier.name} - ${money(supplier.balance, companyInfo)}`)}`
      : (t.agentNoSupplierPayable ?? 'No supplier payable found.')
  }
  if (has('alert', 'notification', 'اعلان', 'خبرتیا', 'check first')) {
    return insights.alerts.length
      ? `${t.agentAlertsAnswer ?? 'System alerts:'}\n${listNames(insights.alerts.map((name) => ({ name })), '', (item) => item.name)}`
      : (t.agentNoAlerts ?? 'No important alerts right now.')
  }
  if (has('stock', 'inventory', 'موجودی', 'گدام', 'ذخیره')) {
    if (has('out', 'تمام', 'خلاص', 'صفر')) return `${t.outOfStock}: ${insights.outOfStock.length}\n${listNames(insights.outOfStock, t.agentNoOutOfStock ?? 'No out of stock products.')}`
    if (has('low', 'کم')) return `${t.lowStock ?? 'Low stock'}: ${insights.lowStock.length}\n${listNames(insights.lowStock, t.agentNoLowStock ?? 'No low stock products.')}`
    if (has('value', 'ارزش')) return `${t.globalStockValue}: ${money(insights.stockValue, companyInfo)}`
    return `${t.stockQuantity}: ${insights.stockQuantity.toLocaleString()}\n${t.activeProducts}: ${insights.products.length}`
  }
  if (has('expir', 'expiry', 'تاریخ', 'منقضی')) {
    return `${t.agentExpiringSoon ?? 'Expiring soon'}: ${insights.expiringSoon.length}\n${listNames(insights.expiringSoon, t.agentNoExpiring ?? 'No products expiring soon.')}`
  }
  if (has('sale', 'sales', 'فروش', 'خرڅ')) {
    return `${t.totalSales}: ${money(insights.totalSales, companyInfo)}\n${t.totalPaid ?? 'Total paid'}: ${money(insights.totalPaid, companyInfo)}\n${t.pendingPayments}: ${money(insights.totalPending, companyInfo)}\n${t.sales}: ${insights.sales.length}`
  }
  if (has('expense', 'مصرف', 'لګښت')) {
    return `${t.totalExpenses}: ${money(insights.totalExpenses, companyInfo)}\n${t.allExpenses ?? 'Expenses'}: ${insights.expenses.length}`
  }
  if (has('profit', 'net', 'مفاد', 'گټه')) {
    return `${t.netProfit}: ${money(insights.netProfit, companyInfo)}\n${t.totalRevenue}: ${money(insights.totalPaid, companyInfo)}\n${t.totalExpenses}: ${money(insights.totalExpenses, companyInfo)}\n${t.totalRefunds}: ${money(insights.totalRefunds, companyInfo)}`
  }
  if (has('cash', 'wallet', 'کیف', 'نقد')) {
    return `${t.currentCashWallet}: ${money(insights.cashWallet, companyInfo)}\n${t.totalDeposits ?? 'Deposits'}: ${money(insights.deposits, companyInfo)}\n${t.totalWithdrawals ?? 'Withdrawals'}: ${money(insights.withdrawals, companyInfo)}`
  }
  if (has('staff', 'کارمند', 'کارکو')) {
    return `${t.totalStaff}: ${insights.staffMembers.length}\n${t.staffPayable}: ${money(insights.staffPayable, companyInfo)}\n${t.staffPaid}: ${money(insights.staffPaid, companyInfo)}`
  }
  if (has('summary', 'report', 'health', 'activity', 'advanced', 'خلاصه', 'گزارش', 'راپور', 'وضعیت')) {
    return `${t.agentSummaryAnswer ?? 'Quick business summary:'}\n${t.totalCustomers}: ${insights.customerCount}\n${t.products}: ${insights.products.length}\n${t.sales}: ${insights.sales.length}\n${t.totalRevenue}: ${money(insights.totalSales, companyInfo)}\n${t.pendingPayments}: ${money(insights.totalPending, companyInfo)}\n${t.totalExpenses}: ${money(insights.totalExpenses, companyInfo)}\n${t.currentCashWallet}: ${money(insights.cashWallet, companyInfo)}\n${t.agentAlerts ?? 'Alerts'}: ${insights.alerts.length}`
  }
  return t.agentFallbackAnswer ?? 'This system is an AI assistant that uses your system information, but it cannot answer complex or unclear questions yet. Please ask another question or use the suggested questions list.'
}

function AgentPage({ cashWallet, cashWalletEntries, companyInfo, customers, expenses, godownEntries, products, sales, staffMembers, suppliers, t }) {
  const [query, setQuery] = useState('')
  const [input, setInput] = useState('')
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('retail-agent-sessions') || '[]')
      return saved.length ? saved : [{ id: crypto.randomUUID(), title: 'New chat', messages: [] }]
    } catch {
      return [{ id: crypto.randomUUID(), title: 'New chat', messages: [] }]
    }
  })
  const [activeId, setActiveId] = useState(() => sessions[0]?.id)
  const [editingSessionId, setEditingSessionId] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [openSessionMenuId, setOpenSessionMenuId] = useState('')
  const [mobilePanel, setMobilePanel] = useState('')
  const [typing, setTyping] = useState('')
  const scrollRef = useRef(null)
  const typingTimerRef = useRef(null)
  const insights = useMemo(() => buildInsights({ cashWallet, cashWalletEntries, companyInfo, customers, expenses, godownEntries, products, sales, staffMembers, suppliers }), [cashWallet, cashWalletEntries, companyInfo, customers, expenses, godownEntries, products, sales, staffMembers, suppliers])
  const suggestions = t.agentQuestions || defaultSuggestions
  const visibleSuggestions = suggestions.filter((item) => normalize(item).includes(normalize(query))).slice(0, 40)
  const activeSession = sessions.find((session) => session.id === activeId) || sessions[0]

  useEffect(() => {
    window.localStorage.setItem('retail-agent-sessions', JSON.stringify(sessions.slice(0, 12)))
  }, [sessions])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeSession?.messages, typing])

  useEffect(() => () => {
    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current)
  }, [])

  const updateActive = (updater) => {
    setSessions((current) => current.map((session) => session.id === activeSession.id ? updater(session) : session))
  }

  const ask = (text) => {
    const clean = text.trim()
    if (!clean || typing) return
    const answer = makeAnswer(clean, insights, t, companyInfo)
    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current)
    const userMessage = { id: crypto.randomUUID(), role: 'user', text: clean }
    const agentMessage = { id: crypto.randomUUID(), role: 'agent', text: '' }
    updateActive((session) => ({
      ...session,
      title: session.messages.length ? session.title : clean.slice(0, 38),
      messages: [...session.messages, userMessage, agentMessage],
    }))
    setInput('')
    setTyping(answer)
    let index = 0
    typingTimerRef.current = window.setInterval(() => {
      index += 4
      const next = answer.slice(0, index)
      updateActive((session) => ({
        ...session,
        messages: session.messages.map((message) => message.id === agentMessage.id ? { ...message, text: next } : message),
      }))
      if (index >= answer.length) {
        window.clearInterval(typingTimerRef.current)
        typingTimerRef.current = null
        setTyping('')
      }
    }, 14)
  }

  const newChat = () => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }
    const session = { id: crypto.randomUUID(), title: t.agentNewChat ?? 'New chat', messages: [] }
    setSessions((current) => [session, ...current].slice(0, 12))
    setActiveId(session.id)
    setOpenSessionMenuId('')
    setTyping('')
  }

  const startRename = (session) => {
    setEditingSessionId(session.id)
    setEditingTitle(session.title)
    setOpenSessionMenuId('')
  }

  const saveRename = (event) => {
    event.preventDefault()
    const title = editingTitle.trim()
    if (!editingSessionId || !title) return
    setSessions((current) => current.map((session) => session.id === editingSessionId ? { ...session, title } : session))
    setEditingSessionId('')
    setEditingTitle('')
  }

  const deleteChat = (sessionId) => {
    if (!window.confirm(t.agentDeleteChatConfirm ?? 'Delete this chat?')) return
    setOpenSessionMenuId('')
    setSessions((current) => {
      const next = current.filter((session) => session.id !== sessionId)
      if (next.length) {
        if (activeId === sessionId) setActiveId(next[0].id)
        return next
      }
      const session = { id: crypto.randomUUID(), title: t.agentNewChat ?? 'New chat', messages: [] }
      setActiveId(session.id)
      return [session]
    })
  }

  return (
    <div className="agent-page">
      <section className="agent-hero">
        <div>
          <span>{t.agentBadge ?? 'Local reporting agent'}</span>
          <h1>{t.agent}</h1>
          <p>{t.agentSubtitle ?? 'Ask questions about customers, debts, sales, inventory, expenses, alerts, and reports.'}</p>
        </div>
        <div className="agent-mobile-actions">
          <button className={mobilePanel === 'history' ? 'active' : ''} type="button" onClick={() => setMobilePanel((current) => current === 'history' ? '' : 'history')}>
            {t.agentChatHistory ?? 'Chats'}
          </button>
          <button className={mobilePanel === 'suggestions' ? 'active' : ''} type="button" onClick={() => setMobilePanel((current) => current === 'suggestions' ? '' : 'suggestions')}>
            {t.agentSuggestedQuestions ?? 'Suggested questions'}
          </button>
        </div>
      </section>

      <section className="agent-shell">
        <aside className={`agent-history-panel ${mobilePanel === 'history' ? 'mobile-open' : ''}`.trim()}>
          <div className="agent-side-head">
            <strong>{t.agentChatHistory ?? 'Chats'}</strong>
            <button type="button" onClick={newChat}>{t.agentNewChat ?? 'New chat'}</button>
          </div>
          <div className="agent-history">
            {sessions.map((session) => (
              editingSessionId === session.id ? (
                <form className="agent-rename-form" key={session.id} onSubmit={saveRename}>
                  <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
                  <button type="submit">{t.save ?? t.saveChanges ?? 'Save'}</button>
                  <button type="button" onClick={() => setEditingSessionId('')} aria-label={t.cancel}><X size={14} /></button>
                </form>
              ) : (
                <div className={session.id === activeSession?.id ? 'agent-history-item active' : 'agent-history-item'} key={session.id}>
                  <button className="agent-history-open" type="button" onClick={() => { setActiveId(session.id); setOpenSessionMenuId('') }}>
                    <MessageCircle size={14} />
                    <span>{session.title}</span>
                  </button>
                  <button
  className={`agent-history-menu-trigger ${
    openSessionMenuId === session.id ? 'active' : ''
  }`}
  type="button"
  aria-label={t.actions ?? 'Actions'}
  aria-expanded={openSessionMenuId === session.id}
  title={t.actions ?? 'Actions'}
  onClick={() =>
    setOpenSessionMenuId((current) =>
      current === session.id ? '' : session.id
    )
  }
>
  <MoreHorizontalIcon size={16} />
</button>
                  {openSessionMenuId === session.id && (
                    <div className="agent-history-menu">
                      <button
  className="agent-history-rename-action"
  type="button"
  onClick={() => startRename(session)}
>
  <RenameIcon size={15} />

  <span>
    {t.agentRenameChat ?? 'Rename'}
  </span>
</button>
                      <button className="danger" type="button" onClick={() => deleteChat(session.id)}>
                        <Trash2 size={14} />
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </aside>

        <main className="agent-chat">
          <div className="agent-chat-log" ref={scrollRef}>
            {!activeSession?.messages.length && (
              <div className="agent-empty">
                <MessageCircle size={34} />
                <strong>{t.agentEmptyTitle ?? 'Ask your business agent'}</strong>
                <span>{t.agentEmptyHint ?? 'Try: Which customers owe me money?'}</span>
              </div>
            )}
            {activeSession?.messages.map((message) => (
              <div className={`agent-message ${message.role}`} key={message.id}>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <form className="agent-compose" onSubmit={(event) => { event.preventDefault(); ask(input) }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.agentInputPlaceholder ?? 'Ask about your business...'} />
            <button type="submit" disabled={!input.trim() || Boolean(typing)}>
              <Send size={17} />
              <span>{t.send ?? 'Send'}</span>
            </button>
          </form>
        </main>

        <aside className={`agent-side ${mobilePanel === 'suggestions' ? 'mobile-open' : ''}`.trim()}>
          <div className="agent-side-head">
            <strong>{t.agentSuggestedQuestions ?? 'Suggested questions'}</strong>
          </div>
          <label className="agent-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.agentSearchPlaceholder ?? 'Search questions...'} />
          </label>
          <div className="agent-suggestions">
            {visibleSuggestions.map((question) => (
              <button type="button" key={question} onClick={() => ask(question)}>{question}</button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}

export default AgentPage
