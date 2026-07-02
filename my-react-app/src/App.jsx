import { useEffect, useMemo, useRef, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import SettingsPage from './pages/Settings.jsx'
import ProductsPage from './pages/Products.jsx'
import SuppliersPage from './pages/Suppliers.jsx'
import CustomersPage from './pages/Customers.jsx'
import ExpensesPage from './pages/Expenses.jsx'
import RecycleBinPage from './pages/RecycleBin.jsx'
import StaffPage from './pages/Staff.jsx'
import BillingPage from './pages/Billing.jsx'
import SalesBillsPage from './pages/SalesBills.jsx'
import GodownPage from './pages/Godown.jsx'
import LoansPage from './pages/Loans.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import { colorThemes, productCategories } from './data/dashboardData.js'
import { translations } from './data/translations.js'
import './App.css'

const getPageFromPath = () => {
  if (window.location.pathname === '/profile') return 'profile'
  if (window.location.pathname === '/settings') return 'settings'
  if (window.location.pathname === '/products') return 'products'
  if (window.location.pathname === '/suppliers') return 'suppliers'
  if (window.location.pathname === '/customers') return 'customers'
  if (window.location.pathname === '/staff') return 'staff'
  if (window.location.pathname === '/expenses') return 'expenses'
  if (window.location.pathname === '/billing') return 'billing'
  if (window.location.pathname === '/godown') return 'godown'
  if (window.location.pathname === '/loans') return 'loans'
  if (window.location.pathname === '/sales-bills') return 'salesBills'
  if (window.location.pathname === '/recycle-bin') return 'recycleBin'
  return 'dashboard'
}

const readStorage = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const parseNumber = (value) => Number.parseFloat(value || 0) || 0
const formatAfn = (value) => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ؋`

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

function App() {
  const [theme, setTheme] = useState(() => readStorage('retail-theme-mode', 'light'))
  const [language, setLanguage] = useState(() => readStorage('retail-language', 'en'))
  const [page, setPage] = useState(getPageFromPath)
  const [activeColorTheme, setActiveColorTheme] = useState(() => readStorage('retail-color-theme', 'default'))
  const [suppliers, setSuppliers] = useState(() => readStorage('retail-suppliers', []))
  const [products, setProducts] = useState(() => readStorage('retail-products', []))
  const [customers, setCustomers] = useState(() => readStorage('retail-customers', []))
  const [expenses, setExpenses] = useState(() => readStorage('retail-expenses', []))
  const [staffMembers, setStaffMembers] = useState(() => readStorage('retail-staff-members', []))
  const [salesBills, setSalesBills] = useState(() => readStorage('retail-sales-bills', []))
  const [godownEntries, setGodownEntries] = useState(() => readStorage('retail-godown-entries', []))
  const [cashWallet, setCashWallet] = useState(() => readStorage('retail-cash-wallet', 120))
  const [editingSale, setEditingSale] = useState(null)
  const [deletedItems, setDeletedItems] = useState(() => readStorage('retail-recycle-bin', []))
  const [categories, setCategories] = useState(() => mergeCategories(readStorage('retail-product-categories', [])))
  const [baseCurrency, setBaseCurrency] = useState(() => readStorage('retail-base-currency', 'AFN'))
  const [exchangeRates, setExchangeRates] = useState(() => readStorage('retail-exchange-rates', {}))
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)
  const [printSettings, setPrintSettings] = useState(() => readStorage('retail-print-settings', {
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
  }))
  const [companyInfo, setCompanyInfo] = useState(() => readStorage('retail-company-info', {
    name: 'RetailPro',
    tagline: 'Retail Management System',
    address: '',
    phone: '',
    email: '',
    website: '',
    currency: '؋ Afghan Afghani (AFN)',
    logo: '',
  }))
  const t = useMemo(() => translations[language], [language])
  const isRtl = language === 'fa' || language === 'ps'
  const selectedColorTheme = colorThemes.find((item) => item.id === activeColorTheme) ?? colorThemes[0]
  const themeStyle = {
    '--accent': selectedColorTheme.accent,
    '--accent-contrast': getContrastColor(selectedColorTheme.accent),
    '--accent-soft': `${selectedColorTheme.accent}22`,
  }
  const dashboardMetrics = useMemo(() => {
    const totalRevenue = salesBills.reduce((sum, sale) => sum + parseNumber(sale.total), 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseNumber(expense.amount), 0)
    const pendingPayments = salesBills.reduce((sum, sale) => sum + parseNumber(sale.balance), 0)
    const totalPayables = suppliers.reduce((sum, supplier) => sum + Math.max(0, parseNumber(supplier.balance)), 0)
    const totalReceivables = customers.reduce((sum, customer) => sum + parseNumber(customer.pending), 0)
    const stockQuantity = products.reduce((sum, product) => sum + parseNumber(product.quantity), 0)
    const globalStockValue = products.reduce((sum, product) => sum + parseNumber(product.quantity) * parseNumber(product.purchase), 0)
    const netProfit = totalRevenue - totalExpenses

    return {
      activeProducts: String(products.length),
      currentCashWallet: formatAfn(cashWallet),
      globalStockValue: formatAfn(globalStockValue),
      netBalance: formatAfn(totalPayables - totalReceivables),
      netProfit: formatAfn(netProfit),
      pendingPayments: formatAfn(pendingPayments),
      pureProfit: formatAfn(netProfit),
      staffPaid: formatAfn(0),
      staffPayable: formatAfn(staffMembers.reduce((sum, staff) => sum + parseNumber(staff.salary), 0)),
      stockQuantity: String(stockQuantity),
      totalCustomers: String(customers.length),
      totalExpenses: formatAfn(totalExpenses),
      totalPayables: formatAfn(totalPayables),
      totalReceivables: formatAfn(totalReceivables),
      totalRefunds: formatAfn(0),
      totalRevenue: formatAfn(totalRevenue),
      totalSales: String(salesBills.length),
      totalStaff: String(staffMembers.length),
    }
  }, [cashWallet, customers, expenses, products, salesBills, staffMembers, suppliers])
  const navigate = (nextPage) => {
    const nextPath =
      nextPage === 'profile'
        ? '/profile'
        : nextPage === 'settings'
          ? '/settings'
          : nextPage === 'products'
            ? '/products'
            : nextPage === 'suppliers'
              ? '/suppliers'
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
                      : nextPage === 'salesBills'
                        ? '/sales-bills'
                        : nextPage === 'recycleBin'
                          ? '/recycle-bin'
                          : '/'
    setPage(nextPage)
    window.history.pushState({ page: nextPage }, '', nextPath)
  }

  const showToast = (message) => {
    window.clearTimeout(toastTimerRef.current)
    setToast(message)
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2400)
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
    window.localStorage.setItem('retail-theme-mode', JSON.stringify(theme))
    window.localStorage.setItem('retail-language', JSON.stringify(language))
    window.localStorage.setItem('retail-color-theme', JSON.stringify(activeColorTheme))
    window.localStorage.setItem('retail-suppliers', JSON.stringify(suppliers))
    window.localStorage.setItem('retail-products', JSON.stringify(products))
    window.localStorage.setItem('retail-customers', JSON.stringify(customers))
    window.localStorage.setItem('retail-expenses', JSON.stringify(expenses))
    window.localStorage.setItem('retail-staff-members', JSON.stringify(staffMembers))
    window.localStorage.setItem('retail-sales-bills', JSON.stringify(salesBills))
    window.localStorage.setItem('retail-godown-entries', JSON.stringify(godownEntries))
    window.localStorage.setItem('retail-cash-wallet', JSON.stringify(cashWallet))
    window.localStorage.setItem('retail-recycle-bin', JSON.stringify(deletedItems))
    window.localStorage.setItem('retail-product-categories', JSON.stringify(categories))
    window.localStorage.setItem('retail-base-currency', JSON.stringify(baseCurrency))
    window.localStorage.setItem('retail-exchange-rates', JSON.stringify(exchangeRates))
    window.localStorage.setItem('retail-print-settings', JSON.stringify(printSettings))
    window.localStorage.setItem('retail-company-info', JSON.stringify(companyInfo))
  }, [activeColorTheme, baseCurrency, cashWallet, categories, companyInfo, customers, deletedItems, exchangeRates, expenses, godownEntries, language, printSettings, products, salesBills, staffMembers, suppliers, theme])

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  const addCategory = (category) => {
    setCategories((current) => current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category])
  }

  const moveToRecycle = (module, item) => {
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
    showToast(t.movedToRecycle)
  }

  const restoreItem = (item) => {
    if (item.module === 'products') setProducts((current) => current.some((product) => product.id === item.id) ? current : [...current, item.data])
    if (item.module === 'suppliers') setSuppliers((current) => current.some((supplier) => supplier.id === item.id) ? current : [...current, item.data])
    if (item.module === 'customers') setCustomers((current) => current.some((customer) => customer.id === item.id) ? current : [...current, item.data])
    if (item.module === 'expenses') setExpenses((current) => current.some((expense) => expense.id === item.id) ? current : [...current, item.data])
    if (item.module === 'staffMembers') setStaffMembers((current) => current.some((staff) => staff.id === item.id) ? current : [...current, item.data])
    setDeletedItems((current) => current.filter((deleted) => deleted.recycleId !== item.recycleId))
    showToast(t.restoredSuccessfully)
  }

  const permanentDelete = (recycleId) => {
    setDeletedItems((current) => current.filter((item) => item.recycleId !== recycleId))
    showToast(t.deletedForever)
  }

  return (
    <div className={`retail-shell theme-${theme}`} dir={isRtl ? 'rtl' : 'ltr'} style={themeStyle}>
      <div className="workspace">
        <Sidebar activePage={page} companyInfo={companyInfo} onNavigate={navigate} t={t} />
        <main className="main-area">
          <Header
            cashWallet={cashWallet}
            language={language}
            onCashWalletChange={setCashWallet}
            onLanguageChange={setLanguage}
            onNavigate={navigate}
            onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            t={t}
            theme={theme}
          />

          {page === 'settings' ? (
            <SettingsPage
              activeColorTheme={activeColorTheme}
              baseCurrency={baseCurrency}
              companyInfo={companyInfo}
              exchangeRates={exchangeRates}
              language={language}
              onColorThemeChange={setActiveColorTheme}
              onCompanyInfoChange={setCompanyInfo}
              onBaseCurrencyChange={setBaseCurrency}
              onExchangeRatesChange={setExchangeRates}
              onLanguageChange={setLanguage}
              onNotify={showToast}
              onPrintSettingsChange={setPrintSettings}
              printSettings={printSettings}
              t={t}
            />
          ) : page === 'profile' ? (
            <Profile onNotify={showToast} t={t} />
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
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              onSuppliersChange={setSuppliers}
              printSettings={printSettings}
              suppliers={suppliers}
              t={t}
            />
          ) : page === 'customers' ? (
            <CustomersPage
              companyInfo={companyInfo}
              customers={customers}
              onCustomersChange={setCustomers}
              onMoveToRecycle={moveToRecycle}
              onNotify={showToast}
              printSettings={printSettings}
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
            />
          ) : page === 'loans' ? (
            <LoansPage
              companyInfo={companyInfo}
              printSettings={printSettings}
              sales={salesBills}
              t={t}
            />
          ) : page === 'recycleBin' ? (
            <RecycleBinPage
              deletedItems={deletedItems}
              onPermanentDelete={permanentDelete}
              onRestore={restoreItem}
              t={t}
            />
          ) : (
            <Dashboard dashboardMetrics={dashboardMetrics} t={t} />
          )}
        </main>
      </div>
      {toast && <div className="app-toast" role="status">{toast}</div>}
    </div>
  )
}

export default App
