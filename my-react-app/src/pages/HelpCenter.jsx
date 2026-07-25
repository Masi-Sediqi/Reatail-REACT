import './HelpCenter.css'

const helpContent = {
  en: {
    subtitle: 'Get help with any module in the system',
    contact: 'Contact Support',
    cards: [
      ['📦', 'Products', 'Manage your product inventory, categories, pricing, and stock levels'],
      ['🧾', 'Billing', 'Create invoices, process payments, and manage billing operations'],
      ['🛒', 'Sales/Bills', 'View sales history, track payments, and analyze sales performance'],
      ['👥', 'Customers', 'Manage customer accounts, view purchase history and balances'],
      ['🏭', 'Godown', 'Track warehouse imports, exports, and inventory movements'],
      ['🚚', 'Suppliers/Katanama', 'Manage supplier accounts, ledger entries, and goods tracking'],
      ['💰', 'Expenses', 'Record and categorize business expenses for financial tracking'],
      ['📊', 'Reports', 'Generate business reports with charts, analytics, and data exports'],
    ],
    quick: [
      ['⌁', 'Workflows', 'Step-by-step text diagrams of every module and the whole system'],
      ['📄', 'User Guide', "Complete beginner's guide to every module"],
      ['📖', 'FAQ', 'Frequently asked questions about the system'],
    ],
  },
  fa: {
    subtitle: 'برای هر بخش سیستم کمک و راهنما بگیرید',
    contact: 'تماس با پشتیبانی',
    cards: [
      ['📦', 'محصولات', 'مدیریت موجودی، کتگوری‌ها، قیمت‌ها و سطح ذخیره محصولات'],
      ['🧾', 'بلینگ', 'ساخت بل، ثبت پرداخت‌ها و مدیریت عملیات بلینگ'],
      ['🛒', 'فروش/بل‌ها', 'دیدن تاریخچه فروش، پیگیری پرداخت‌ها و تحلیل فروشات'],
      ['👥', 'مشتریان', 'مدیریت حساب مشتری، تاریخچه خرید و بیلانس‌ها'],
      ['🏭', 'گدام', 'پیگیری واردات، صادرات و حرکت موجودی گدام'],
      ['🚚', 'تهیه‌کنندگان/کتنامه', 'مدیریت حساب تهیه‌کننده، دفتر حساب و پیگیری اجناس'],
      ['💰', 'مصارف', 'ثبت و دسته‌بندی مصارف تجارت برای پیگیری مالی'],
      ['📊', 'گزارش‌ها', 'ساخت گزارش‌های تجارتی همراه با نمودار، تحلیل و خروجی معلومات'],
    ],
    quick: [
      ['⌁', 'جریان کارها', 'دیاگرام متنی مرحله‌به‌مرحله برای هر ماژول و تمام سیستم'],
      ['📄', 'راهنمای کاربر', 'راهنمای کامل آغازین برای هر بخش'],
      ['📖', 'پرسش‌ها', 'پرسش‌های معمول درباره سیستم'],
    ],
  },
  ps: {
    subtitle: 'د سیستم د هرې برخې لپاره مرسته ترلاسه کړئ',
    contact: 'د ملاتړ اړیکه',
    cards: [
      ['📦', 'محصولات', 'د محصول موجودي، کتګورۍ، قیمتونه او د ذخیرې کچه مدیریت کړئ'],
      ['🧾', 'بېلنګ', 'بېلونه جوړ کړئ، تادیې ثبت کړئ او د بېلنګ چارې مدیریت کړئ'],
      ['🛒', 'خرڅلاو/بېلونه', 'د خرڅلاو تاریخچه وګورئ، تادیې تعقیب کړئ او خرڅلاو تحلیل کړئ'],
      ['👥', 'مشتریان', 'د مشتریانو حسابونه، د پېر تاریخچه او بیلانسونه مدیریت کړئ'],
      ['🏭', 'ګدام', 'د ګدام واردات، صادرات او د موجودۍ حرکت تعقیب کړئ'],
      ['🚚', 'عرضه کوونکي/کتنامه', 'د عرضه کوونکو حسابونه، لیجر او د مالونو تعقیب مدیریت کړئ'],
      ['💰', 'لګښتونه', 'د تجارت لګښتونه ثبت او دسته‌بندي کړئ'],
      ['📊', 'راپورونه', 'د تجارت راپورونه له چارټونو، تحلیل او export سره جوړ کړئ'],
    ],
    quick: [
      ['⌁', 'کاري جریانونه', 'د هر ماډل او ټول سیستم مرحله‌وار متني دیاګرامونه'],
      ['📄', 'د کارن لارښود', 'د هرې برخې بشپړ پیل لارښود'],
      ['📖', 'عامې پوښتنې', 'د سیستم په اړه عامې پوښتنې'],
    ],
  },
}

function HelpCenter({ t, onNavigate }) {
  const content = helpContent[t.locale] ?? helpContent.en

  return (
    <div className="help-center-page">
      <section className="help-center-shell">
        <div className="help-center-hero">
          <div className="help-center-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>

          <h1>{t.helpCenter ?? 'Help Center'}</h1>
          <p>{content.subtitle}</p>
        </div>

        <div className="help-grid">
          {content.cards.map(([icon, title, text]) => (
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
          {content.quick.map(([icon, title, text], index) => (
            <button
              className="help-quick-card"
              key={title}
              type="button"
              onClick={() => {
                if (index === 0) onNavigate?.('workflows')
                if (index === 1) onNavigate?.('userGuide')
                if (index === 2) onNavigate?.('faq')
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
          <h2>{content.contact}</h2>

          <div className="help-support-list">
            <p>
              <span>✉</span>
              www.afghanpower.com
            </p>

            <p>
              <span>☎</span>
              +93 79 494 8698
            </p>

            <p>
              <span>🌐</span>
              info@afghanpower.com
            </p>
          </div>
        </section>
      </section>
    </div>
  )
}

export default HelpCenter
