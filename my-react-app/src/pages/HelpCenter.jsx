import './HelpCenter.css'

const helpCards = [
  ['📦', 'Products', 'Manage your product inventory, categories, pricing, and stock levels'],
  ['🧾', 'Billing', 'Create invoices, process payments, and manage billing operations'],
  ['🛒', 'Sales/Bills', 'View sales history, track payments, and analyze sales performance'],
  ['👥', 'Customers', 'Manage customer accounts, view purchase history and balances'],
  ['🏭', 'Godown', 'Track warehouse imports, exports, and inventory movements'],
  ['🚚', 'Suppliers/Katanama', 'Manage supplier accounts, ledger entries, and goods tracking'],
  ['💰', 'Expenses', 'Record and categorize business expenses for financial tracking'],
  ['📊', 'Reports', 'Generate business reports with charts, analytics, and data exports'],
]

const quickCards = [
  ['⌁', 'Workflows', 'Step-by-step text diagrams of every module and the whole system'],
  ['📄', 'User Guide', "Complete beginner's guide to every module"],
  ['📖', 'FAQ', 'Frequently asked questions about the system'],
]

function HelpCenter({ t, onNavigate }) {
  return (
    <div className="help-center-page">
      <section className="help-center-shell">
        <div className="help-center-hero">
          <div className="help-center-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>

          <h1>{t.helpCenter ?? 'Help Center'}</h1>
          <p>Get help with any module in the system</p>
        </div>

        <div className="help-grid">
          {helpCards.map(([icon, title, text]) => (
            <article className="help-card" key={title}>
              <span className="help-card-icon">{icon}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="help-quick-grid">
          {quickCards.map(([icon, title, text]) => (
            <button
              className="help-quick-card"
              key={title}
              type="button"
              onClick={() => {
                if (title === 'User Guide') onNavigate?.('userGuide')
              }}
            >
              <span>{icon}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </button>
          ))}
        </div>

        <section className="help-support-card">
          <h2>Contact Support</h2>

          <div className="help-support-list">
            <p>
              <span>✉</span>
              support@nexora.dev
            </p>

            <p>
              <span>☏</span>
              +93 700 000 000
            </p>

            <p>
              <span>🌐</span>
              www.nexora.dev
            </p>
          </div>
        </section>
      </section>
    </div>
  )
}

export default HelpCenter