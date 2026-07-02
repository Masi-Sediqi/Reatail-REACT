import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import FloatingActionMenu from '../components/FloatingActionMenu.jsx'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { CalendarDays, CreditCard, DollarSign, ReceiptText, Search, WalletCards } from '../components/Icons.jsx'
import './Loans.css'

const parseNumber = (value) => Number.parseFloat(value || 0) || 0

const formatMoney = (value, currency = 'AFN') => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'PKR' ? 'Rs' : '؋'
  return `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`
}

const getGregorianLabel = (isoDate) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const getShamsiShortLabel = (isoDate) => {
  try {
    return new Intl.DateTimeFormat('en-CA-u-ca-persian', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${isoDate}T12:00:00`))
  } catch {
    return isoDate
  }
}

function LoansPage({ companyInfo, printSettings, sales, t }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [dateFilter, setDateFilter] = useState('all')
  const [printOpen, setPrintOpen] = useState(false)

  const loans = useMemo(() => sales
    .map((sale) => ({
      ...sale,
      balance: Math.max(0, parseNumber(sale.total) - parseNumber(sale.paidAmount)),
    }))
    .filter((sale) => sale.balance > 0), [sales])

  const filteredLoans = loans.filter((loan) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = !needle || `${loan.invoiceNumber} ${loan.customerName}`.toLowerCase().includes(needle)
    const matchesStatus = statusFilter === 'all' || statusFilter === 'active'
    return matchesSearch && matchesStatus
  })

  const activeTotal = filteredLoans.reduce((sum, loan) => sum + parseNumber(loan.total), 0)
  const paidTotal = filteredLoans.reduce((sum, loan) => sum + parseNumber(loan.paidAmount), 0)
  const pendingTotal = filteredLoans.reduce((sum, loan) => sum + parseNumber(loan.balance), 0)
  const statusOptions = [
    { value: 'active', label: t.activeOnly },
    { value: 'all', label: t.all },
  ]
  const dateOptions = [{ value: 'all', label: t.allTime }]
  const printRows = filteredLoans.map((loan) => ({
    id: loan.id,
    invoice: loan.invoiceNumber,
    customer: loan.customerName,
    total: formatMoney(loan.total, loan.currency),
    paid: formatMoney(loan.paidAmount, loan.currency),
    remaining: formatMoney(loan.balance, loan.currency),
    date: getGregorianLabel(loan.date),
  }))

  return (
    <section className="entity-content loans-content">
      <div className="entity-heading">
        <div><h1>{t.loanManagement}</h1><p>{t.trackManageCustomerLoans}</p></div>
        <div className="entity-actions"><button type="button" onClick={() => setPrintOpen(true)}><ReceiptText size={16} /> {t.printReport}</button></div>
      </div>

      <div className="summary-grid four loans-summary">
        <article className="tone-blue"><span>{t.activeLoans}</span><strong>{formatMoney(activeTotal)}</strong><CreditCard size={22} /></article>
        <article className="tone-green"><span>{t.paidLoans}</span><strong>{formatMoney(paidTotal)}</strong><DollarSign size={22} /></article>
        <article className="tone-orange"><span>{t.pendingLoans}</span><strong>{formatMoney(pendingTotal)}</strong><CalendarDays size={22} /></article>
        <article className="tone-red"><span>{t.loanCustomers}</span><strong>{filteredLoans.length}</strong><WalletCards size={22} /></article>
      </div>

      <div className="filter-bar loans-filter-bar">
        <div className="search-field"><Search size={17} /><input placeholder={t.searchInvoiceCustomer} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <CustomSelect ariaLabel={t.status} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <CustomSelect ariaLabel={t.allTime} options={dateOptions} value={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="data-panel loans-panel">
        <h2><CreditCard size={20} /> {t.loans} ({filteredLoans.length})</h2>
        <div className="loans-table-wrap">
          <table className="data-table loans-table">
            <thead><tr><th>{t.invoice}</th><th>{t.customer}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.status}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredLoans.length === 0 ? <tr><td className="empty-cell" colSpan="8">{t.noLoansFound}</td></tr> : filteredLoans.map((loan) => (
                <tr key={loan.id}>
                  <td><strong>{loan.invoiceNumber}</strong></td>
                  <td>{loan.customerName}</td>
                  <td><strong>{formatMoney(loan.total, loan.currency)}</strong></td>
                  <td className="success-text">{formatMoney(loan.paidAmount, loan.currency)}</td>
                  <td className="danger-text">{formatMoney(loan.balance, loan.currency)}</td>
                  <td><span className="status-pill warning">{t.pending}</span></td>
                  <td>{getGregorianLabel(loan.date)}<small>{getShamsiShortLabel(loan.date)}</small></td>
                  <td><FloatingActionMenu ariaLabel={t.actions} actions={[{ label: t.print, onClick: () => setPrintOpen(true) }]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={printRows} title={t.loanReport} columns={[
        { key: 'invoice', label: t.invoice },
        { key: 'customer', label: t.customer },
        { key: 'total', label: t.total },
        { key: 'paid', label: t.paid },
        { key: 'remaining', label: t.remaining },
        { key: 'date', label: t.date },
      ]} t={t} />}
    </section>
  )
}

export default LoansPage
