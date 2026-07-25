import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronDown, Archive } from '../components/Icons.jsx'
import './Workflows.css'

const workflowLabels = {
  en: {
    title: 'Workflows',
    subtitle: 'Step-by-step text diagrams of every module and the whole system',
    step: 'Step',
    of: 'of',
    complete: '✓ Walkthrough complete',
    guided: 'Guided',
    overview: 'Overview',
    previous: 'Previous',
    restart: 'Restart',
    next: 'Next',
  },
  fa: {
    title: 'جریان کارها',
    subtitle: 'دیاگرام متنی مرحله‌به‌مرحله برای هر ماژول و تمام سیستم',
    step: 'مرحله',
    of: 'از',
    complete: '✓ راهنما تکمیل شد',
    guided: 'راهنمایی‌شده',
    overview: 'نمای کلی',
    previous: 'قبلی',
    restart: 'شروع دوباره',
    next: 'بعدی',
  },
  ps: {
    title: 'کاري جریانونه',
    subtitle: 'د هر ماډل او ټول سیستم مرحله‌وار متني دیاګرامونه',
    step: 'مرحله',
    of: 'له',
    complete: '✓ لارښود بشپړ شو',
    guided: 'لارښود',
    overview: 'عمومي لید',
    previous: 'مخکینی',
    restart: 'بیا پیل',
    next: 'بل',
  },
}

