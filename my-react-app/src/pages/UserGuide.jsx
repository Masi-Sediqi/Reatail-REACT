import { useEffect, useMemo, useState } from 'react'
import './UserGuide.css'

const guideSections = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    text: "The Dashboard is your central hub. It displays key performance indicators (KPIs) like total revenue, sales count, pending payments, and active loans. Each KPI card is clickable — tap any card to see its detailed breakdown page. Quick action buttons let you jump to Billing, Products, or other modules instantly. The activity feed shows recent system events.",
  },
  {
    key: 'products',
    title: 'Products',
    text: 'Manage all product records, stock quantities, purchase prices, selling prices, categories, barcode information, expiry alerts, and low-stock warnings from one clean module.',
  },
  {
    key: 'billing',
    title: 'Billing',
    text: 'Create professional invoices in seconds. Add items, set quantities, apply discounts, choose payment status, save invoices, and open print preview with your custom print settings.',
  },
  {
    key: 'salesBills',
    title: 'Sales/Bills',
    text: 'View and manage completed sales. Search by invoice number, customer name, date, payment status, and open full invoice details or print reports.',
  },
  {
    key: 'staff',
    title: 'Staff',
    text: 'Manage your team members, roles, salaries, photos, attendance, payroll reports, active or inactive staff status, and complete staff records.',
  },
  {
    key: 'customers',
    title: 'Customers',
    text: 'Manage customer profiles, contact details, notes, order history, payment history, loans, profit analytics, and customer activity from one profile page.',
  },
  {
    key: 'godown',
    title: 'Godown',
    text: 'Warehouse and inventory management. Record imports, exports, stock movement, supplier links, purchase prices, selling prices, and product quantity updates.',
  },
  {
    key: 'suppliers',
    title: 'Suppliers/Katanama',
    text: 'Traditional supplier ledger system. Create supplier accounts, opening balances, deposits, withdrawals, goods records, settlements, and supplier profit reports.',
  },
  {
    key: 'expenses',
    title: 'Expenses',
    text: 'Track all business expenses with amount, category, date, notes, payment method, filters, print options, and expense reports.',
  },
  {
    key: 'loans',
    title: 'Loans',
    text: 'Manage all loan and credit transactions. Track loan amounts, customer balances, payments, active loans, completed loans, and payment history.',
  },
  {
    key: 'financials',
    title: 'Financials',
    text: 'Financial overview and analysis. Review revenue, expenses, net profit, stock value, cash wallet, and detailed financial breakdown pages.',
  },
  {
    key: 'reports',
    title: 'Reports',
    text: 'Business analytics and reporting. Generate charts, revenue reports, expense reports, top customer reports, payment status reports, and date range analysis.',
  },
  {
    key: 'recycleBin',
    title: 'Recycle Bin',
    text: 'Deleted items recovery. Restore deleted records, permanently delete items, and filter deleted records by module type.',
  },
  {
    key: 'settings',
    title: 'Settings',
    text: 'System configuration. Manage company name, subtitle, contact information, logo, themes, currency, print settings, notifications, backup, sharing, users, security, and advanced sync options.',
  },
]

function TypeText({ text, speed = 7 }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue('')
    let index = 0

    const timer = window.setInterval(() => {
      index += 2
      setValue(text.slice(0, index))

      if (index >= text.length) {
        window.clearInterval(timer)
      }
    }, speed)

    return () => window.clearInterval(timer)
  }, [text, speed])

  return <>{value}</>
}

function UserGuide({ t }) {
  const [activeKey, setActiveKey] = useState('dashboard')
  const logo = '/logo.jpeg'

  const activeSection = useMemo(
    () => guideSections.find((item) => item.key === activeKey) ?? guideSections[0],
    [activeKey]
  )

  return (
    <div className="user-guide-page">
      <section className="user-guide-shell">
        <div className="guide-hero-card">
          <div className="guide-logo-box">
            <img src={logo} alt="Afghan Power" />
          </div>

          <div className="guide-hero-text">
            <span>BEGINNER GUIDE</span>
            <h1>{t.userGuide ?? 'User Guide'}</h1>
            <p>Complete beginner&apos;s guide to every module</p>
          </div>
        </div>

        <div className="guide-tabs" role="tablist">
          {guideSections.map((section) => (
            <button
              key={section.key}
              className={activeKey === section.key ? 'active' : ''}
              type="button"
              onClick={() => setActiveKey(section.key)}
            >
              {section.title}
            </button>
          ))}
        </div>

        <section className="guide-card" key={activeSection.key}>
          <div className="guide-card-header">
            <span>{activeSection.title}</span>
            <h2>
              <TypeText text={activeSection.title} speed={10} />
            </h2>
          </div>

          <p className="guide-main-text">
            <TypeText text={activeSection.text} speed={5} />
          </p>
        </section>
      </section>
    </div>
  )
}

export default UserGuide