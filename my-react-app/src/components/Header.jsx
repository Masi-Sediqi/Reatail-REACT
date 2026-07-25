import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CustomSelect from './CustomSelect.jsx'
import {
  Archive,
  Download,
  Moon,
  Search,
  Sun,
  Trash2,
  Upload,
  WalletCards,
  X,
} from './Icons.jsx'
import {
  accountMenuItems,
  currencies,
  headerActions,
  toolbarSearchIcon,
} from '../data/dashboardData.js'
import { getCurrencyMeta, hasExchangeRate } from '../utils/currencyExchange.js'
import './Header.css'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fa', label: 'دری' },
  { code: 'ps', label: 'پشتو' },
]

const currencyOptions = currencies.map((currency) => ({
  value: currency.code,
  label: `${currency.code} - ${currency.name}`,
}))

function HeaderModalFrame({
  children,
  className = '',
  icon,
  onClose,
  subtitle,
  title,
}) {
  const modal = (
    <div
      className="modal-backdrop header-modal-backdrop"
      onClick={onClose}
    >
      <section
        className={`header-shared-modal ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <button
  className="modal-close header-modal-close"
  type="button"
  aria-label="Close modal"
  title="Close"
  onClick={onClose}
>
  <X size={16} />
</button>

        <header className="header-shared-modal-head">
          <span className="header-shared-modal-icon">
            {icon}
          </span>

          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>

        <div className="header-shared-modal-body">
          {children}
        </div>
      </section>
    </div>
  )

  return createPortal(
    modal,
    document.querySelector('.retail-shell') ?? document.body,
  )
}

function WalletModal({ onClose, onSave, t }) {
  const [mode, setMode] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('AFN')
  const [note, setNote] = useState('')

  const parsedAmount = Number.parseFloat(amount || 0) || 0
  const canSubmit = parsedAmount > 0

  const saveWalletChange = () => {
    if (!canSubmit) return

    onSave({
      id: crypto.randomUUID(),
      amount: parsedAmount,
      currency,
      date: new Date().toISOString().slice(0, 10),
      delta: mode === 'deposit' ? parsedAmount : -parsedAmount,
      note:
        note.trim() ||
        (mode === 'deposit'
          ? (t.deposit ?? 'Deposit')
          : (t.withdraw ?? 'Withdraw')),
      type: mode,
    })
  }

  return (
    <HeaderModalFrame
  className="cash-wallet-header-modal"
  icon={<WalletCards size={19} />}
  onClose={onClose}
  subtitle={
    t.cashWalletHint ??
    'Track owner cash deposits and withdrawals.'
  }
  title={t.cashWallet ?? 'Cash Wallet'}
>
      <form
        className={`wallet-modal-body wallet-mode-${mode}`}
        onSubmit={(event) => {
          event.preventDefault()
          saveWalletChange()
        }}
      >
        <div
          className="wallet-mode-tabs"
          role="tablist"
          aria-label={t.cashWallet ?? 'Cash Wallet'}
        >
          <button
            className={`deposit-mode ${
              mode === 'deposit' ? 'active' : ''
            }`}
            type="button"
            role="tab"
            aria-selected={mode === 'deposit'}
            onClick={() => setMode('deposit')}
          >
            <Download size={15} />
            <span>{t.deposit ?? 'Deposit'}</span>
          </button>

          <button
            className={`withdraw-mode ${
              mode === 'withdraw' ? 'active' : ''
            }`}
            type="button"
            role="tab"
            aria-selected={mode === 'withdraw'}
            onClick={() => setMode('withdraw')}
          >
            <Upload size={15} />
            <span>{t.withdraw ?? 'Withdraw'}</span>
          </button>
        </div>

        <div className="wallet-form-grid">
          <label>
            <span>{t.amount ?? 'Amount'} *</span>

            <input
              autoFocus
              min="0"
              step="0.01"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label>
            <span>{t.currency ?? 'Currency'}</span>

            <CustomSelect
              ariaLabel={t.currency ?? 'Currency'}
              className="wallet-currency-select"
              options={currencyOptions}
              value={currency}
              onChange={setCurrency}
            />
          </label>

          <label className="wide">
            <span>{t.reasonNote ?? 'Reason / Note'}</span>

            <textarea
              placeholder={
                mode === 'deposit'
                  ? (
                    t.depositNotePlaceholder ??
                    'e.g. Owner injection from personal funds'
                  )
                  : (
                    t.withdrawNotePlaceholder ??
                    'e.g. Owner withdrawal for personal use'
                  )
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>

        <footer className="wallet-modal-actions">
          <button
            className="wallet-cancel-btn"
            type="button"
            onClick={onClose}
          >
            {t.cancel ?? 'Cancel'}
          </button>

          <button
            className={`wallet-save-btn ${mode}`}
            type="submit"
            disabled={!canSubmit}
          >
            {mode === 'deposit'
              ? (t.saveDeposit ?? 'Save Deposit')
              : (t.saveWithdraw ?? 'Save Withdraw')}
          </button>
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
  <button type="button">
    <span>{t.products}</span>
    <small>{t.searchProductsHint ?? 'Search inventory items'}</small>
  </button>

  <button type="button">
    <span>{t.customers}</span>
    <small>{t.searchCustomersHint ?? 'Find customer records'}</small>
  </button>

  <button type="button">
    <span>{t.suppliers}</span>
    <small>{t.searchSuppliersHint ?? 'Browse suppliers'}</small>
  </button>

  <button type="button">
    <span>{t.salesBills}</span>
    <small>{t.searchSalesHint ?? 'Search invoices and bills'}</small>
  </button>
</div>
      </div>
    </HeaderModalFrame>
  )
}

function NotificationPanel({
  notifications = [],
  onDelete,
  onClear,
  t,
}) {
  const [soundEnabled, setSoundEnabled] = useState(true)

  return (
    <div className="notifications-panel">
      <header className="notifications-head">
        <strong>{t.notifications ?? 'Notifications'}</strong>

        <div className="notifications-head-actions">
          <button
            className={
              soundEnabled
                ? 'notification-tool active'
                : 'notification-tool'
            }
            type="button"
            aria-label={
              soundEnabled
                ? 'Disable notification sound'
                : 'Enable notification sound'
            }
            title={
              soundEnabled
                ? 'Disable sound'
                : 'Enable sound'
            }
            onClick={() =>
              setSoundEnabled((current) => !current)
            }
          >
            {soundEnabled ? '◖))' : '◖×'}
          </button>

          <button
            className="notification-tool"
            type="button"
            aria-label="Mark all as read"
            title="Mark all as read"
          >
            ✓✓
          </button>

          <button
            className="notification-tool"
            type="button"
            aria-label={t.clearAll ?? 'Clear all'}
            title={t.clearAll ?? 'Clear all'}
            onClick={onClear}
            disabled={!notifications.length}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {notifications.length > 0 ? (
        <>
          <div className="notification-group-title">
            <span>⚠</span>

            <strong>
              {t.stockAlerts ?? 'Stock Alerts'} (
              {notifications.length})
            </strong>
          </div>

          <div className="notification-list">
            {notifications.map((item) => (
              <article
                className={`notification-item ${
                  item.tone ?? 'warning'
                }`}
                key={item.id}
              >
                <span className="notification-symbol">
                  <Archive size={16} />
                </span>

                <div className="notification-content">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>

                  {item.time && (
                    <small>{item.time}</small>
                  )}
                </div>

                <button
                  className="notification-delete"
                  type="button"
                  aria-label={t.delete ?? 'Delete'}
                  title={t.delete ?? 'Delete'}
                  onClick={() => onDelete?.(item.id)}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="notifications-empty">
          <Archive size={22} />

          <strong>
            {t.noNotifications ?? 'No notifications'}
          </strong>

          <span>
            {t.noNotificationsHint ??
              'You have no new alerts.'}
          </span>
        </div>
      )}
    </div>
  )
}

function Header({
  baseCurrency = 'AFN',
  businessCurrencyFilter = 'all',
  exchangeCurrency = 'original',
  exchangeRates = {},
  language,
  notifications = [],
  onBusinessCurrencyFilterChange,
  onCashWalletChange,
  onExchangeCurrencyChange,
  onLanguageChange,
  onMissingCurrencyRate,
  onNavigate,
  onNotificationsChange,
  onThemeToggle,
  onWalletEntriesChange,
  t,
  theme,
}) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [businessCurrencyOpen, setBusinessCurrencyOpen] = useState(false)
  const [exchangeCurrencyOpen, setExchangeCurrencyOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const businessCurrencyButtonRef = useRef(null)
  const exchangeCurrencyButtonRef = useRef(null)
  const languageButtonRef = useRef(null)
  const accountButtonRef = useRef(null)
  const SearchIcon = toolbarSearchIcon
  const isDarkMode = theme === 'dark'
  const portalRoot = document.querySelector('.retail-shell') ?? document.body

  const menuPosition = (anchor, width = 224) => {
    const rect = anchor?.getBoundingClientRect()
    if (!rect) return { top: -9999, left: -9999, width }
    const viewportPadding = 12
    const left = Math.min(
      Math.max(viewportPadding, rect.right - width),
      window.innerWidth - width - viewportPadding,
    )

    return {
      top: rect.bottom + 8,
      left,
      width,
    }
  }

  const deleteNotification = (notificationId) => {
  onNotificationsChange?.((current) =>
    current.filter((item) => item.id !== notificationId),
  )
}

const clearNotifications = () => {
  onNotificationsChange?.([])
}

  const languageMenuStyle = menuPosition(languageButtonRef.current, 192)
  const accountMenuStyle = menuPosition(accountButtonRef.current, 224)
  const businessCurrencyMenuStyle = menuPosition(businessCurrencyButtonRef.current, 236)
  const exchangeCurrencyMenuStyle = menuPosition(exchangeCurrencyButtonRef.current, 236)

  const closeMenus = () => {
    setAccountOpen(false)
    setBusinessCurrencyOpen(false)
    setExchangeCurrencyOpen(false)
    setLanguageOpen(false)
    setNotificationsOpen(false)
  }

useEffect(() => {
  if (!accountOpen && !businessCurrencyOpen && !exchangeCurrencyOpen && !languageOpen && !notificationsOpen) {
    return undefined
  }

  const closeOnOutside = (event) => {
    const clickedInsideHeaderMenu = event.target.closest(
  '.language-tool-wrap, .header-language-menu, .account-wrap, .account-menu, .notifications-panel, .business-currency-wrap, .exchange-currency-wrap, .header-currency-menu',
)

    if (!clickedInsideHeaderMenu) {
      closeMenus()
    }
  }

  document.addEventListener('pointerdown', closeOnOutside)
  window.addEventListener('resize', closeMenus)
  window.addEventListener('scroll', closeMenus, true)

  return () => {
    document.removeEventListener('pointerdown', closeOnOutside)
    window.removeEventListener('resize', closeMenus)
    window.removeEventListener('scroll', closeMenus, true)
  }
}, [accountOpen, businessCurrencyOpen, exchangeCurrencyOpen, languageOpen, notificationsOpen])

  const selectedBusinessCurrency = getCurrencyMeta(businessCurrencyFilter)
  const selectedExchangeCurrency = getCurrencyMeta(exchangeCurrency)

  const chooseBusinessCurrency = (currencyCode) => {
    onBusinessCurrencyFilterChange?.(currencyCode)
    setBusinessCurrencyOpen(false)

    if (!hasExchangeRate(currencyCode, baseCurrency, exchangeRates)) {
      onMissingCurrencyRate?.(currencyCode)
    }
  }

  const chooseExchangeCurrency = (currencyCode) => {
    onExchangeCurrencyChange?.(currencyCode)
    setExchangeCurrencyOpen(false)

    if (!hasExchangeRate(currencyCode, baseCurrency, exchangeRates)) {
      onMissingCurrencyRate?.(currencyCode)
    }
  }

  const renderCurrencyMenu = ({
    firstLabel,
    firstValue,
    menuStyle,
    onSelect,
    selectedValue,
    title,
  }) => createPortal(
    <div
      className="header-currency-menu"
      role="menu"
      aria-label={title}
      style={menuStyle}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="header-currency-title">{title}</div>

      <button
        className={`header-currency-option ${selectedValue === firstValue ? 'is-selected' : ''}`}
        type="button"
        role="menuitemradio"
        aria-checked={selectedValue === firstValue}
        onClick={() => onSelect(firstValue)}
      >
        <span>{firstLabel}</span>
        <span className="header-currency-check">{selectedValue === firstValue ? '✓' : ''}</span>
      </button>

      <div className="header-currency-list">
        {currencies.map((currency) => {
          const isSelected = selectedValue === currency.code

          return (
            <button
              className={`header-currency-option ${isSelected ? 'is-selected' : ''}`}
              type="button"
              key={currency.code}
              role="menuitemradio"
              aria-checked={isSelected}
              onClick={() => onSelect(currency.code)}
            >
              <span>{currency.symbol} {currency.name}</span>
              <span className="header-currency-check">{isSelected ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>
    </div>,
    portalRoot,
  )

  return (
    <header className="app-header">
      <button className="search-shell" type="button" onClick={() => setSearchOpen(true)} aria-label={t.search}>
        <SearchIcon size={22} />
      </button>

      <div className="header-tools">
      {headerActions.map((action) => {
  const isLanguage =
    action.key === 'language' ||
    action.action === 'language'

  const isTheme =
    action.key === 'theme' ||
    action.action === 'theme'
  const isBusinessCurrency = action.key === 'filter'
  const isExchangeCurrency = action.key === 'sync'

  const ActionIcon = isTheme
  ? isDarkMode
    ? Moon
    : Sun
  : action.icon

  return (
    <div
  className={[
    'tool-wrap',
    `header-tool-${action.key}`,
    isLanguage ? 'language-tool-wrap' : '',
    isBusinessCurrency ? 'business-currency-wrap' : '',
    isExchangeCurrency ? 'exchange-currency-wrap' : '',
  ]
    .filter(Boolean)
    .join(' ')}
  key={action.key}
>
      <button
        ref={isLanguage ? languageButtonRef : isBusinessCurrency ? businessCurrencyButtonRef : isExchangeCurrency ? exchangeCurrencyButtonRef : undefined}
        className={[
  'icon-btn',
  action.key === 'notifications' ? 'notification-trigger' : '',
  isLanguage && languageOpen ? 'active' : '',
  isBusinessCurrency && businessCurrencyOpen ? 'active' : '',
  isExchangeCurrency && exchangeCurrencyOpen ? 'active' : '',
  isTheme ? 'theme-toggle-btn' : '',
]
  .filter(Boolean)
  .join(' ')}
        type="button"
        title={
  isTheme
    ? isDarkMode
      ? (t.lightMode ?? 'Light mode')
      : (t.darkMode ?? 'Dark mode')
    : (t[action.key] ?? action.key)
}
        aria-label={
  isTheme
    ? isDarkMode
      ? (t.lightMode ?? 'Light mode')
      : (t.darkMode ?? 'Dark mode')
    : (t[action.key] ?? action.key)
}
        aria-expanded={isLanguage ? languageOpen : isBusinessCurrency ? businessCurrencyOpen : isExchangeCurrency ? exchangeCurrencyOpen : undefined}
        aria-haspopup={isLanguage || isBusinessCurrency || isExchangeCurrency ? 'menu' : undefined}
        onClick={(event) => {
          event.stopPropagation()

          if (isTheme) {
            onThemeToggle()
            closeMenus()
            return
          }

          if (isBusinessCurrency) {
            setBusinessCurrencyOpen((current) => !current)
            setExchangeCurrencyOpen(false)
            setLanguageOpen(false)
            setNotificationsOpen(false)
            setAccountOpen(false)
            return
          }

          if (isExchangeCurrency) {
            setExchangeCurrencyOpen((current) => !current)
            setBusinessCurrencyOpen(false)
            setLanguageOpen(false)
            setNotificationsOpen(false)
            setAccountOpen(false)
            return
          }

          if (action.key === 'wallet') {
            setWalletOpen(true)
            closeMenus()
            return
          }

          if (action.key === 'notifications') {
            setNotificationsOpen((current) => !current)
            setBusinessCurrencyOpen(false)
            setExchangeCurrencyOpen(false)
            setLanguageOpen(false)
            setAccountOpen(false)
            return
          }

          if (isLanguage) {
            setLanguageOpen((current) => !current)
            setBusinessCurrencyOpen(false)
            setExchangeCurrencyOpen(false)
            setNotificationsOpen(false)
            setAccountOpen(false)
          }
        }}
      >
        <ActionIcon size={20} />

        {isBusinessCurrency && (
          <span className="pill-mini business-currency-pill">
            {businessCurrencyFilter === 'all' ? 'ALL' : selectedBusinessCurrency.code}
          </span>
        )}

        {isExchangeCurrency && exchangeCurrency !== 'original' && (
          <span className="pill-mini exchange-currency-pill">
            {selectedExchangeCurrency.code}
          </span>
        )}

        {action.key === 'notifications' && notifications.length > 0 && (
  <span className="notification-badge">
    {notifications.length > 99 ? '99+' : notifications.length}
  </span>
)}
      </button>

     {isBusinessCurrency && businessCurrencyOpen && renderCurrencyMenu({
       firstLabel: 'All — All Currencies',
       firstValue: 'all',
       menuStyle: businessCurrencyMenuStyle,
       onSelect: chooseBusinessCurrency,
       selectedValue: businessCurrencyFilter,
       title: 'Business Currency Filter',
     })}

     {isExchangeCurrency && exchangeCurrencyOpen && renderCurrencyMenu({
       firstLabel: 'Original (No Conversion)',
       firstValue: 'original',
       menuStyle: exchangeCurrencyMenuStyle,
       onSelect: chooseExchangeCurrency,
       selectedValue: exchangeCurrency,
       title: 'Exchange Currency',
     })}

     {isLanguage && languageOpen && (
  createPortal(
  <div
    className="header-language-menu"
    role="menu"
    aria-label={t.language ?? 'Language'}
    style={languageMenuStyle}
    onPointerDown={(event) => event.stopPropagation()}
  >
    <div className="header-language-title">
      {t.language ?? 'Language'}
    </div>

    <div className="header-language-options">
      {languages.map((item) => {
        const isSelected = language === item.code

        return (
          <button
            className={`header-language-option ${
              isSelected ? 'is-selected' : ''
            }`}
            type="button"
            key={item.code}
            role="menuitemradio"
            aria-checked={isSelected}
            onClick={(event) => {
              event.stopPropagation()
              onLanguageChange(item.code)
              setLanguageOpen(false)
            }}
          >
            <span>{item.label}</span>

            <span
              className="header-language-check"
              aria-hidden="true"
            >
              {isSelected ? '✓' : ''}
            </span>
          </button>
        )
      })}
    </div>
  </div>
  , portalRoot)
)}

      {action.key === 'notifications' &&
  notificationsOpen && (
    <NotificationPanel
      notifications={notifications}
      onDelete={deleteNotification}
      onClear={clearNotifications}
      t={t}
    />
  )}
    </div>
  )
})}

        <div className="account-wrap">
          <button
            ref={accountButtonRef}
            className="avatar-btn"
            type="button"
            aria-label={t.myAccount}
            onClick={(event) => {
              event.stopPropagation()
              setAccountOpen((open) => !open)
              setBusinessCurrencyOpen(false)
              setExchangeCurrencyOpen(false)
              setLanguageOpen(false)
              setNotificationsOpen(false)
            }}
          >
            A
          </button>

          {accountOpen && (
            createPortal(
            <div
              className="dropdown-menu account-menu"
              style={accountMenuStyle}
              onPointerDown={(event) => event.stopPropagation()}
            >
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
            , portalRoot)
          )}
        </div>
      </div>
      <span className="theme-state" aria-hidden="true">
        {theme === 'dark' ? 'dark' : 'light'}
      </span>
      {walletOpen && (
  <WalletModal
    onClose={() => setWalletOpen(false)}
    onSave={(entry) => {
      onCashWalletChange(
        (current) => Number(current || 0) + entry.delta,
      )

      onWalletEntriesChange?.((current) => [
        {
          ...entry,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ])

      setWalletOpen(false)
    }}
    t={t}
  />
)}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} t={t} />}
    </header>
  )
}

export default Header
