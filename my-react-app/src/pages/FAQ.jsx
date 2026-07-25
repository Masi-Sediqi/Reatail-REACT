import { useState } from 'react'
import { ChevronDown } from '../components/Icons.jsx'
import './FAQ.css'

const faqContent = {
  en: {
    subtitle: 'Frequently asked questions about the system',
    items: [
  {
    question: 'How do I create a new product?',
    answer: 'Go to Products -> click Add Product -> fill in the product details including name, category, unit, purchase price, selling price, and initial stock quantity. Click Save to add the product.',
  },
  {
    question: 'How do I create a bill/invoice?',
    answer: 'Go to Billing, select a customer or create a new one, add products to the bill, choose payment details, and save or print the invoice.',
  },
  {
    question: 'How do I track supplier payments?',
    answer: 'Open Suppliers/Katanama, select the supplier, and review the ledger entries. Purchases, payments, remaining balance, and goods tracking are recorded there.',
  },
  {
    question: 'How do I change the language?',
    answer: 'Use the language icon in the top bar to switch between English, Dari, and Pashto. The layout supports RTL languages automatically.',
  },
  {
    question: 'How do I back up my data?',
    answer: 'Go to Settings -> Backup & Restore -> Export Data. The system downloads a JSON backup file that you can keep safely and import later.',
  },
  {
    question: 'How do I print reports?',
    answer: 'Open Reports, choose the report type and date range, then use the print or export option. Print appearance can be adjusted from Settings.',
  },
  {
    question: 'How do I manage multiple currencies?',
    answer: 'Go to Settings and set the base currency and exchange rates. The dashboard and reports can convert values using the configured rates.',
  },
  {
    question: 'How do I manage staff and payroll?',
    answer: 'Open Staff to add employees, roles, salaries, and related details. Staff salary values are included in business financial calculations.',
  },
  {
    question: 'How does Advanced Multi-Device Sync work?',
    answer: 'Advanced sync lets different devices share business data through backup and restore flows. Keep backup files trusted and import only files from your own system.',
  },
  {
    question: 'What is the difference between Full and Incremental backup?',
    answer: 'A full backup contains all system data. An incremental backup is intended for sharing only recent changes from another branch or device.',
  },
  {
    question: 'How do I undo a mistake (delete, edit, payment)?',
    answer: 'Deleted records go to Recycle Bin when supported, where you can restore them. For edited payments or bills, open the related module and update the record again.',
  },
  {
    question: 'How do I collect data from multiple branches into one admin PC?',
    answer: 'On each branch, create a backup from Settings. On the admin PC, import the backup file through Settings -> Backup & Restore. Review imported records after each restore.',
  },
    ],
  },
  fa: {
    subtitle: 'پرسش‌های معمول درباره سیستم',
    items: [
      { question: 'چطور یک محصول جدید بسازم؟', answer: 'به بخش محصولات بروید، روی Add Product کلیک کنید، نام، کتگوری، واحد، قیمت خرید، قیمت فروش و مقدار موجودی اولیه را وارد کنید و سپس Save را بزنید.' },
      { question: 'چطور بل یا انوایس بسازم؟', answer: 'به بخش بلینگ بروید، مشتری را انتخاب یا ایجاد کنید، محصولات را اضافه کنید، معلومات پرداخت را تعیین کنید و بل را ذخیره یا چاپ کنید.' },
      { question: 'چطور پرداخت‌های تهیه‌کننده را پیگیری کنم؟', answer: 'بخش Suppliers/Katanama را باز کنید، تهیه‌کننده را انتخاب کنید و دفتر حساب او را ببینید. خریدها، پرداخت‌ها، بیلانس و اجناس در همان‌جا ثبت می‌شوند.' },
      { question: 'چطور زبان را تغییر بدهم؟', answer: 'از آیکن زبان در نوار بالا استفاده کنید و بین انگلیسی، دری و پشتو تغییر دهید. سیستم برای دری و پشتو حالت راست‌به‌چپ را پشتیبانی می‌کند.' },
      { question: 'چطور از معلومات بکاپ بگیرم؟', answer: 'به Settings -> Backup & Restore بروید و Export Data را انتخاب کنید. سیستم یک فایل JSON بکاپ دانلود می‌کند که باید آن را در جای امن نگهداری کنید.' },
      { question: 'چطور گزارش‌ها را چاپ کنم؟', answer: 'بخش Reports را باز کنید، نوع گزارش و محدوده تاریخ را انتخاب کنید و از گزینه چاپ یا خروجی استفاده کنید. ظاهر چاپ از Settings قابل تنظیم است.' },
      { question: 'چطور چند واحد پول را مدیریت کنم؟', answer: 'در Settings واحد پول اصلی و نرخ‌های تبادله را تنظیم کنید. داشبورد و گزارش‌ها می‌توانند ارزش‌ها را براساس نرخ‌های تعیین‌شده تبدیل کنند.' },
      { question: 'چطور کارمندان و معاشات را مدیریت کنم؟', answer: 'بخش Staff را باز کنید و کارمند، وظیفه، معاش و معلومات مربوط را ثبت کنید. معاشات در محاسبات مالی تجارت شامل می‌شوند.' },
      { question: 'Advanced Multi-Device Sync چطور کار می‌کند؟', answer: 'همگام‌سازی پیشرفته برای شریک‌ساختن معلومات بین دستگاه‌ها از طریق بکاپ و ریستور استفاده می‌شود. فقط فایل‌های قابل اعتماد سیستم خودتان را وارد کنید.' },
      { question: 'فرق بکاپ کامل و Incremental چیست؟', answer: 'بکاپ کامل تمام معلومات سیستم را دارد. بکاپ Incremental برای انتقال تغییرات جدید از یک شعبه یا دستگاه دیگر استفاده می‌شود.' },
      { question: 'اگر اشتباه حذف، ویرایش یا پرداخت کردم چه کنم؟', answer: 'رکاردهای حذف‌شده در بخش‌های پشتیبانی‌شده به Recycle Bin می‌روند و می‌توانید آن‌ها را برگردانید. برای پرداخت‌ها یا بل‌های ویرایش‌شده، رکارد مربوط را دوباره اصلاح کنید.' },
      { question: 'چطور معلومات چند شعبه را در یک کمپیوتر ادمین جمع کنم؟', answer: 'در هر شعبه از Settings بکاپ بسازید. در کمپیوتر ادمین از Settings -> Backup & Restore فایل بکاپ را وارد کنید و بعد از هر واردسازی رکاردها را بررسی نمایید.' },
    ],
  },
  ps: {
    subtitle: 'د سیستم په اړه عامې پوښتنې',
    items: [
      { question: 'څنګه نوی محصول جوړ کړم؟', answer: 'Products ته لاړ شئ، Add Product کلیک کړئ، نوم، کتګوري، واحد، د پېر قیمت، د پلور قیمت او لومړنۍ موجودي ولیکئ، بیا Save ووهئ.' },
      { question: 'څنګه بېل یا انوایس جوړ کړم؟', answer: 'Billing ته لاړ شئ، مشتری وټاکئ یا نوی جوړ کړئ، محصولات اضافه کړئ، د تادیې معلومات وټاکئ او بېل خوندي یا چاپ کړئ.' },
      { question: 'څنګه د عرضه کوونکي تادیې تعقیب کړم؟', answer: 'Suppliers/Katanama پرانیزئ، عرضه کوونکی وټاکئ او د حساب دفتر یې وګورئ. پېر، تادیې، پاتې بیلانس او مالونه هلته ثبتېږي.' },
      { question: 'څنګه ژبه بدله کړم؟', answer: 'په پورته بار کې د ژبې آیکن وکاروئ او د انګلیسي، دری او پښتو ترمنځ ژبه بدله کړئ. سیستم د RTL ملاتړ کوي.' },
      { question: 'څنګه د معلوماتو بکاپ واخلم؟', answer: 'Settings -> Backup & Restore ته لاړ شئ او Export Data وټاکئ. سیستم د JSON بکاپ فایل ډاونلوډ کوي؛ هغه په خوندي ځای کې وساتئ.' },
      { question: 'څنګه راپورونه چاپ کړم؟', answer: 'Reports پرانیزئ، د راپور ډول او د نېټې محدوده وټاکئ، بیا د چاپ یا export انتخاب وکاروئ. د چاپ بڼه له Settings څخه تنظیمېږي.' },
      { question: 'څنګه څو پیسې مدیریت کړم؟', answer: 'په Settings کې اصلي پیسې او د تبادلې نرخونه وټاکئ. ډشبورډ او راپورونه ارزښتونه د ټاکل شوو نرخونو له مخې بدلوي.' },
      { question: 'څنګه کارکوونکي او معاشات مدیریت کړم؟', answer: 'Staff پرانیزئ او کارکوونکي، دنده، معاش او اړوند معلومات ثبت کړئ. معاشونه په مالي محاسبو کې شاملېږي.' },
      { question: 'Advanced Multi-Device Sync څنګه کار کوي؟', answer: 'پرمختللې همغږي د بکاپ او ریستور له لارې د څو وسیلو معلومات شریکوي. یوازې د خپل سیستم باوري فایلونه import کړئ.' },
      { question: 'د Full او Incremental بکاپ فرق څه دی؟', answer: 'Full بکاپ ټول معلومات لري. Incremental بکاپ د یوې څانګې یا بلې وسیلې وروستي بدلونونه انتقالوي.' },
      { question: 'که حذف، سمون یا تادیه کې تېروتنه وکړم څه وکړم؟', answer: 'حذف شوي ریکارډونه په ملاتړ شوو برخو کې Recycle Bin ته ځي او بېرته راوګرځېدای شي. د بېل یا تادیې لپاره اړوند ریکارډ بیا سم کړئ.' },
      { question: 'څنګه د څو څانګو معلومات په یوه اډمین کمپیوټر کې راټول کړم؟', answer: 'په هره څانګه کې له Settings څخه بکاپ جوړ کړئ. په اډمین کمپیوټر کې Settings -> Backup & Restore ته لاړ شئ، فایل import کړئ او وروسته ریکارډونه وګورئ.' },
    ],
  },
}

function FAQ({ t }) {
  const [openIndex, setOpenIndex] = useState(0)
  const content = faqContent[t.locale] ?? faqContent.en
  const faqItems = content.items

  return (
    <div className="faq-page">
      <section className="faq-shell">
        <div className="faq-hero">
          <div className="faq-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>
          <h1>FAQ</h1>
          <p>{content.subtitle}</p>
        </div>

        <div className="faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <article className={`faq-item ${isOpen ? 'open' : ''}`} key={item.question}>
                <button
                  className="faq-question"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <ChevronDown size={15} />
                </button>
                {isOpen && <p className="faq-answer">{item.answer}</p>}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default FAQ
