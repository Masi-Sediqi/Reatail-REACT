import { useEffect, useMemo, useRef, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import DashboardMetricDetail from './pages/DashboardMetricDetail.jsx'
import CashWalletPage from './pages/CashWalletPage.jsx'
import Profile from './pages/Profile.jsx'
import SettingsPage from './pages/Settings.jsx'
import ProductsPage from './pages/Products.jsx'
import SuppliersPage from './pages/Suppliers.jsx'
import BundlesPage from './pages/Bundles.jsx'
import CustomersPage from './pages/Customers.jsx'
import ExpensesPage from './pages/Expenses.jsx'
import RecycleBinPage from './pages/RecycleBin.jsx'
import StaffPage from './pages/Staff.jsx'
import BillingPage from './pages/Billing.jsx'
import SalesBillsPage from './pages/SalesBills.jsx'
import GodownPage from './pages/Godown.jsx'
import LoansPage from './pages/Loans.jsx'
import FinancialsPage from './pages/Financials.jsx'
import ReportsPage from './pages/Reports.jsx'
import TermsPrivacy from './pages/TermsPrivacy.jsx'
import AgentPage from './pages/Agent.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import UserGuide from './pages/UserGuide.jsx'
import HelpCenter from './pages/HelpCenter.jsx'
import { Eye, Lock, Shield } from './components/Icons.jsx'
import About from './pages/About.jsx'
import FAQ from './pages/FAQ.jsx'
import Workflows from './pages/Workflows.jsx'
import { colorThemes, productCategories } from './data/dashboardData.js'
import { translations } from './data/translations.js'
import { getCurrencyMeta } from './utils/currencyExchange.js'
import { clearLegacyJsonStorage, hasLegacyJsonStorage, loadJsonStorage, readLegacyJson, saveJsonStorage } from './utils/jsonStorage.js'
import { playNotificationSound } from './utils/notificationSounds.js'
import { hashPassword } from './utils/security.js'
import lockWallpaper from './assets/Black Blue and White Abstract Wave Desktop Wallpaper.png'
import './App.css'
import './pages/PageShared.css'

const getPageFromPath = () => {
  if (window.location.pathname.startsWith('/dashboard/')) return `dashboardMetric:${window.location.pathname.split('/').pop() || 'totalRevenue'}`
  if (window.location.pathname.startsWith('/customers/')) return `customerProfile:${window.location.pathname.split('/').pop() || ''}`
  if (window.location.pathname === '/user-guide') return 'userGuide'
  if (window.location.pathname === '/help-center') return 'helpCenter'
  if (window.location.pathname === '/about') return 'about'
  if (window.location.pathname === '/faq') return 'faq'
  if (window.location.pathname === '/workflows') return 'workflows'
  if (window.location.pathname === '/profile') return 'profile'
  if (window.location.pathname === '/settings') return 'settings'
  if (window.location.pathname === '/terms') return 'terms'
  if (window.location.pathname === '/products') return 'products'
  if (window.location.pathname === '/suppliers') return 'suppliers'
  if (window.location.pathname === '/bundles') return 'bundles'
  if (window.location.pathname === '/customers') return 'customers'
  if (window.location.pathname === '/staff') return 'staff'
  if (window.location.pathname === '/expenses') return 'expenses'
  if (window.location.pathname === '/billing') return 'billing'
  if (window.location.pathname === '/godown') return 'godown'
  if (window.location.pathname === '/loans') return 'loans'
  if (window.location.pathname === '/financials') return 'financials'
  if (window.location.pathname === '/reports') return 'reports'
  if (window.location.pathname === '/agent') return 'agent'
  if (window.location.pathname === '/sales-bills') return 'salesBills'
  if (window.location.pathname === '/recycle-bin') return 'recycleBin'
  return 'dashboard'
}

function CurrencyRateWarningModal({ currencyCode, onClose, onSettings }) {
  const currency = getCurrencyMeta(currencyCode)

  return (
    <div className="modal-backdrop currency-rate-warning-backdrop" onClick={onClose}>
      <section className="currency-rate-warning-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="currency-rate-warning-icon">!</div>
        <h2>Exchange rate is not defined</h2>
        <p>
          No rate/value is set for {currency.name} ({currency.code}). Values will show as 0 until you set it in Settings.
        </p>
        <div className="currency-rate-warning-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={onSettings}>Go to Settings</button>
        </div>
      </section>
    </div>
  )
}

const readStorage = readLegacyJson

const defaultExpenseCategories = ['Miscellaneous', 'Rent', 'Utilities', 'Transport', 'Salary', 'Inventory', 'Maintenance', 'Marketing', 'Food', 'Office Supplies']

const defaultPrintSettings = {
  flexibleMode: false,
  proMode: false,
  template: 'default',
  logoWidth: 100,
  headerColor: '#172137',
  footerColor: '#6b7280',
  headerAlignment: 'Left',
  footerAlignment: 'Center',
  fontFamily: 'Arial',
  titleFontSize: 18,
  subtitleFontSize: 14,
  bodyFontSize: 12,
  footerText: 'Thank you for your business!',
  reportPaperSize: 'A4',
  billingPaperSize: '80mm (Thermal)',
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 10,
  paddingRight: 10,
  recordsPerPage: 10,
  headerHeight: 12,
  footerHeight: 8,
  brandLanguage: 'en',
  printTitle: 'NEXORA',
  printSubtitle: '',
}

const defaultCompanyInfo = {
  name: 'RetailPro',
  tagline: 'Retail Management System',
  address: '',
  phone: '',
  email: '',
  website: '',
  currency: 'AFN',
  logo: '',
  securitySettings: {
    passwordHash: '',
    passwordHashes: {},
    lockOnStart: false,
    passwordUpdatedAt: '',
  },
}

const alertBeforeDays = {
  '1 week': 7,
  '2 weeks': 14,
  '1 month': 30,
  '3 months': 90,
  '6 months': 180,
  '1 year': 365,
}

const dateOnly = (value) => (value ? new Date(`${String(value).slice(0, 10)}T12:00:00`) : null)
const daysUntil = (date) => {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.ceil((date - today) / 86400000)
}

const mergeCategories = (storedCategories) => {
  const merged = [...productCategories, ...(Array.isArray(storedCategories) ? storedCategories : [])]
  return merged.filter((category, index) => merged.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index)
}

const getContrastColor = (hexColor) => {
  const cleanHex = hexColor.replace('#', '')
  const red = parseInt(cleanHex.slice(0, 2), 16)
  const green = parseInt(cleanHex.slice(2, 4), 16)
  const blue = parseInt(cleanHex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000
  return brightness > 150 ? '#07111f' : '#ffffff'
}

function ConfirmActionModal({ confirmText, message, onCancel, onConfirm, title, t }) {
  return (
    <div className="modal-backdrop app-confirm-backdrop" onClick={onCancel}>
      <div className="app-confirm-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <footer className="modal-actions">
          <button type="button" onClick={onCancel}>{t.cancel}</button>
          <button className="danger-btn" type="button" onClick={onConfirm}>{confirmText}</button>
        </footer>
      </div>
    </div>
  )
}

function LockScreen({ companyInfo, onUnlock, t }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const unlock = async (event) => {
    event.preventDefault()
    setChecking(true)
    const passwordHash = await hashPassword(password)
    const allowedHashes = [
      companyInfo.securitySettings?.passwordHashes?.primary || companyInfo.securitySettings?.passwordHash,
      companyInfo.securitySettings?.passwordHashes?.secondary,
    ].filter(Boolean)
    if (allowedHashes.includes(passwordHash)) {
      setPassword('')
      setError('')
      onUnlock()
    } else {
      setError(t.currentPasswordIncorrect ?? 'Current password is incorrect')
    }
    setChecking(false)
  }

  return (
    <div className="app-lock-screen">
      <div className="app-lock-wallpaper" style={{ backgroundImage: `url("${lockWallpaper}")` }} />
      <div className="app-lock-wallpaper second" style={{ backgroundImage: `url("${lockWallpaper}")` }} />
      <form className="app-lock-card" onSubmit={unlock}>
        <div className="app-lock-logo">
          {companyInfo.logo ? <img alt="" src={companyInfo.logo} /> : <Lock size={28} />}
        </div>
        <h1>{companyInfo.name || 'RetailPro'}</h1>
        <p>{t.welcomeBackAdministrator ?? 'Welcome back, Administrator'}</p>
        <label className="app-lock-input">
          <input
            autoFocus
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
          />
          <button type="button" aria-label={t.showPassword ?? 'Show password'} onClick={() => setShowPassword((current) => !current)}>
            <Eye size={16} />
          </button>
        </label>
        {error && <span className="app-lock-error">{error}</span>}
        <button className="app-lock-submit" type="submit" disabled={checking || !password}>
          <Shield size={15} />
          <span>{checking ? (t.checking ?? 'Checking...') : (t.unlock ?? 'Unlock')}</span>
        </button>
        <small>{t.lockScreenHelp ?? 'Screen is locked for security. Enter your password to continue.'}</small>
      </form>
    </div>
  )
}

function App() {
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [theme, setTheme] = useState(() => readStorage('retail-theme-mode', 'light'))
  const [language, setLanguage] = useState(() => readStorage('retail-language', 'en'))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState(getPageFromPath)
  const [activeColorTheme, setActiveColorTheme] = useState(() => readStorage('retail-color-theme', 'default'))
  const [suppliers, setSuppliers] = useState(() => readStorage('retail-suppliers', []))
  const [products, setProducts] = useState(() => readStorage('retail-products', []))
  const [customers, setCustomers] = useState(() => readStorage('retail-customers', []))
  const [expenses, setExpenses] = useState(() => readStorage('retail-expenses', []))
  const [staffMembers, setStaffMembers] = useState(() => readStorage('retail-staff-members', []))
  const [salesBills, setSalesBills] = useState(() => readStorage('retail-sales-bills', []))
  const [godownEntries, setGodownEntries] = useState(() => readStorage('retail-godown-entries', []))
  const [bundles, setBundles] = useState(() => readStorage('retail-bundles', []))
  const [cashWallet, setCashWallet] = useState(() => readStorage('retail-cash-wallet', 120))
  const [cashWalletEntries, setCashWalletEntries] = useState(() => readStorage('retail-cash-wallet-entries', []))
  const [editingSale, setEditingSale] = useState(null)
  const [deletedItems, setDeletedItems] = useState(() => readStorage('retail-recycle-bin', []))
  const [pendingConfirmation, setPendingConfirmation] = useState(null)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([])
  const [categories, setCategories] = useState(() => mergeCategories(readStorage('retail-product-categories', [])))
  const [expenseCategories, setExpenseCategories] = useState(() => {
    const stored = readStorage('retail-expense-categories', [])
    const merged = [...defaultExpenseCategories, ...(Array.isArray(stored) ? stored : [])]
    return merged.filter((category, index) => merged.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index)
  })
  const [baseCurrency, setBaseCurrency] = useState(() => readStorage('retail-base-currency', 'AFN'))
  const [exchangeRates, setExchangeRates] = useState(() => readStorage('retail-exchange-rates', {}))
  const [businessCurrencyFilter, setBusinessCurrencyFilter] = useState(() => readStorage('retail-business-currency-filter', 'all'))
  const [exchangeCurrency, setExchangeCurrency] = useState(() => readStorage('retail-dashboard-exchange-currency', 'original'))
  const [currencyRateWarning, setCurrencyRateWarning] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)
  const alertSoundTimerRef = useRef(null)
  const [printSettings, setPrintSettings] = useState(() => readStorage('retail-print-settings', defaultPrintSettings))
  const [companyInfo, setCompanyInfo] = useState(() => readStorage('retail-company-info', defaultCompanyInfo))
  const [isLocked, setIsLocked] = useState(false)
  const initialLockAppliedRef = useRef(false)
  const t = useMemo(() => translations[language], [language])
  const isRtl = language === 'fa' || language === 'ps'
  const selectedColorTheme = colorThemes.find((item) => item.id === activeColorTheme) ?? colorThemes[0]
  const securitySettings = companyInfo.securitySettings ?? defaultCompanyInfo.securitySettings
  const hasSecurityPassword = Boolean(
    securitySettings.passwordHash ||
    securitySettings.passwordHashes?.primary ||
    securitySettings.passwordHashes?.secondary,
  )
  window.__retailCurrencyView = {
    baseCurrency,
    businessCurrencyFilter,
    exchangeRates,
  }
  const themeStyle = {
    '--accent': selectedColorTheme.accent,
    '--accent-contrast': getContrastColor(selectedColorTheme.accent),
    '--accent-soft': `${selectedColorTheme.accent}22`,
  }
  const navigate = (nextPage) => {
    const nextPath =
      nextPage.startsWith?.('dashboardMetric:')
        ? `/dashboard/${nextPage.split(':')[1] || 'totalRevenue'}`
        : nextPage.startsWith?.('customerProfile:')
          ? `/customers/${nextPage.split(':')[1] || ''}`
        : nextPage === 'profile'
        ? '/profile'
        : nextPage === 'settings'
          ? '/settings'
          : nextPage === 'terms'
            ? '/terms'
            : nextPage === 'helpCenter'
              ? '/help-center'
              : nextPage === 'about'
                ? '/about'
              : nextPage === 'faq'
                ? '/faq'
              : nextPage === 'workflows'
                ? '/workflows'
              : nextPage === 'userGuide'
                ? '/user-guide'
            : nextPage === 'products'
            ? '/products'
            : nextPage === 'suppliers'
              ? '/suppliers'
              : nextPage === 'bundles'
                ? '/bundles'
              : nextPage === 'customers'
                ? '/customers'
                : nextPage === 'staff'
              ? '/staff'
              : nextPage === 'expenses'
                ? '/expenses'
                : nextPage === 'billing'
                  ? '/billing'
                  : nextPage === 'godown'
                    ? '/godown'
                    : nextPage === 'loans'
                      ? '/loans'
                      : nextPage === 'financials'
                        ? '/financials'
                        : nextPage === 'reports'
                          ? '/reports'
                          : nextPage === 'agent'
                            ? '/agent'
                            : nextPage === 'salesBills'
                              ? '/sales-bills'
                              : nextPage === 'recycleBin'
                                ? '/recycle-bin'
                                : '/'
                               
    setPage(nextPage)
    setSidebarOpen(false)
    window.history.pushState({ page: nextPage }, '', nextPath)
  }

  const showToast = (message) => {
    window.clearTimeout(toastTimerRef.current)
    setToast(message)
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2400)
  }

  const appendLiveActivity = (message, level = 'info') => {
    setCompanyInfo((current) => ({
      ...current,
      liveActivity: [{
        id: crypto.randomUUID(),
        level,
        message,
        time: new Date().toISOString(),
      }, ...(current.liveActivity ?? [])].slice(0, 120),
    }))
  }

  const appBackupData = useMemo(() => ({
    version: '6.5.0',
    exportedAt: new Date().toISOString(),
    data: {
      theme,
      language,
      activeColorTheme,
      suppliers,
      bundles,
      products,
      customers,
      expenses,
      staffMembers,
      salesBills,
      godownEntries,
      cashWallet,
      cashWalletEntries,
      deletedItems,
      categories,
      expenseCategories,
      baseCurrency,
      businessCurrencyFilter,
      exchangeCurrency,
      exchangeRates,
      printSettings,
      companyInfo,
    },
  }), [activeColorTheme, baseCurrency, bundles, businessCurrencyFilter, cashWallet, cashWalletEntries, categories, companyInfo, customers, deletedItems, exchangeCurrency, exchangeRates, expenseCategories, expenses, godownEntries, language, printSettings, products, salesBills, staffMembers, suppliers, theme])

  const importBackupData = (backup) => {
    const data = backup?.data ?? backup
    if (!data || typeof data !== 'object') return false
    setTheme(data.theme ?? 'light')
    setLanguage(data.language ?? 'en')
    setActiveColorTheme(data.activeColorTheme ?? 'default')
    setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : [])
    setBundles(Array.isArray(data.bundles) ? data.bundles : [])
    setProducts(Array.isArray(data.products) ? data.products : [])
    setCustomers(Array.isArray(data.customers) ? data.customers : [])
    setExpenses(Array.isArray(data.expenses) ? data.expenses : [])
    setStaffMembers(Array.isArray(data.staffMembers) ? data.staffMembers : [])
    setSalesBills(Array.isArray(data.salesBills) ? data.salesBills : [])
    setGodownEntries(Array.isArray(data.godownEntries) ? data.godownEntries : [])
    setCashWallet(Number(data.cashWallet ?? 120))
    setCashWalletEntries(Array.isArray(data.cashWalletEntries) ? data.cashWalletEntries : [])
    setDeletedItems(Array.isArray(data.deletedItems) ? data.deletedItems : [])
    setCategories(mergeCategories(data.categories))
    setExpenseCategories(Array.isArray(data.expenseCategories) && data.expenseCategories.length ? data.expenseCategories : defaultExpenseCategories)
    setBaseCurrency(data.baseCurrency ?? 'AFN')
    setBusinessCurrencyFilter(data.businessCurrencyFilter ?? 'all')
    setExchangeCurrency(data.exchangeCurrency ?? 'original')
    setExchangeRates(data.exchangeRates ?? {})
    setPrintSettings({ ...defaultPrintSettings, ...(data.printSettings ?? {}) })
    setCompanyInfo({ ...defaultCompanyInfo, ...(data.companyInfo ?? {}) })
    showToast(t.importCompleted ?? 'Backup imported successfully')
    return true
  }

  const clearBusinessData = () => {
    setSuppliers([])
    setBundles([])
    setProducts([])
    setCustomers([])
    setExpenses([])
    setStaffMembers([])
    setSalesBills([])
    setGodownEntries([])
    setCashWallet(120)
    setCashWalletEntries([])
    setDeletedItems([])
    showToast(t.dataCleared ?? 'Data cleared')
  }

  const startEditBill = (sale) => {
    setEditingSale(sale)
    navigate('billing')
  }

  const cancelEditBill = () => {
    setEditingSale(null)
    navigate('salesBills')
  }

  useEffect(() => {
    const syncPageFromPath = () => {
      setPage(getPageFromPath())
    }

    window.addEventListener('popstate', syncPageFromPath)
    return () => window.removeEventListener('popstate', syncPageFromPath)
  }, [])

  useEffect(() => {
    let isActive = true
    const applyState = (data) => {
      setTheme(data.theme ?? 'light')
      setLanguage(data.language ?? 'en')
      setActiveColorTheme(data.activeColorTheme ?? 'default')
      setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : [])
      setBundles(Array.isArray(data.bundles) ? data.bundles : [])
      setProducts(Array.isArray(data.products) ? data.products : [])
      setCustomers(Array.isArray(data.customers) ? data.customers : [])
      setExpenses(Array.isArray(data.expenses) ? data.expenses : [])
      setStaffMembers(Array.isArray(data.staffMembers) ? data.staffMembers : [])
      setSalesBills(Array.isArray(data.salesBills) ? data.salesBills : [])
      setGodownEntries(Array.isArray(data.godownEntries) ? data.godownEntries : [])
      setCashWallet(Number(data.cashWallet ?? 120))
      setCashWalletEntries(Array.isArray(data.cashWalletEntries) ? data.cashWalletEntries : [])
      setDeletedItems(Array.isArray(data.deletedItems) ? data.deletedItems : [])
      setCategories(mergeCategories(data.categories))
      setExpenseCategories(Array.isArray(data.expenseCategories) && data.expenseCategories.length ? data.expenseCategories : defaultExpenseCategories)
      setBaseCurrency(data.baseCurrency ?? 'AFN')
      setBusinessCurrencyFilter(data.businessCurrencyFilter ?? 'all')
      setExchangeCurrency(data.exchangeCurrency ?? 'original')
      setExchangeRates(data.exchangeRates ?? {})
      setPrintSettings({ ...defaultPrintSettings, ...(data.printSettings ?? {}) })
      setCompanyInfo({ ...defaultCompanyInfo, ...(data.companyInfo ?? {}) })
    }
    const legacySnapshot = () => {
      const storedExpenseCategories = readStorage('retail-expense-categories', [])
      const mergedExpenseCategories = [...defaultExpenseCategories, ...(Array.isArray(storedExpenseCategories) ? storedExpenseCategories : [])]
      return {
        theme: readStorage('retail-theme-mode', 'light'),
        language: readStorage('retail-language', 'en'),
        activeColorTheme: readStorage('retail-color-theme', 'default'),
        suppliers: readStorage('retail-suppliers', []),
        bundles: readStorage('retail-bundles', []),
        products: readStorage('retail-products', []),
        customers: readStorage('retail-customers', []),
        expenses: readStorage('retail-expenses', []),
        staffMembers: readStorage('retail-staff-members', []),
        salesBills: readStorage('retail-sales-bills', []),
        godownEntries: readStorage('retail-godown-entries', []),
        cashWallet: readStorage('retail-cash-wallet', 120),
        cashWalletEntries: readStorage('retail-cash-wallet-entries', []),
        deletedItems: readStorage('retail-recycle-bin', []),
        categories: mergeCategories(readStorage('retail-product-categories', [])),
        expenseCategories: mergedExpenseCategories.filter((category, index) => mergedExpenseCategories.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index),
        baseCurrency: readStorage('retail-base-currency', 'AFN'),
        businessCurrencyFilter: readStorage('retail-business-currency-filter', 'all'),
        exchangeCurrency: readStorage('retail-dashboard-exchange-currency', 'original'),
        exchangeRates: readStorage('retail-exchange-rates', {}),
        printSettings: { ...defaultPrintSettings, ...readStorage('retail-print-settings', {}) },
        companyInfo: { ...defaultCompanyInfo, ...readStorage('retail-company-info', {}) },
      }
    }

    ;(async () => {
      try {
        const stored = await loadJsonStorage()
        const shouldMigrateLegacy = !stored.hasData && hasLegacyJsonStorage()
        const nextState = shouldMigrateLegacy ? legacySnapshot() : stored
        if (!isActive) return
        applyState(nextState)
        if (shouldMigrateLegacy) {
          await saveJsonStorage(nextState)
          clearLegacyJsonStorage()
        }
      } catch {
        // If the local JSON server is not running, the app stays usable in memory.
      } finally {
        if (isActive) setStorageLoaded(true)
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    saveJsonStorage({
      theme,
      language,
      activeColorTheme,
      suppliers,
      bundles,
      products,
      customers,
      expenses,
      staffMembers,
      salesBills,
      godownEntries,
      cashWallet,
      cashWalletEntries,
      deletedItems,
      categories,
      expenseCategories,
      baseCurrency,
      businessCurrencyFilter,
      exchangeCurrency,
      exchangeRates,
      printSettings,
      companyInfo,
    }).catch(() => {})
  }, [activeColorTheme, baseCurrency, bundles, businessCurrencyFilter, cashWallet, cashWalletEntries, categories, companyInfo, customers, deletedItems, exchangeCurrency, exchangeRates, expenseCategories, expenses, godownEntries, language, printSettings, products, salesBills, staffMembers, storageLoaded, suppliers, theme])

  useEffect(() => {
    window.__retailCurrencyView = {
      baseCurrency,
      businessCurrencyFilter,
      exchangeRates,
    }
  }, [baseCurrency, businessCurrencyFilter, exchangeRates])

  useEffect(() => {
    const direction = isRtl ? 'rtl' : 'ltr'
    document.documentElement.dir = direction
    document.documentElement.lang = language
    document.body.dir = direction
  }, [isRtl, language])

  useEffect(() => {
    if (!storageLoaded) return

    const dueAlerts = []
    products.forEach((product) => {
      const quantity = Number(product.quantity || 0)
      if (quantity <= 0) {
        dueAlerts.push(`product-out-${product.id}`)
      }

      const lowStock = Number(product.lowStock || product.lowStockThreshold || 0)
      if (lowStock > 0 && quantity > 0 && quantity <= lowStock) {
        dueAlerts.push(`product-low-${product.id}`)
      }

      const expiryDate = dateOnly(product.expiry || product.expiryDate)
      const alertDays = alertBeforeDays[product.alertBefore] ?? Number(product.alertDaysBefore || 0)
      if (expiryDate && alertDays >= 0) {
        const remainingDays = daysUntil(expiryDate)
        if (remainingDays >= 0 && remainingDays <= alertDays) dueAlerts.push(`product-expiry-${product.id}`)
      }
    })

    godownEntries.forEach((entry) => {
      ;(entry.rows || []).forEach((row) => {
        const expiryDate = dateOnly(row.expiryDate)
        const alertDays = Number(row.alertDaysBefore || 0)
        if (expiryDate && alertDays >= 0) {
          const remainingDays = daysUntil(expiryDate)
          if (remainingDays >= 0 && remainingDays <= alertDays) dueAlerts.push(`godown-expiry-${row.id}`)
        }
      })
    })

    if (!dueAlerts.length) return
    const todayKey = new Date().toISOString().slice(0, 10)
    const storageKey = `retail-alert-sounds-${todayKey}`
    const played = new Set(readStorage(storageKey, []))
    const newAlerts = dueAlerts.filter((key) => !played.has(key))
    if (!newAlerts.length) return

    alertSoundTimerRef.current = window.setTimeout(() => {
      playNotificationSound(companyInfo.notificationSettings?.sound || 'chime')
      showToast(t.alertsOptional ?? 'Alerts')
      window.localStorage.setItem(storageKey, JSON.stringify([...played, ...newAlerts]))
    }, 700)

    return () => window.clearTimeout(alertSoundTimerRef.current)
  }, [companyInfo.notificationSettings?.sound, godownEntries, products, storageLoaded, t.alertsOptional])

  useEffect(() => {
    if (!storageLoaded || initialLockAppliedRef.current) return
    initialLockAppliedRef.current = true
    if (hasSecurityPassword && securitySettings.lockOnStart) setIsLocked(true)
  }, [hasSecurityPassword, securitySettings.lockOnStart, storageLoaded])

  useEffect(() => {
    if (!hasSecurityPassword && isLocked) setIsLocked(false)
  }, [hasSecurityPassword, isLocked])

  const notifications = useMemo(() => {
    const items = []
    products.forEach((product) => {
      const quantity = Number(product.quantity || 0)
      const productName = product.name || t.product || 'Product'
      const codeText = product.code ? ` (${product.code})` : ''
      if (quantity <= 0) {
        items.push({
          id: `product-out-${product.id}`,
          title: productName,
          detail: t.outOfStock ?? 'Out of stock',
          tone: 'danger',
          time: '',
        })
      }

      const lowStock = Number(product.lowStock || product.lowStockThreshold || 0)
      if (lowStock > 0 && quantity > 0 && quantity <= lowStock) {
        items.push({
          id: `product-low-${product.id}`,
          title: t.lowStockAlert ?? 'Low Stock Alert',
          detail: `${productName}${codeText} ${t.notificationLowStockDemo ?? 'is low in stock.'}`,
          tone: 'warning',
          time: '',
        })
      }

      const expiryDate = dateOnly(product.expiry || product.expiryDate)
      const alertDays = alertBeforeDays[product.alertBefore] ?? Number(product.alertDaysBefore || 0)
      if (expiryDate && alertDays >= 0) {
        const remainingDays = daysUntil(expiryDate)
        if (remainingDays >= 0 && remainingDays <= alertDays) {
          items.push({
            id: `product-expiry-${product.id}`,
            title: t.expiringSoon ?? 'Expiring soon',
            detail: `${productName} — ${remainingDays} days (${expiryDate.toISOString().slice(0, 10)})`,
            tone: 'warning',
            time: '',
          })
        }
      }
    })

    return items.filter((item) => !dismissedNotificationIds.includes(item.id))
  }, [dismissedNotificationIds, products, t.expiringSoon, t.lowStockAlert, t.notificationLowStockDemo, t.outOfStock, t.product])

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  useEffect(() => {
    const originalConsoleError = console.error
    const captureError = (event) => {
      appendLiveActivity(event.message || 'Runtime error', 'error')
    }
    const captureRejection = (event) => {
      appendLiveActivity(event.reason?.message || String(event.reason || 'Unhandled promise rejection'), 'error')
    }
    console.error = (...args) => {
      appendLiveActivity(args.map((item) => item?.message || String(item)).join(' '), 'error')
      originalConsoleError(...args)
    }
    window.addEventListener('error', captureError)
    window.addEventListener('unhandledrejection', captureRejection)
    return () => {
      console.error = originalConsoleError
      window.removeEventListener('error', captureError)
      window.removeEventListener('unhandledrejection', captureRejection)
    }
  }, [])

  const addCategory = (category) => {
    setCategories((current) => current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category])
  }

  const performMoveToRecycle = (module, item) => {
    const recycleItem = {
      recycleId: crypto.randomUUID(),
      id: item.id,
      module,
      name: item.name || item.code || module,
      data: item,
      deletedAt: new Date().toISOString(),
      daysLeft: 30,
    }
    setDeletedItems((current) => [recycleItem, ...current])
    if (module === 'products') setProducts((current) => current.filter((product) => product.id !== item.id))
    if (module === 'suppliers') setSuppliers((current) => current.filter((supplier) => supplier.id !== item.id))
    if (module === 'customers') setCustomers((current) => current.filter((customer) => customer.id !== item.id))
    if (module === 'expenses') setExpenses((current) => current.filter((expense) => expense.id !== item.id))
    if (module === 'staffMembers') setStaffMembers((current) => current.filter((staff) => staff.id !== item.id))
    if (module === 'bundles') setBundles((current) => current.filter((bundle) => bundle.id !== item.id))
    showToast(t.movedToRecycle)
  }

  const moveToRecycle = (module, item) => {
    setPendingConfirmation({
      title: t.confirmDeletion ?? 'Confirm Deletion',
      message: (t.confirmDeleteItem ?? 'Are you sure you want to delete {name}?').replace('{name}', item.name || item.code || module),
      confirmText: t.delete,
      onConfirm: () => performMoveToRecycle(module, item),
    })
  }

  const restoreItem = (item) => {
    if (item.module === 'products') setProducts((current) => current.some((product) => product.id === item.id) ? current : [...current, item.data])
    if (item.module === 'suppliers') setSuppliers((current) => current.some((supplier) => supplier.id === item.id) ? current : [...current, item.data])
    if (item.module === 'customers') setCustomers((current) => current.some((customer) => customer.id === item.id) ? current : [...current, item.data])
    if (item.module === 'expenses') setExpenses((current) => current.some((expense) => expense.id === item.id) ? current : [...current, item.data])
    if (item.module === 'staffMembers') setStaffMembers((current) => current.some((staff) => staff.id === item.id) ? current : [...current, item.data])
    if (item.module === 'bundles') setBundles((current) => current.some((bundle) => bundle.id === item.id) ? current : [...current, item.data])
    setDeletedItems((current) => current.filter((deleted) => deleted.recycleId !== item.recycleId))
    showToast(t.restoredSuccessfully)
  }

  const permanentDelete = (recycleId) => {
    const item = deletedItems.find((deleted) => deleted.recycleId === recycleId)
    setPendingConfirmation({
      title: t.confirmDeletion ?? 'Confirm Deletion',
      message: (t.confirmPermanentDelete ?? 'This will permanently delete {name}. This cannot be undone.').replace('{name}', item?.name || t.item || ''),
      confirmText: t.delete,
      onConfirm: () => {
        setDeletedItems((current) => current.filter((deleted) => deleted.recycleId !== recycleId))
        showToast(t.deletedForever)
      },
    })
  }

  const emptyRecycleBin = () => {
    setPendingConfirmation({
      title: t.emptyRecycleBin ?? 'Empty Recycle Bin?',
      message: t.emptyRecycleBinWarning ?? 'This will permanently delete all items. This cannot be undone.',
      confirmText: t.confirm ?? 'Confirm',
      onConfirm: () => {
        setDeletedItems([])
        showToast(t.recycleBinEmptied ?? t.deletedForever)
      },
    })
  }

  return (
    <div className={`retail-shell theme-${theme} ${sidebarOpen ? 'sidebar-open' : ''}`.trim()} dir={isRtl ? 'rtl' : 'ltr'} style={themeStyle}>
      <div className="workspace">
        <button className="mobile-sidebar-toggle" type="button" aria-label={t.menu ?? 'Menu'} onClick={() => setSidebarOpen(true)}>
          <span />
          <span />
          <span />
        </button>
        <button className="mobile-sidebar-scrim" type="button" aria-label={t.close ?? 'Close'} onClick={() => setSidebarOpen(false)} />
        <Sidebar activePage={page.startsWith('dashboardMetric:') ? 'dashboard' : page.startsWith('customerProfile:') ? 'customers' : page} companyInfo={companyInfo} onNavigate={navigate} onToggle={() => setSidebarOpen((current) => !current)} t={t} />
        <main className="main-area">
          <Header
            baseCurrency={baseCurrency}
            businessCurrencyFilter={businessCurrencyFilter}
            cashWallet={cashWallet}
            exchangeCurrency={exchangeCurrency}
            exchangeRates={exchangeRates}
            language={language}
            notifications={notifications}
            onBusinessCurrencyFilterChange={setBusinessCurrencyFilter}
            onCashWalletChange={setCashWallet}
            onExchangeCurrencyChange={setExchangeCurrency}
            onWalletEntriesChange={setCashWalletEntries}
            onLanguageChange={setLanguage}
            onLockScreen={() => {
              if (hasSecurityPassword) {
                setIsLocked(true)
              } else {
                navigate('settings')
                showToast(t.noPasswordSet ?? 'No password set')
              }
            }}
            onMissingCurrencyRate={setCurrencyRateWarning}
            onNavigate={navigate}
            onNotificationsChange={(updater) => {
              const nextNotifications = typeof updater === 'function' ? updater(notifications) : updater
              const visibleIds = new Set((nextNotifications || []).map((item) => item.id))
              setDismissedNotificationIds((current) => [
                ...new Set([
                  ...current,
                  ...notifications.filter((item) => !visibleIds.has(item.id)).map((item) => item.id),
                ]),
              ])
            }}
            onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            t={t}
            theme={theme}
          />

          {page === 'terms' ? (
  <TermsPrivacy companyInfo={companyInfo} t={t} />
) : page === 'userGuide' ? (
  <UserGuide t={t} />
) : page === 'helpCenter' ? (
  <HelpCenter t={t} onNavigate={navigate} />
) : page === 'about' ? (
  <About companyInfo={companyInfo} t={t} />
) : page === 'faq' ? (
  <FAQ t={t} />
) : page === 'workflows' ? (
  <Workflows t={t} />
) : page === 'settings' ? (
  
            <SettingsPage
              activeColorTheme={activeColorTheme}
              appBackupData={appBackupData}
              baseCurrency={baseCurrency}
              companyInfo={companyInfo}
              exchangeRates={exchangeRates}
              language={language}
              onColorThemeChange={setActiveColorTheme}
              onCompanyInfoChange={setCompanyInfo}
              onBaseCurrencyChange={setBaseCurrency}
              onExchangeRatesChange={setExchangeRates}
              onClearBusinessData={clearBusinessData}
              onImportBackupData={importBackupData}
              onLanguageChange={setLanguage}
              onNotify={showToast}
              onPrintSettingsChange={setPrintSettings}
              printSettings={printSettings}
              t={t}
            />
          ) : page === 'profile' ? (
            <Profile companyInfo={companyInfo} onCompanyInfoChange={setCompanyInfo} onNotify={showToast} t={t} />
          ) : page === 'products' ? (
            <ProductsPage
              categories={categories}
              companyInfo={companyInfo}
              onCategoryAdd={addCategory}
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              onProductsChange={setProducts}
              onSuppliersChange={setSuppliers}
              printSettings={printSettings}
              products={products}
              suppliers={suppliers}
              t={t}
            />
          ) : page === 'suppliers' ? (
            <SuppliersPage
              companyInfo={companyInfo}
              godownEntries={godownEntries}
              onGodownChange={setGodownEntries}
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              onSuppliersChange={setSuppliers}
              printSettings={printSettings}
              products={products}
              suppliers={suppliers}
              t={t}
            />
          ) : page === 'bundles' ? (
            <BundlesPage
              bundles={bundles}
              companyInfo={companyInfo}
              onBundlesChange={setBundles}
              onMoveToRecycle={moveToRecycle}
              onSuppliersChange={setSuppliers}
              printSettings={printSettings}
              suppliers={suppliers}
              t={t}
            />
          ) : page === 'customers' || page.startsWith('customerProfile:') ? (
            <CustomersPage
              companyInfo={companyInfo}
              customers={customers}
              initialProfileCustomerId={page.startsWith('customerProfile:') ? page.split(':')[1] || '' : ''}
              onCustomersChange={setCustomers}
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              printSettings={printSettings}
              products={products}
              sales={salesBills}
              t={t}
            />
          ) : page === 'staff' ? (
            <StaffPage
              companyInfo={companyInfo}
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              onStaffChange={setStaffMembers}
              printSettings={printSettings}
              staffMembers={staffMembers}
              t={t}
            />
          ) : page === 'expenses' ? (
            <ExpensesPage
              companyInfo={companyInfo}
              expenses={expenses}
              expenseCategories={expenseCategories}
              onExpenseCategoriesChange={setExpenseCategories}
              onExpensesChange={setExpenses}
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              printSettings={printSettings}
              t={t}
            />
          ) : page === 'billing' ? (
            <BillingPage
              companyInfo={companyInfo}
              customers={customers}
              editingSale={editingSale}
              onCancelEdit={cancelEditBill}
              onCustomersChange={setCustomers}
              onEditComplete={() => setEditingSale(null)}
              onNotify={showToast}
              onProductsChange={setProducts}
              onSalesChange={setSalesBills}
              printSettings={printSettings}
              products={products}
              sales={salesBills}
              t={t}
            />
          ) : page === 'salesBills' ? (
            <SalesBillsPage
              companyInfo={companyInfo}
              onEditBill={startEditBill}
              onNotify={showToast}
              onProductsChange={setProducts}
              onSalesChange={setSalesBills}
              printSettings={printSettings}
              sales={salesBills}
              t={t}
            />
          ) : page === 'godown' ? (
            <GodownPage
              categories={categories}
              companyInfo={companyInfo}
              godownEntries={godownEntries}
              onGodownChange={setGodownEntries}
              onNotify={showToast}
              onProductsChange={setProducts}
              printSettings={printSettings}
              products={products}
              suppliers={suppliers}
              t={t}
              onNavigate={navigate}
            />
          ) : page === 'loans' ? (
            <LoansPage
              companyInfo={companyInfo}
              onCustomersChange={setCustomers}
              onEditBill={startEditBill}
              onNotify={showToast}
              onSalesChange={setSalesBills}
              printSettings={printSettings}
              sales={salesBills}
              t={t}
            />
          ) : page === 'financials' ? (
            <FinancialsPage
              cashWallet={cashWallet}
              companyInfo={companyInfo}
              expenses={expenses}
              printSettings={printSettings}
              products={products}
              sales={salesBills}
              staffMembers={staffMembers}
              t={t}
            />
          ) : page === 'reports' ? (
            <ReportsPage
              cashWallet={cashWallet}
              companyInfo={companyInfo}
              expenses={expenses}
              printSettings={printSettings}
              products={products}
              sales={salesBills}
              staffMembers={staffMembers}
              t={t}
            />
          ) : page === 'agent' ? (
            <AgentPage
              cashWallet={cashWallet}
              cashWalletEntries={cashWalletEntries}
              companyInfo={companyInfo}
              customers={customers}
              expenses={expenses}
              godownEntries={godownEntries}
              products={products}
              sales={salesBills}
              staffMembers={staffMembers}
              suppliers={suppliers}
              t={t}
            />
          ) : page.startsWith('dashboardMetric:') ? (
            (page.split(':')[1] || 'totalRevenue') === 'currentCashWallet' ? (
              <CashWalletPage
                cashWallet={cashWallet}
                companyInfo={companyInfo}
                expenses={expenses}
                onBack={() => navigate('dashboard')}
                onCashWalletChange={setCashWallet}
                onWalletEntriesChange={setCashWalletEntries}
                products={products}
                sales={salesBills}
                staffMembers={staffMembers}
                suppliers={suppliers}
                t={t}
                walletEntries={cashWalletEntries}
              />
            ) : (
              <DashboardMetricDetail
                cashWallet={cashWallet}
                companyInfo={companyInfo}
                customers={customers}
                expenses={expenses}
                metricKey={page.split(':')[1] || 'totalRevenue'}
                onBack={() => navigate('dashboard')}
                onNavigate={navigate}
                printSettings={printSettings}
                products={products}
                sales={salesBills}
                staffMembers={staffMembers}
                suppliers={suppliers}
                t={t}
              />
            )
          ) : page === 'recycleBin' ? (
            <RecycleBinPage
              deletedItems={deletedItems}
              onEmptyBin={emptyRecycleBin}
              onPermanentDelete={permanentDelete}
              onRestore={restoreItem}
              t={t}
            />
          ) : (
            <Dashboard
              baseCurrency={baseCurrency}
              businessCurrencyFilter={businessCurrencyFilter}
              cashWallet={cashWallet}
              customers={customers}
              exchangeCurrency={exchangeCurrency}
              exchangeRates={exchangeRates}
              expenses={expenses}
              onMissingCurrencyRate={setCurrencyRateWarning}
              onNavigate={navigate}
              products={products}
              sales={salesBills}
              staffMembers={staffMembers}
              suppliers={suppliers}
              t={t}
            />
          )}
        </main>
      </div>
      {pendingConfirmation && (
        <ConfirmActionModal
          confirmText={pendingConfirmation.confirmText}
          message={pendingConfirmation.message}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={() => {
            pendingConfirmation.onConfirm()
            setPendingConfirmation(null)
          }}
          title={pendingConfirmation.title}
          t={t}
        />
      )}
      {currencyRateWarning && (
        <CurrencyRateWarningModal
          currencyCode={currencyRateWarning}
          onClose={() => setCurrencyRateWarning(null)}
          onSettings={() => {
            setCurrencyRateWarning(null)
            navigate('settings')
          }}
        />
      )}
      {!storageLoaded && (
        <div className="app-loader" role="status" aria-live="polite">
          <div className="app-loader-card">
            <span />
            <strong>{t.loadingData ?? 'Loading data...'}</strong>
          </div>
        </div>
      )}
      {storageLoaded && isLocked && (
        <LockScreen
          companyInfo={{ ...defaultCompanyInfo, ...companyInfo, securitySettings }}
          onUnlock={() => setIsLocked(false)}
          t={t}
        />
      )}
      {toast && <div className="app-toast" role="status">{toast}</div>}
    </div>
  )
}

export default App
