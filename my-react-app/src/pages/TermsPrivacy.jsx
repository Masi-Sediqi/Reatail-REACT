import { useEffect, useMemo, useState } from 'react'
import './TermsPrivacy.css'

const termsContent = {
  en: {
    subtitle: 'Software usage rules, ownership, security, and privacy information.',
    legalBadge: 'Legal Agreement',
    privacyBadge: 'Data Protection',
    termsIntro: 'By using this software system, you agree to the following terms and conditions:',
    privacyIntro: 'AFGHAN POWER Retail Management System Privacy Policy',
    privacyFooter: 'For questions about privacy, contact: info@afghanpower.com',
    terms: [
      'LICENSE: This software is licensed for use in your business operations and is not sold as source code.',
      'OWNERSHIP: AFGHAN POWER owns the application design, interface, compiled application, and related intellectual property.',
      'USAGE: You may use this system for retail operations including inventory, billing, sales, expenses, customers, staff, reports, and backups.',
      'RESTRICTIONS: You may not reverse engineer, redistribute, sublicense, resell, or attempt to extract the source code.',
      'DATA: Your business data belongs to you. The system stores operational data locally on your computer.',
      'BACKUPS: You are responsible for keeping exported backup files secure and importing only files that you trust.',
      'UPDATES: Updates may be provided periodically to improve functionality, security, and compatibility.',
      'SUPPORT: Help and support links are provided from the application help menu.',
    ],
    privacy: [
      'DATA COLLECTION: This application is designed to operate locally for your retail business data.',
      'LOCAL STORAGE: Operational data is saved on your computer through the local storage service.',
      'NO TRACKING: The system does not track usage patterns or collect analytics for advertising.',
      'SECURITY: You should protect your computer account and backup files. Imported backup files replace current system data.',
      'SHARING: When you use WhatsApp, Email, or print features, data is handled by your device applications.',
      'CHANGES: AFGHAN POWER may update this policy as the application evolves.',
    ],
  },
  fa: {
    subtitle: 'قوانین استفاده از نرم‌افزار، مالکیت، امنیت و معلومات حریم خصوصی.',
    legalBadge: 'توافق‌نامه قانونی',
    privacyBadge: 'حفاظت از معلومات',
    termsIntro: 'با استفاده از این سیستم نرم‌افزاری، شما با شرایط و مقررات زیر موافقت می‌کنید:',
    privacyIntro: 'پالیسی حریم خصوصی سیستم مدیریت فروشگاه AFGHAN POWER',
    privacyFooter: 'برای پرسش‌های حریم خصوصی تماس بگیرید: info@afghanpower.com',
    terms: [
      'جواز استفاده: این نرم‌افزار برای استفاده در عملیات تجارتی شما جواز دارد و به عنوان سورس‌کد فروخته نمی‌شود.',
      'مالکیت: طراحی برنامه، رابط کاربری، نسخه کامپایل‌شده و حقوق مربوط به AFGHAN POWER تعلق دارد.',
      'استفاده: شما می‌توانید از این سیستم برای موجودی، بلینگ، فروش، مصارف، مشتریان، کارمندان، گزارش‌ها و بکاپ استفاده کنید.',
      'محدودیت‌ها: شما اجازه ندارید سورس‌کد را استخراج، بازفروشی، توزیع دوباره یا مهندسی معکوس کنید.',
      'معلومات: معلومات تجارتی شما متعلق به خودتان است. سیستم معلومات عملیاتی را به صورت محلی در کمپیوتر شما ذخیره می‌کند.',
      'بکاپ‌ها: شما مسئول نگهداری امن فایل‌های بکاپ و وارد کردن فقط فایل‌های قابل اعتماد هستید.',
      'به‌روزرسانی‌ها: برای بهتر شدن کارکرد، امنیت و سازگاری ممکن است به‌روزرسانی ارائه شود.',
      'پشتیبانی: لینک‌های کمک و پشتیبانی از منوی کمک برنامه در دسترس است.',
    ],
    privacy: [
      'جمع‌آوری معلومات: این برنامه برای کار محلی با معلومات فروشگاهی شما طراحی شده است.',
      'ذخیره محلی: معلومات عملیاتی از طریق سرویس ذخیره محلی در کمپیوتر شما ذخیره می‌شود.',
      'بدون پیگیری: سیستم رفتار استفاده شما را برای تبلیغات یا تحلیل بیرونی پیگیری نمی‌کند.',
      'امنیت: از حساب کمپیوتر و فایل‌های بکاپ خود محافظت کنید. وارد کردن بکاپ، معلومات فعلی را جایگزین می‌کند.',
      'اشتراک‌گذاری: هنگام استفاده از واتساپ، ایمیل یا چاپ، معلومات توسط برنامه‌های دستگاه شما مدیریت می‌شود.',
      'تغییرات: AFGHAN POWER ممکن است این پالیسی را با پیشرفت برنامه به‌روزرسانی کند.',
    ],
  },
  ps: {
    subtitle: 'د سافټویر د کارولو اصول، مالکیت، امنیت او د محرمیت معلومات.',
    legalBadge: 'قانوني هوکړه',
    privacyBadge: 'د معلوماتو ساتنه',
    termsIntro: 'د دې سافټویر سیستم په کارولو سره تاسو له لاندې شرایطو سره موافق یاست:',
    privacyIntro: 'د AFGHAN POWER د پرچون مدیریت سیستم د محرمیت پالیسي',
    privacyFooter: 'د محرمیت پوښتنو لپاره اړیکه: info@afghanpower.com',
    terms: [
      'جواز: دا سافټویر ستاسو د تجارتي عملیاتو لپاره جواز لري او د سورس‌کوډ په توګه نه پلورل کېږي.',
      'مالکیت: د اپلیکیشن ډیزاین، انٹرفېس، کامپایل شوې نسخه او اړوند حقوق د AFGHAN POWER ملکیت دي.',
      'استعمال: تاسو دا سیستم د موجودۍ، بېلنګ، خرڅلاو، لګښتونو، مشتریانو، کارکوونکو، راپورونو او بکاپ لپاره کارولی شئ.',
      'محدودیتونه: تاسو نشئ کولی سورس‌کوډ استخراج، بیا وپلورئ، بیا توزیع یا reverse engineer کړئ.',
      'معلومات: ستاسو تجارتي معلومات ستاسو خپل دي. سیستم عملیاتي معلومات په سیمه‌ییز ډول ستاسو په کمپیوټر کې ساتي.',
      'بکاپونه: د بکاپ فایلونو خوندي ساتل او یوازې باوري فایلونه import کول ستاسو مسئولیت دی.',
      'تازه‌کول: د کارکردګۍ، امنیت او سازګارۍ ښه کولو لپاره ممکن updates وړاندې شي.',
      'ملاتړ: د مرستې او ملاتړ لینکونه د اپلیکیشن د help منو څخه ترلاسه کېږي.',
    ],
    privacy: [
      'د معلوماتو ټولول: دا اپلیکیشن ستاسو د پرچون تجارت معلوماتو لپاره سیمه‌ییز کار کولو ته جوړ شوی.',
      'سیمه‌ییز ذخیره: عملیاتي معلومات ستاسو په کمپیوټر کې د local storage service له لارې خوندي کېږي.',
      'تعقیب نشته: سیستم ستاسو د استعمال عادتونه د اعلانونو یا بیروني analytics لپاره نه تعقیبوي.',
      'امنیت: خپل کمپیوټر حساب او بکاپ فایلونه خوندي وساتئ. import شوی بکاپ اوسني معلومات بدلوي.',
      'شریکول: کله چې واتساپ، ایمیل یا چاپ کاروئ، معلومات ستاسو د وسیلې اپلیکیشنونه اداره کوي.',
      'بدلونونه: AFGHAN POWER کولای شي دا پالیسي د اپلیکیشن له پرمختګ سره تازه کړي.',
    ],
  },
}

