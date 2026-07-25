import { useEffect, useMemo, useState } from 'react'
import './UserGuide.css'

const guideContent = {
  en: {
    badge: 'BEGINNER GUIDE',
    subtitle: "Complete beginner's guide to every module",
    sections: [
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
    key: 'bundles',
    title: 'Bundles',
    text: 'Create and manage product bundles by combining multiple items into one sellable package. Set bundle quantities, track included products, manage bundle costs, and sell grouped products more easily from one module.',
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
    ],
  },
  fa: {
    badge: 'راهنمای آغازین',
    subtitle: 'راهنمای کامل برای هر بخش سیستم',
    sections: [
      { key: 'dashboard', title: 'داشبورد', text: 'داشبورد مرکز اصلی سیستم است. عواید، تعداد فروشات، پرداخت‌های باقی‌مانده، قرضه‌ها و فعالیت‌های اخیر را نشان می‌دهد. با کلیک روی هر کارت می‌توانید جزئیات همان بخش را ببینید.' },
      { key: 'products', title: 'محصولات', text: 'در این بخش محصولات، موجودی، قیمت خرید، قیمت فروش، کتگوری، بارکد، هشدار تاریخ انقضا و هشدار کمبود موجودی را مدیریت می‌کنید.' },
      { key: 'billing', title: 'بلینگ', text: 'برای ساخت بل یا انوایس، مشتری را انتخاب کنید، محصولات را اضافه کنید، مقدار و تخفیف و حالت پرداخت را تعیین کنید، سپس بل را ذخیره یا چاپ کنید.' },
      { key: 'salesBills', title: 'فروش/بل‌ها', text: 'تمام فروشات ثبت‌شده را ببینید، براساس نمبر بل، مشتری، تاریخ و حالت پرداخت جستجو کنید و جزئیات بل یا چاپ آن را باز کنید.' },
      { key: 'staff', title: 'کارمندان', text: 'معلومات کارمندان، وظیفه، معاش، عکس، حاضری، حالت فعال یا غیرفعال و گزارش‌های معاشات را مدیریت کنید.' },
      { key: 'customers', title: 'مشتریان', text: 'پروفایل مشتری، معلومات تماس، یادداشت‌ها، تاریخچه خرید، پرداخت‌ها، قرضه‌ها و فعالیت‌های مشتری را در یک صفحه ببینید.' },
      { key: 'godown', title: 'گدام', text: 'برای مدیریت واردات، صادرات، حرکت موجودی، ارتباط با تهیه‌کننده، قیمت خرید، قیمت فروش و تغییر مقدار محصول استفاده می‌شود.' },
      { key: 'suppliers', title: 'تهیه‌کنندگان/کتنامه', text: 'سیستم دفتر تهیه‌کننده است. حساب، بیلانس ابتدایی، واریز، برداشت، اجناس، تصفیه و گزارش مفاد تهیه‌کننده را مدیریت می‌کند.' },
      { key: 'bundles', title: 'بسته‌ها', text: 'چند محصول را در یک بسته قابل فروش ترکیب کنید، مقدار هر محصول را تعیین کنید، قیمت/مصرف بسته را مدیریت کنید و فروش بسته را آسان‌تر بسازید.' },
      { key: 'expenses', title: 'مصارف', text: 'تمام مصارف تجارت را با مقدار، کتگوری، تاریخ، یادداشت، طریقه پرداخت، فیلترها و گزینه چاپ ثبت و بررسی کنید.' },
      { key: 'loans', title: 'قرضه‌ها', text: 'قرضه‌ها و معاملات اعتباری مشتریان را ثبت کنید، پرداخت‌ها را مدیریت کنید و بیلانس باقی‌مانده هر مشتری را ببینید.' },
      { key: 'financials', title: 'مالی', text: 'نمای مالی تجارت شامل عواید، مصارف، مفاد خالص، ارزش موجودی، کیف پول نقد و جزئیات مالی را نشان می‌دهد.' },
      { key: 'reports', title: 'گزارش‌ها', text: 'گزارش‌های عواید، مصارف، مشتریان برتر، حالت پرداخت، نمودارها و تحلیل براساس تاریخ را ایجاد کنید.' },
      { key: 'recycleBin', title: 'سطل بازیافت', text: 'رکاردهای حذف‌شده را برگردانید، برای همیشه حذف کنید یا براساس نوع ماژول فیلتر نمایید.' },
      { key: 'settings', title: 'تنظیمات', text: 'نام شرکت، شعار، تماس، لوگو، تم، واحد پول، چاپ، اطلاعیه‌ها، بکاپ، کاربران، امنیت و همگام‌سازی پیشرفته را مدیریت کنید.' },
    ],
  },
  ps: {
    badge: 'د پیل لارښود',
    subtitle: 'د سیستم د هرې برخې بشپړ لارښود',
    sections: [
      { key: 'dashboard', title: 'ډشبورډ', text: 'ډشبورډ د سیستم اصلي مرکز دی. عاید، خرڅلاو، پاتې پیسې، پورونه او وروستي فعالیتونه ښيي. په هر کارت کلیک وکړئ ترڅو جزئیات یې وګورئ.' },
      { key: 'products', title: 'محصولات', text: 'محصولات، موجودي، د پېر قیمت، د پلور قیمت، کتګوري، بارکوډ، د ختمېدو خبرتیا او د کم موجودي خبرتیا دلته تنظیمېږي.' },
      { key: 'billing', title: 'بېلنګ', text: 'د بېل جوړولو لپاره مشتری وټاکئ، محصولات اضافه کړئ، مقدار، تخفیف او د تادیې حالت وټاکئ، بیا بېل خوندي یا چاپ کړئ.' },
      { key: 'salesBills', title: 'خرڅلاو/بېلونه', text: 'ثبت شوي خرڅلاو وګورئ، د بېل نمبر، مشتری، نېټې او تادیې حالت له مخې پلټنه وکړئ او بېل پرانیزئ یا چاپ کړئ.' },
      { key: 'staff', title: 'کارکوونکي', text: 'د کارکوونکو معلومات، دنده، معاش، عکس، حاضري، فعال حالت او د معاش راپورونه مدیریت کړئ.' },
      { key: 'customers', title: 'مشتریان', text: 'د مشتری پروفایل، تماس، یادښتونه، د پېر تاریخچه، تادیې، پورونه او فعالیتونه په یوه پاڼه کې وګورئ.' },
      { key: 'godown', title: 'ګدام', text: 'واردات، صادرات، د موجودۍ حرکت، د عرضه کوونکي اړیکې، د پېر او پلور قیمتونه او د محصول مقدار بدلون مدیریت کوي.' },
      { key: 'suppliers', title: 'عرضه کوونکي/کتنامه', text: 'د عرضه کوونکي دفتر دی. حساب، لومړنی بیلانس، جمع، برداشت، د مالونو ریکارډ، تصفیه او راپورونه مدیریت کوي.' },
      { key: 'bundles', title: 'بسته‌ها', text: 'څو محصولات په یوه پلورل کېدونکي بسته کې یوځای کړئ، مقدارونه وټاکئ، د بسته مصرف مدیریت کړئ او د ګروپي محصولاتو پلور اسانه کړئ.' },
      { key: 'expenses', title: 'لګښتونه', text: 'ټول تجارتي لګښتونه د مقدار، کتګورۍ، نېټې، یادښت، د تادیې طریقې، فلټر او چاپ له لارې ثبت او وګورئ.' },
      { key: 'loans', title: 'پورونه', text: 'د مشتریانو پورونه او اعتباري معاملې ثبت کړئ، تادیې مدیریت کړئ او پاتې بیلانس وګورئ.' },
      { key: 'financials', title: 'مالي', text: 'د تجارت مالي حالت ښيي: عاید، لګښتونه، خالصه ګټه، د موجودۍ ارزښت، نغدي بټوه او تفصیلي مالي معلومات.' },
      { key: 'reports', title: 'راپورونه', text: 'د عاید، لګښت، غوره مشتریانو، تادیې حالت، چارټونو او د نېټې پر بنسټ تحلیل راپورونه جوړ کړئ.' },
      { key: 'recycleBin', title: 'د بازیافت ټوکرۍ', text: 'حذف شوي ریکارډونه بېرته راوګرځوئ، د تل لپاره یې حذف کړئ یا د ماډل له مخې یې فلټر کړئ.' },
      { key: 'settings', title: 'تنظیمات', text: 'د شرکت نوم، شعار، تماس، لوگو، تم، پیسې، چاپ، خبرتیاوې، بکاپ، کارنان، امنیت او پرمختللې همغږي مدیریت کړئ.' },
    ],
  },
}

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
  const content = guideContent[t.locale] ?? guideContent.en
  const guideSections = content.sections

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
            <span>{content.badge}</span>
            <h1>{t.userGuide ?? 'User Guide'}</h1>
            <p>{content.subtitle}</p>
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
