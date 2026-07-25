import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronDown, Archive } from '../components/Icons.jsx'
import './Workflows.css'

const workflowSections = [
  {
    key: 'whole',
    title: 'Whole system',
    steps: [
      `[ User Login ] -> [ Dashboard ]
      |
      +-> [ Sidebar Navigation ] -> any module
      +-> [ Header ]
          |-> Search   |-> Currency   |-> Language
          |-> Undo/Redo |-> Theme      |-> Lock
          |-> Profile / Logout`,
      `[ Business Data ]
      |
      +-> Products -> Billing -> Sales/Bills
      +-> Suppliers -> Godown -> Stock movement
      +-> Customers -> Loans -> Payments
      +-> Expenses + Staff -> Financials -> Reports
      +-> Settings -> Backup / Restore / Security`,
    ],
  },
  {
    key: 'sidebar',
    title: 'Sidebar',
    steps: [
      `[ Sidebar ]
      |
      +-> Dashboard
      +-> Products
      +-> Billing
      +-> Sales/Bills
      +-> Staff / Customers
      +-> Godown / Suppliers / Bundles
      +-> Expenses / Loans / Financials / Reports`,
      `[ Sidebar footer ]
      |
      +-> Help menu
          |-> Help Center
          |-> Developer
          |-> FAQ
          |-> User Guide
          |-> Workflows
          |-> Terms & Privacy`,
    ],
  },
  {
    key: 'header',
    title: 'Header',
    steps: [
      `[ Header ]
      |
      +-> Global Search
      +-> Currency filter / exchange view
      +-> Wallet quick access
      +-> Theme switch
      +-> Language switch
      +-> Notifications
      +-> Profile`,
      `[ Header actions ]
      |
      User chooses filter/action
      -> App state updates
      -> Active module refreshes
      -> Dashboard and reports use the same data`,
    ],
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    steps: [
      `[ Dashboard ]
      |
      +-> Read products, sales, expenses, loans
      +-> Calculate revenue / profit / wallet / pending
      +-> Show metric cards
      +-> User clicks card -> detail page`,
      `[ Quick workflow ]
      Dashboard -> Billing -> create sale
      Dashboard -> Products -> check stock
      Dashboard -> Reports -> analyze results`,
    ],
  },
  {
    key: 'products',
    title: 'Products',
    steps: [
      `[ Add Product ]
      |
      Product details -> category -> unit
      -> purchase price -> selling price
      -> stock quantity -> save`,
      `[ Product used later ]
      Product stock -> Billing sale
      Product stock -> Godown import/export
      Product value -> Financials / Reports`,
    ],
  },
  {
    key: 'billing',
    title: 'Billing',
    steps: [
      `[ Create Invoice ]
      |
      Select customer
      -> Add products
      -> Set quantity / discount / payment
      -> Save bill
      -> Print preview`,
      `[ After save ]
      Bill -> Sales/Bills history
      Bill -> Customer profile
      Bill -> Product stock update
      Bill -> Financial reports`,
    ],
  },
  {
    key: 'salesBills',
    title: 'Sales / Bills',
    steps: [
      `[ Sales/Bills ]
      |
      Search invoice
      -> Filter by date/customer/status
      -> Open bill
      -> Print or edit`,
      `[ Edit bill ]
      Open sale -> update details
      -> save changes
      -> stock and customer balances refresh`,
    ],
  },
  {
    key: 'staff',
    title: 'Staff',
    steps: [
      `[ Staff ]
      |
      Add staff member
      -> role / salary / contact
      -> active status
      -> save record`,
      `[ Payroll impact ]
      Staff salary -> Expenses/Financials
      Staff records -> Reports
      Staff status -> active team list`,
    ],
  },
  {
    key: 'customers',
    title: 'Customers',
    steps: [
      `[ Customer Profile ]
      |
      Add customer
      -> contact details
      -> sales history
      -> payment history
      -> balance / loans`,
      `[ Customer activity ]
      Billing creates sale
      -> Customer profile updates
      -> Loans/payments update balance`,
    ],
  },
  {
    key: 'godown',
    title: 'Godown',
    steps: [
      `[ Godown Import ]
      |
      Select supplier
      -> Add products
      -> quantity / prices / expiry
      -> save import
      -> product stock increases`,
      `[ Godown Export / Movement ]
      Select product
      -> quantity movement
      -> save
      -> stock and reports update`,
    ],
  },
  {
    key: 'suppliers',
    title: 'Suppliers / Katanama',
    steps: [
      `[ Supplier Ledger ]
      |
      Create supplier
      -> opening balance
      -> deposits / withdrawals
      -> goods records
      -> settlement`,
      `[ Supplier linked flow ]
      Supplier -> Godown import
      -> product stock
      -> supplier balance
      -> reports`,
    ],
  },
  {
    key: 'bundles',
    title: 'Bundles',
    steps: [
      `[ Create Bundle ]
      |
      Select bundle name
      -> choose included products
      -> set quantities
      -> calculate bundle cost
      -> save`,
      `[ Sell Bundle ]
      Bundle -> Billing
      -> included product stock decreases
      -> sale appears in Sales/Bills
      -> reports update`,
    ],
  },
  {
    key: 'expenses',
    title: 'Expenses',
    steps: [
      `[ Add Expense ]
      |
      Amount -> category -> date
      -> payment method -> notes
      -> save`,
      `[ Expense impact ]
      Expense -> Financials
      -> Reports
      -> Profit calculation
      -> Cash wallet when applicable`,
    ],
  },
  {
    key: 'loans',
    title: 'Loans',
    steps: [
      `[ Loan Flow ]
      |
      Select customer
      -> create loan
      -> record payment
      -> remaining balance updates`,
      `[ Loan connected data ]
      Customer profile
      -> loan history
      -> pending payments
      -> dashboard and financials`,
    ],
  },
  {
    key: 'financials',
    title: 'Financials',
    steps: [
      `[ Financials ]
      |
      Sales revenue
      + Expenses
      + Staff salaries
      + Stock value
      + Cash wallet
      -> net business view`,
      `[ Detail pages ]
      Click financial card
      -> see breakdown
      -> filter by date/currency
      -> print/export when needed`,
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    steps: [
      `[ Reports ]
      |
      Choose report type
      -> select date range
      -> view charts/tables
      -> print/export`,
      `[ Report sources ]
      Products + Sales + Customers
      + Expenses + Staff + Suppliers
      -> analytics output`,
    ],
  },
  {
    key: 'recycleBin',
    title: 'Recycle Bin',
    steps: [
      `[ Delete supported record ]
      |
      Delete action
      -> confirmation
      -> item moves to Recycle Bin`,
      `[ Recovery ]
      Recycle Bin
      -> select item
      -> Restore or permanently delete
      -> module refreshes`,
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    steps: [
      `[ Settings ]
      |
      Company info
      -> theme / language
      -> currency
      -> print settings
      -> notifications
      -> backup / restore`,
      `[ Backup / Restore ]
      Export JSON backup
      -> store safely
      -> import trusted file
      -> app data reloads`,
    ],
  },
  {
    key: 'sync',
    title: 'Advanced Sync (branch -> admin)',
    steps: [
      `[ Branch computer ]
      |
      Settings -> Backup
      -> create backup file
      -> send to admin PC`,
      `[ Admin computer ]
      |
      Settings -> Backup & Restore
      -> import received backup
      -> review restored data
      -> continue reporting`,
    ],
  },
]

function Workflows() {
  const [activeKey, setActiveKey] = useState('whole')
  const [stepIndex, setStepIndex] = useState(0)
  const activeSection = useMemo(
    () => workflowSections.find((item) => item.key === activeKey) ?? workflowSections[0],
    [activeKey]
  )
  const step = activeSection.steps[stepIndex] ?? activeSection.steps[0]
  const isComplete = stepIndex === activeSection.steps.length - 1
  const progress = ((stepIndex + 1) / activeSection.steps.length) * 100

  const selectSection = (key) => {
    setActiveKey(key)
    setStepIndex(0)
  }

  return (
    <div className="workflows-page">
      <section className="workflows-shell">
        <div className="workflows-hero">
          <div className="workflows-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>
          <h1>Workflows</h1>
          <p>Step-by-step text diagrams of every module and the whole system</p>
        </div>

        <div className="workflow-tabs" role="tablist">
          {workflowSections.map((section) => (
            <button
              className={activeKey === section.key ? 'active' : ''}
              key={section.key}
              type="button"
              onClick={() => selectSection(section.key)}
            >
              {section.title}
            </button>
          ))}
        </div>

        <section className="workflow-card">
          <h2>{activeSection.title}</h2>

          <div className="workflow-toolbar">
            <div className="workflow-step-status">
              <span>
                <Archive size={13} />
                Step {stepIndex + 1} of {activeSection.steps.length}
              </span>
              {isComplete && <strong>✓ Walkthrough complete</strong>}
            </div>
            <div className="workflow-mode-toggle">
              <button className="active" type="button">Guided</button>
              <button type="button">Overview</button>
            </div>
          </div>

          <div className="workflow-progress">
            <span style={{ width: `${progress}%` }} />
          </div>

          <pre className="workflow-diagram">{step}</pre>

          <div className="workflow-actions">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button type="button" onClick={() => setStepIndex(0)}>
              Restart
            </button>
            <button
              className="primary"
              type="button"
              disabled={stepIndex === activeSection.steps.length - 1}
              onClick={() => setStepIndex((current) => Math.min(activeSection.steps.length - 1, current + 1))}
            >
              Next
              <ChevronDown size={14} />
            </button>
          </div>
        </section>
      </section>
    </div>
  )
}

export default Workflows