function TypeText({ text, speed = 8 }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 2
      setValue(text.slice(0, index))
      if (index >= text.length) window.clearInterval(timer)
    }, speed)
    return () => window.clearInterval(timer)
  }, [text, speed])

  return <>{value}</>
}

function TermsPrivacy({ t }) {
  const [activeTab, setActiveTab] = useState('terms')
  const logo = '/logo.jpeg'
  const localized = termsContent[t.locale] ?? termsContent.en

  const content = useMemo(() => {
    if (activeTab === 'privacy') {
      return {
        title: t.privacyPolicy ?? 'Privacy Policy',
        badge: localized.privacyBadge,
        intro: localized.privacyIntro,
        items: localized.privacy,
        footer: localized.privacyFooter,
      }
    }

    return {
      title: t.termsConditions ?? t.termsAndConditions ?? 'Terms & Conditions',
      badge: localized.legalBadge,
      intro: localized.termsIntro,
      items: localized.terms,
      footer: '',
    }
  }, [activeTab, localized, t])

  return (
    <div className="terms-page">
      <section className="terms-wrapper">
        <div className="terms-top-card">
          <div className="terms-logo-box">
            <img src={logo} alt="Afghan Power" />
          </div>

          <div className="terms-title-area">
            <span>AFGHAN POWER</span>
            <h1>{t.termsPrivacy ?? 'Terms & Privacy'}</h1>
            <p>{localized.subtitle}</p>
          </div>
        </div>

        <div className="terms-tabs" role="tablist">
          <button className={activeTab === 'terms' ? 'active' : ''} type="button" onClick={() => setActiveTab('terms')}>
            {t.termsConditions ?? t.termsAndConditions ?? 'Terms & Conditions'}
          </button>
          <button className={activeTab === 'privacy' ? 'active' : ''} type="button" onClick={() => setActiveTab('privacy')}>
            {t.privacyPolicy ?? 'Privacy Policy'}
          </button>
        </div>

        <section className="terms-card" key={activeTab}>
          <div className="terms-card-head">
            <span>{content.badge}</span>
            <h2><TypeText text={content.title} speed={10} /></h2>
            <p><TypeText text={content.intro} speed={6} /></p>
          </div>

          <ol className="terms-list">
            {content.items.map((item, index) => (
              <li key={item} style={{ animationDelay: `${index * 0.08}s` }}>
                {item}
              </li>
            ))}
          </ol>

          {content.footer && <p className="terms-contact"><TypeText text={content.footer} speed={6} /></p>}
        </section>
      </section>
    </div>
  )
}

export default TermsPrivacy