const workflowSections = {
  en: [
    ['whole', 'Whole system', ['[ User Login ] -> [ Dashboard ]\n |\n +-> [ Sidebar Navigation ] -> any module\n +-> [ Header ] -> Search / Currency / Language / Theme / Lock', '[ Business Data ]\n |\n +-> Products -> Billing -> Sales/Bills\n +-> Suppliers -> Godown -> Stock movement\n +-> Customers -> Loans -> Payments\n +-> Expenses + Staff -> Financials -> Reports\n +-> Settings -> Backup / Restore / Security']],
    ['sidebar', 'Sidebar', ['[ Sidebar ]\n |\n +-> Dashboard / Products / Billing / Sales\n +-> Staff / Customers / Godown / Suppliers / Bundles\n +-> Expenses / Loans / Financials / Reports', '[ Sidebar footer ]\n |\n +-> Help menu\n     |-> Help Center / Developer / FAQ\n     |-> User Guide / Workflows / Terms & Privacy']],
    ['header', 'Header', ['[ Header ]\n |\n +-> Global Search\n +-> Currency filter\n +-> Wallet\n +-> Theme / Language / Notifications / Profile', '[ Header Action ]\n User chooses filter/action\n -> App state updates\n -> Active module refreshes']],
    ['dashboard', 'Dashboard', ['[ Dashboard ]\n |\n +-> Read products, sales, expenses, loans\n +-> Calculate revenue / profit / wallet / pending\n +-> Show metric cards', '[ Quick Action ]\n Dashboard -> Billing / Products / Reports\n -> user reaches the needed module quickly']],
    ['products', 'Products', ['[ Add Product ]\n Product details -> category -> unit\n -> purchase price -> selling price\n -> stock quantity -> save', '[ Product Usage ]\n Product -> Billing sale\n Product -> Godown import/export\n Product value -> Financials / Reports']],
    ['billing', 'Billing', ['[ Create Invoice ]\n Select customer -> add products\n -> quantity / discount / payment\n -> save bill -> print preview', '[ After Save ]\n Bill -> Sales/Bills\n Bill -> Customer profile\n Bill -> Product stock update\n Bill -> Reports']],
    ['salesBills', 'Sales / Bills', ['[ Sales/Bills ]\n Search invoice -> filter by date/customer/status\n -> open bill -> print or edit', '[ Edit Bill ]\n Open sale -> update details\n -> save changes\n -> stock and customer balance refresh']],
    ['staff', 'Staff', ['[ Staff ]\n Add staff -> role / salary / contact\n -> active status -> save record', '[ Payroll Impact ]\n Staff salary -> Financials\n Staff records -> Reports']],
    ['customers', 'Customers', ['[ Customer Profile ]\n Add customer -> contact details\n -> sales history -> payment history\n -> balance / loans', '[ Customer Activity ]\n Billing creates sale\n -> Customer profile updates\n -> Loans/payments update balance']],
    ['godown', 'Godown', ['[ Godown Import ]\n Select supplier -> add products\n -> quantity / prices / expiry\n -> save -> stock increases', '[ Stock Movement ]\n Product movement -> save\n -> stock and reports update']],
    ['suppliers', 'Suppliers / Katanama', ['[ Supplier Ledger ]\n Create supplier -> opening balance\n -> deposits / withdrawals\n -> goods records -> settlement', '[ Supplier Flow ]\n Supplier -> Godown import\n -> product stock -> supplier balance -> reports']],
    ['bundles', 'Bundles', ['[ Create Bundle ]\n Bundle name -> included products\n -> quantities -> cost -> save', '[ Sell Bundle ]\n Bundle -> Billing\n -> included product stock decreases\n -> Sales/Bills and reports update']],
    ['expenses', 'Expenses', ['[ Add Expense ]\n Amount -> category -> date\n -> payment method -> notes -> save', '[ Expense Impact ]\n Expense -> Financials\n -> Reports -> Profit calculation']],
    ['loans', 'Loans', ['[ Loan Flow ]\n Select customer -> create loan\n -> record payment -> remaining balance updates', '[ Loan Data ]\n Customer profile -> loan history\n -> pending payments -> dashboard and financials']],
    ['financials', 'Financials', ['[ Financials ]\n Sales revenue + Expenses + Staff salaries\n + Stock value + Cash wallet\n -> net business view', '[ Detail Pages ]\n Click financial card -> see breakdown\n -> filter by date/currency -> print/export']],
    ['reports', 'Reports', ['[ Reports ]\n Choose report type -> date range\n -> charts/tables -> print/export', '[ Report Sources ]\n Products + Sales + Customers\n + Expenses + Staff + Suppliers -> analytics']],
    ['recycleBin', 'Recycle Bin', ['[ Delete Record ]\n Delete action -> confirmation\n -> item moves to Recycle Bin', '[ Recovery ]\n Recycle Bin -> select item\n -> restore or permanently delete']],
    ['settings', 'Settings', ['[ Settings ]\n Company info -> theme / language\n -> currency -> print settings\n -> notifications -> backup / restore', '[ Backup / Restore ]\n Export JSON backup -> store safely\n -> import trusted file -> app data reloads']],
    ['sync', 'Advanced Sync (branch -> admin)', ['[ Branch computer ]\n Settings -> Backup\n -> create backup file\n -> send to admin PC', '[ Admin computer ]\n Settings -> Backup & Restore\n -> import received backup\n -> review restored data']],
  ],
  fa: [
    ['whole', 'تمام سیستم', ['[ ورود کاربر ] -> [ داشبورد ]\n |\n +-> [ منوی کناری ] -> هر ماژول\n +-> [ نوار بالا ] -> جستجو / واحد پول / زبان / تم / قفل', '[ معلومات تجارت ]\n |\n +-> محصولات -> بلینگ -> فروش/بل‌ها\n +-> تهیه‌کنندگان -> گدام -> حرکت موجودی\n +-> مشتریان -> قرضه‌ها -> پرداخت‌ها\n +-> مصارف + کارمندان -> مالی -> گزارش‌ها\n +-> تنظیمات -> بکاپ / بازگردانی / امنیت']],
    ['sidebar', 'سایدبار', ['[ سایدبار ]\n |\n +-> داشبورد / محصولات / بلینگ / فروش\n +-> کارمندان / مشتریان / گدام / تهیه‌کنندگان / بسته‌ها\n +-> مصارف / قرضه‌ها / مالی / گزارش‌ها', '[ پایین سایدبار ]\n |\n +-> منوی کمک\n     |-> مرکز کمک / توسعه‌دهنده / پرسش‌ها\n     |-> راهنمای کاربر / جریان کارها / شرایط و حریم خصوصی']],
    ['header', 'نوار بالا', ['[ نوار بالا ]\n |\n +-> جستجوی عمومی\n +-> فیلتر واحد پول\n +-> کیف پول\n +-> تم / زبان / اطلاعیه‌ها / پروفایل', '[ عمل نوار بالا ]\n کاربر فیلتر یا عمل را انتخاب می‌کند\n -> حالت سیستم تغییر می‌کند\n -> ماژول فعال تازه می‌شود']],
    ['dashboard', 'داشبورد', ['[ داشبورد ]\n |\n +-> محصولات، فروش، مصارف و قرضه‌ها را می‌خواند\n +-> عواید / مفاد / کیف پول / باقی‌مانده را محاسبه می‌کند\n +-> کارت‌های آماری را نشان می‌دهد', '[ عمل سریع ]\n داشبورد -> بلینگ / محصولات / گزارش‌ها\n -> کاربر زود به بخش مورد نیاز می‌رسد']],
    ['products', 'محصولات', ['[ افزودن محصول ]\n معلومات محصول -> کتگوری -> واحد\n -> قیمت خرید -> قیمت فروش\n -> مقدار موجودی -> ذخیره', '[ استفاده محصول ]\n محصول -> فروش در بلینگ\n محصول -> واردات/صادرات گدام\n ارزش محصول -> مالی / گزارش‌ها']],
    ['billing', 'بلینگ', ['[ ساخت بل ]\n انتخاب مشتری -> افزودن محصولات\n -> مقدار / تخفیف / پرداخت\n -> ذخیره بل -> پیش‌نمایش چاپ', '[ بعد از ذخیره ]\n بل -> فروش/بل‌ها\n بل -> پروفایل مشتری\n بل -> تغییر موجودی\n بل -> گزارش‌ها']],
    ['salesBills', 'فروش / بل‌ها', ['[ فروش/بل‌ها ]\n جستجوی بل -> فیلتر تاریخ/مشتری/حالت\n -> باز کردن بل -> چاپ یا ویرایش', '[ ویرایش بل ]\n باز کردن فروش -> تغییر جزئیات\n -> ذخیره -> موجودی و بیلانس مشتری تازه می‌شود']],
    ['staff', 'کارمندان', ['[ کارمندان ]\n افزودن کارمند -> وظیفه / معاش / تماس\n -> حالت فعال -> ذخیره', '[ اثر معاش ]\n معاش کارمند -> مالی\n ریکارډ کارمندان -> گزارش‌ها']],
    ['customers', 'مشتریان', ['[ پروفایل مشتری ]\n افزودن مشتری -> تماس\n -> تاریخچه فروش -> تاریخچه پرداخت\n -> بیلانس / قرضه‌ها', '[ فعالیت مشتری ]\n بلینگ فروش ایجاد می‌کند\n -> پروفایل مشتری تازه می‌شود\n -> قرضه/پرداخت بیلانس را تغییر می‌دهد']],
    ['godown', 'گدام', ['[ واردات گدام ]\n انتخاب تهیه‌کننده -> افزودن محصولات\n -> مقدار / قیمت / تاریخ انقضا\n -> ذخیره -> موجودی زیاد می‌شود', '[ حرکت موجودی ]\n حرکت محصول -> ذخیره\n -> موجودی و گزارش‌ها تازه می‌شود']],
    ['suppliers', 'تهیه‌کنندگان / کتنامه', ['[ دفتر تهیه‌کننده ]\n ایجاد تهیه‌کننده -> بیلانس ابتدایی\n -> واریز / برداشت\n -> اجناس -> تصفیه', '[ جریان تهیه‌کننده ]\n تهیه‌کننده -> واردات گدام\n -> موجودی محصول -> بیلانس تهیه‌کننده -> گزارش‌ها']],
    ['bundles', 'بسته‌ها', ['[ ساخت بسته ]\n نام بسته -> محصولات شامل\n -> مقدارها -> مصرف -> ذخیره', '[ فروش بسته ]\n بسته -> بلینگ\n -> موجودی محصولات شامل کم می‌شود\n -> فروش/بل‌ها و گزارش‌ها تازه می‌شود']],
    ['expenses', 'مصارف', ['[ افزودن مصرف ]\n مقدار -> کتگوری -> تاریخ\n -> طریقه پرداخت -> یادداشت -> ذخیره', '[ اثر مصرف ]\n مصرف -> مالی\n -> گزارش‌ها -> محاسبه مفاد']],
    ['loans', 'قرضه‌ها', ['[ جریان قرضه ]\n انتخاب مشتری -> ایجاد قرضه\n -> ثبت پرداخت -> بیلانس باقی‌مانده تغییر می‌کند', '[ معلومات قرضه ]\n پروفایل مشتری -> تاریخچه قرضه\n -> پرداخت‌های باقی‌مانده -> داشبورد و مالی']],
    ['financials', 'مالی', ['[ مالی ]\n عواید فروش + مصارف + معاشات\n + ارزش موجودی + کیف پول\n -> نمای خالص تجارت', '[ صفحات جزئیات ]\n کلیک روی کارت مالی -> دیدن جزئیات\n -> فیلتر تاریخ/واحد پول -> چاپ/خروجی']],
    ['reports', 'گزارش‌ها', ['[ گزارش‌ها ]\n انتخاب نوع گزارش -> محدوده تاریخ\n -> نمودار/جدول -> چاپ/خروجی', '[ منابع گزارش ]\n محصولات + فروش + مشتریان\n + مصارف + کارمندان + تهیه‌کنندگان -> تحلیل']],
    ['recycleBin', 'سطل بازیافت', ['[ حذف ریکارډ ]\n عمل حذف -> تایید\n -> مورد به سطل بازیافت می‌رود', '[ بازیابی ]\n سطل بازیافت -> انتخاب مورد\n -> بازگردانی یا حذف دائمی']],
    ['settings', 'تنظیمات', ['[ تنظیمات ]\n معلومات شرکت -> تم / زبان\n -> واحد پول -> چاپ\n -> اطلاعیه‌ها -> بکاپ / بازگردانی', '[ بکاپ / بازگردانی ]\n گرفتن بکاپ JSON -> نگهداری امن\n -> وارد کردن فایل قابل اعتماد -> معلومات تازه می‌شود']],
    ['sync', 'همگام‌سازی پیشرفته (شعبه -> ادمین)', ['[ کمپیوتر شعبه ]\n تنظیمات -> بکاپ\n -> ساخت فایل بکاپ\n -> ارسال به کمپیوتر ادمین', '[ کمپیوتر ادمین ]\n تنظیمات -> بکاپ و بازگردانی\n -> وارد کردن بکاپ\n -> بررسی معلومات بازگردانده‌شده']],
  ],
  ps: [
    ['whole', 'ټول سیستم', ['[ د کارن ننوتل ] -> [ ډشبورډ ]\n |\n +-> [ څنګ منو ] -> هر ماډل\n +-> [ پورته بار ] -> پلټنه / پیسې / ژبه / تم / قفل', '[ د تجارت معلومات ]\n |\n +-> محصولات -> بېلنګ -> خرڅلاو/بېلونه\n +-> عرضه کوونکي -> ګدام -> موجودي حرکت\n +-> مشتریان -> پورونه -> تادیې\n +-> لګښتونه + کارکوونکي -> مالي -> راپورونه\n +-> تنظیمات -> بکاپ / بیا راوستل / امنیت']],
    ['sidebar', 'سایدبار', ['[ سایدبار ]\n |\n +-> ډشبورډ / محصولات / بېلنګ / خرڅلاو\n +-> کارکوونکي / مشتریان / ګدام / عرضه کوونکي / بسته‌ها\n +-> لګښتونه / پورونه / مالي / راپورونه', '[ د سایدبار لاندې برخه ]\n |\n +-> د مرستې منو\n     |-> Help Center / Developer / FAQ\n     |-> User Guide / Workflows / Terms & Privacy']],
    ['header', 'پورته بار', ['[ پورته بار ]\n |\n +-> عمومي پلټنه\n +-> د پیسو فلټر\n +-> بټوه\n +-> تم / ژبه / خبرتیاوې / پروفایل', '[ د پورته بار عمل ]\n کارن فلټر یا عمل ټاکي\n -> د سیستم حالت بدلېږي\n -> فعال ماډل تازه کېږي']],
    ['dashboard', 'ډشبورډ', ['[ ډشبورډ ]\n |\n +-> محصولات، خرڅلاو، لګښتونه او پورونه لولي\n +-> عاید / ګټه / بټوه / پاتې پیسې محاسبه کوي\n +-> احصایوي کارتونه ښيي', '[ چټک عمل ]\n ډشبورډ -> بېلنګ / محصولات / راپورونه\n -> کارن ژر اړین ماډل ته رسېږي']],
    ['products', 'محصولات', ['[ محصول زیاتول ]\n د محصول معلومات -> کتګوري -> واحد\n -> د پېر قیمت -> د پلور قیمت\n -> موجودي -> خوندي کول', '[ د محصول استعمال ]\n محصول -> په بېلنګ کې پلور\n محصول -> د ګدام وارد/صادر\n د محصول ارزښت -> مالي / راپورونه']],
    ['billing', 'بېلنګ', ['[ بېل جوړول ]\n مشتری ټاکل -> محصولات زیاتول\n -> مقدار / تخفیف / تادیه\n -> بېل خوندي کول -> چاپ کتنه', '[ له خوندي کولو وروسته ]\n بېل -> خرڅلاو/بېلونه\n بېل -> د مشتری پروفایل\n بېل -> موجودي بدلون\n بېل -> راپورونه']],
    ['salesBills', 'خرڅلاو / بېلونه', ['[ خرڅلاو/بېلونه ]\n بېل پلټل -> د نېټې/مشتری/حالت فلټر\n -> بېل پرانیستل -> چاپ یا سمون', '[ بېل سمول ]\n خرڅلاو پرانیستل -> جزئیات بدلول\n -> خوندي کول -> موجودي او بیلانس تازه کېږي']],
    ['staff', 'کارکوونکي', ['[ کارکوونکي ]\n کارکوونکی زیاتول -> دنده / معاش / تماس\n -> فعال حالت -> خوندي کول', '[ د معاش اثر ]\n د کارکوونکي معاش -> مالي\n د کارکوونکو ریکارډ -> راپورونه']],
    ['customers', 'مشتریان', ['[ د مشتری پروفایل ]\n مشتری زیاتول -> تماس\n -> د خرڅلاو تاریخچه -> د تادیې تاریخچه\n -> بیلانس / پورونه', '[ د مشتری فعالیت ]\n بېلنګ خرڅلاو جوړوي\n -> پروفایل تازه کېږي\n -> پور/تادیه بیلانس بدلوي']],
    ['godown', 'ګدام', ['[ د ګدام واردات ]\n عرضه کوونکی ټاکل -> محصولات زیاتول\n -> مقدار / قیمت / ختمېدو نېټه\n -> خوندي کول -> موجودي زیاتېږي', '[ د موجودۍ حرکت ]\n د محصول حرکت -> خوندي کول\n -> موجودي او راپورونه تازه کېږي']],
    ['suppliers', 'عرضه کوونکي / کتنامه', ['[ د عرضه کوونکي دفتر ]\n عرضه کوونکی جوړول -> لومړنی بیلانس\n -> جمع / برداشت\n -> مالونه -> تصفیه', '[ د عرضه کوونکي جریان ]\n عرضه کوونکی -> د ګدام واردات\n -> محصول موجودي -> بیلانس -> راپورونه']],
    ['bundles', 'بسته‌ها', ['[ بسته جوړول ]\n د بسته نوم -> شامل محصولات\n -> مقدارونه -> مصرف -> خوندي کول', '[ بسته پلورل ]\n بسته -> بېلنګ\n -> د شامل محصولاتو موجودي کمېږي\n -> بېلونه او راپورونه تازه کېږي']],
    ['expenses', 'لګښتونه', ['[ لګښت زیاتول ]\n مقدار -> کتګوري -> نېټه\n -> د تادیې طریقه -> یادښت -> خوندي کول', '[ د لګښت اثر ]\n لګښت -> مالي\n -> راپورونه -> د ګټې محاسبه']],
    ['loans', 'پورونه', ['[ د پور جریان ]\n مشتری ټاکل -> پور جوړول\n -> تادیه ثبتول -> پاتې بیلانس بدلېږي', '[ د پور معلومات ]\n د مشتری پروفایل -> د پور تاریخچه\n -> پاتې تادیې -> ډشبورډ او مالي']],
    ['financials', 'مالي', ['[ مالي ]\n د خرڅلاو عاید + لګښتونه + معاشونه\n + د موجودۍ ارزښت + بټوه\n -> د تجارت خالص لید', '[ تفصیلي پاڼې ]\n په مالي کارت کلیک -> جزئیات\n -> د نېټې/پیسو فلټر -> چاپ/export']],
    ['reports', 'راپورونه', ['[ راپورونه ]\n د راپور ډول ټاکل -> د نېټې محدوده\n -> چارټ/جدول -> چاپ/export', '[ د راپور سرچینې ]\n محصولات + خرڅلاو + مشتریان\n + لګښتونه + کارکوونکي + عرضه کوونکي -> تحلیل']],
    ['recycleBin', 'د بازیافت ټوکرۍ', ['[ ریکارډ حذف ]\n حذف عمل -> تایید\n -> توکی Recycle Bin ته ځي', '[ بېرته راوستل ]\n Recycle Bin -> توکی ټاکل\n -> بېرته راوستل یا تل حذفول']],
    ['settings', 'تنظیمات', ['[ تنظیمات ]\n د شرکت معلومات -> تم / ژبه\n -> پیسې -> چاپ\n -> خبرتیاوې -> بکاپ / بیا راوستل', '[ بکاپ / بیا راوستل ]\n JSON بکاپ جوړول -> خوندي ساتل\n -> باوري فایل import -> معلومات تازه کېږي']],
    ['sync', 'پرمختللې همغږي (څانګه -> اډمین)', ['[ د څانګې کمپیوټر ]\n تنظیمات -> بکاپ\n -> بکاپ فایل جوړول\n -> اډمین کمپیوټر ته لېږل', '[ د اډمین کمپیوټر ]\n تنظیمات -> بکاپ او بیا راوستل\n -> بکاپ import\n -> معلومات کتل']],
  ],
}

