import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CustomSelect from './CustomSelect.jsx'
import { Archive, Search, Trash2, WalletCards } from './Icons.jsx'
import {
  accountMenuItems,
  headerActions,
  toolbarSearchIcon,
} from '../data/dashboardData.js'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fa', label: 'دری' },
  { code: 'ps', label: 'پشتو' },
]

const currencyOptions = ['AFN', 'USD', 'EUR'].map((item) => ({ value: item, label: item }))

function HeaderModalFrame({ children, icon, onClose, subtitle, title }) {
  const modal = (
    <div className="modal-backdrop header-modal-backdrop" onClick={onClose}>
      <section className="header-shared-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <header className="header-shared-modal-head">
          <span className="header-shared-modal-icon">{icon}</span>
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </header>
        <div className="header-shared-modal-body">
          {children}
        </div>
      </section>
    </div>
  )

  return createPortal(modal, document.querySelector('.retail-shell') ?? document.body)
}

function WalletModal({ cashWallet, onClose, onSave, t }) {
  const [mode, setMode] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('AFN')
  const [note, setNote] = useState('')
  const parsedAmount = Number.parseFloat(amount || 0) || 0
  const canSubmit = parsedAmount > 0
  const saveWalletChange = () => {
    if (!canSubmit) return
    onSave(mode === 'deposit' ? parsedAmount : -parsedAmount)
  }

  return (
    <HeaderModalFrame icon={<WalletCards size={20} />} onClose={onClose} subtitle={t.cashWalletHint} title={t.cashWallet}>
      <form
        className="wallet-modal-body"
        onSubmit={(event) => {
          event.preventDefault()
          saveWalletChange()
        }}
      >
        <div className="wallet-balance-card">
          <span>{t.currentCashWallet}</span>
          <strong>{Number(cashWallet || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ؋</strong>
        </div>
        <div className="wallet-mode-tabs">
          <button className={mode === 'deposit' ? 'active' : ''} type="button" onClick={() => setMode('deposit')}>{t.deposit}</button>
          <button className={mode === 'withdraw' ? 'active' : ''} type="button" onClick={() => setMode('withdraw')}>{t.withdraw}</button>
        </div>
        <div className="wallet-form-grid">
          <label><span>{t.amount} *</span><input autoFocus min="0" step="0.01" type="number" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <label><span>{t.currency}</span><CustomSelect ariaLabel={t.currency} options={currencyOptions} value={currency} onChange={setCurrency} /></label>
          <label className="wide"><span>{t.reasonNote}</span><textarea placeholder={t.walletNotePlaceholder} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        </div>
        <footer className="modal-actions">
          <button type="button" onClick={onClose}>{t.cancel}</button>
          <button className="primary-btn" type="button" onClick={saveWalletChange}>{mode === 'deposit' ? t.saveDeposit : t.saveWithdraw}</button>
        </footer>
      </form>
    </HeaderModalFrame>
  )
}

function SearchModal({ onClose, t }) {
  return (
    <HeaderModalFrame icon={<Search size={20} />} onClose={onClose} subtitle={t.searchModalHint} title={t.search}>
      <div className="search-modal-body">
        <div className="global-search-input">
          <Search size={18} />
          <input autoFocus placeholder={t.searchEverythingPlaceholder} />
        </div>
        <div className="search-suggestion-grid">
          <span>{t.products}</span>
          <span>{t.customers}</span>
          <span>{t.suppliers}</span>
          <span>{t.salesBills}</span>
        </div>
      </div>
    </HeaderModalFrame>
  )
}

function NotificationPanel({ t }) {
  const notifications = [
    { tone: 'warning', title: t.expiringSoon, detail: t.notificationExpiringDemo, time: `10 ${t.minutesAgo}` },
    { tone: 'warning', title: t.lowStockAlert, detail: t.notificationLowStockDemo, time: `10 ${t.minutesAgo}` },
    { tone: 'danger', title: t.outOfStock, detail: t.notificationOutStockDemo, time: `13 ${t.minutesAgo}` },
    { tone: 'success', title: t.saleCompleted, detail: t.notificationSaleDemo, time: `21 ${t.minutesAgo}` },
  ]

  return (
    <div className="notifications-panel">
      <header>
        <strong>{t.notifications}</strong>
        <div><button type="button">⌕</button><button type="button">✓</button><button type="button"><Trash2 size={15} /></button></div>
      </header>
      {notifications.map((item) => (
        <article className={`notification-item ${item.tone}`} key={item.title}>
          <span className="notification-symbol"><Archive size={16} /></span>
          <div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.time}</small></div>
          <button type="button" aria-label={t.delete}><Trash2 size={15} /></button>
        </article>
      ))}
    </div>
  )
}

function Header({ cashWallet, language, onCashWalletChange, onLanguageChange, onNavigate, onThemeToggle, t, theme }) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const SearchIcon = toolbarSearchIcon

  const closeMenus = () => {
    setAccountOpen(false)
    setLanguageOpen(false)
    setNotificationsOpen(false)
  }

  useEffect(() => {
    if (!accountOpen && !languageOpen && !notificationsOpen) return undefined

    const closeOnOutside = (event) => {
      if (!event.target.closest('.account-wrap, .tool-wrap, .notifications-panel')) {
        closeMenus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [accountOpen, languageOpen, notificationsOpen])

  return (
    <header className="app-header">
      <button className="search-shell" type="button" onClick={() => setSearchOpen(true)} aria-label={t.search}>
        <SearchIcon size={22} />
      </button>

      <div className="header-tools">
        {headerActions.map((action) => {
          const ActionIcon = action.icon
          const isLanguage = action.action === 'language'

          return (
            <div className="tool-wrap" key={action.key}>
              <button
                className={isLanguage && languageOpen ? 'icon-btn active' : 'icon-btn'}
                type="button"
                title={t[action.key] ?? action.key}
                onClick={() => {
                  if (action.action === 'theme') {
                    onThemeToggle()
                    return
                  }

                  if (action.key === 'wallet') {
                    setWalletOpen(true)
                    closeMenus()
                    return
                  }

                  if (action.key === 'notifications') {
                    setNotificationsOpen((open) => !open)
                    setLanguageOpen(false)
                    setAccountOpen(false)
                    return
                  }

                  if (isLanguage) {
                    setLanguageOpen((open) => !open)
                    setAccountOpen(false)
                  }
                }}
                aria-label={t[action.key] ?? action.key}
              >
                <ActionIcon size={20} />
                {action.key === 'filter' && <span className="pill-mini">ALL</span>}
                {action.badge && <span className="notification-badge">{action.badge}</span>}
              </button>

              {isLanguage && languageOpen && (
                <div className="dropdown-menu language-menu">
                  {languages.map((item) => (
                    <button
                      className={language === item.code ? 'selected' : ''}
                      type="button"
                      key={item.code}
                      onClick={() => {
                        onLanguageChange(item.code)
                        closeMenus()
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {action.key === 'notifications' && notificationsOpen && <NotificationPanel t={t} />}
            </div>
          )
        })}

        <div className="account-wrap">
          <button
            className="avatar-btn"
            type="button"
            aria-label={t.myAccount}
            onClick={() => {
              setAccountOpen((open) => !open)
              setLanguageOpen(false)
            }}
          >
            A
          </button>

          {accountOpen && (
            <div className="dropdown-menu account-menu">
              <strong>{t.myAccount}</strong>
              {accountMenuItems.map((item) => {
                const ItemIcon = item.icon

                return (
                  <button
                    className={`${item.divided ? 'divided' : ''} ${item.danger ? 'danger' : ''}`}
                    type="button"
                    key={item.key}
                    onClick={() => {
                      if (item.page) {
                        onNavigate(item.page)
                      }
                      closeMenus()
                    }}
                  >
                    <ItemIcon size={18} />
                    <span>{t[item.key]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <span className="theme-state" aria-hidden="true">
        {theme === 'dark' ? 'dark' : 'light'}
      </span>
      {walletOpen && <WalletModal cashWallet={cashWallet} onClose={() => setWalletOpen(false)} onSave={(delta) => {
        onCashWalletChange((current) => Number(current || 0) + delta)
        setWalletOpen(false)
      }} t={t} />}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} t={t} />}
    </header>
  )
}

export default Header