const toSections = (items) => items.map(([key, title, steps]) => ({ key, title, steps }))

function Workflows({ t }) {
  const [activeKey, setActiveKey] = useState('whole')
  const [stepIndex, setStepIndex] = useState(0)
  const locale = t.locale ?? 'en'
  const labels = workflowLabels[locale] ?? workflowLabels.en
  const workflowItems = toSections(workflowSections[locale] ?? workflowSections.en)
  const activeSection = useMemo(
    () => workflowItems.find((item) => item.key === activeKey) ?? workflowItems[0],
    [activeKey, workflowItems]
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
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </div>

        <div className="workflow-tabs" role="tablist">
          {workflowItems.map((section) => (
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
                {labels.step} {stepIndex + 1} {labels.of} {activeSection.steps.length}
              </span>
              {isComplete && <strong>{labels.complete}</strong>}
            </div>
            <div className="workflow-mode-toggle">
              <button className="active" type="button">{labels.guided}</button>
              <button type="button">{labels.overview}</button>
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
              {labels.previous}
            </button>
            <button type="button" onClick={() => setStepIndex(0)}>
              {labels.restart}
            </button>
            <button
              className="primary"
              type="button"
              disabled={stepIndex === activeSection.steps.length - 1}
              onClick={() => setStepIndex((current) => Math.min(activeSection.steps.length - 1, current + 1))}
            >
              {labels.next}
              <ChevronDown size={14} />
            </button>
          </div>
        </section>
      </section>
    </div>
  )
}

export default Workflows
