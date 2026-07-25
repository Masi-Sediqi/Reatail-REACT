import {
  Archive,
  BriefcaseBusiness,
  Globe2,
  Settings,
  Shield,
  Shuffle,
  UserPlus,
} from '../components/Icons.jsx'
import './About.css'

const aboutContent = {
  en: {
    subtitle: 'All-in-One Business Solutions',
    version: 'Version 1.0.0',
    business: 'Your Business',
    featuresTitle: 'System Features',
    developer: 'Developer',
    location: '@ Kabul, Afghanistan',
    bio: 'Specialized in building dynamic, optimized business management systems. Turns ideas into reality for local and medium businesses using modern cloud computing and web technologies.',
    partnership: 'Partnership',
    partnerText: 'Technology development company specializing in software, websites, and application building.',
    rights: '© 2026 NEXORA. All rights reserved.',
    features: [
      { icon: Archive, title: 'Offline-First', text: 'All data stored locally in IndexedDB - works without internet' },
      { icon: Globe2, title: 'Multi-Language', text: 'English, Dari, and Pashto with full RTL support' },
      { icon: Shuffle, title: 'Real-Time Sync', text: 'All modules wired together - billing, inventory, godown, suppliers' },
      { icon: Shield, title: 'Secure', text: 'Password protection, lock screen, and audit trail' },
      { icon: Settings, title: 'Multi-Currency', text: '10+ currencies with live exchange rate conversion' },
      { icon: BriefcaseBusiness, title: 'Full ERP', text: 'Products, Billing, Sales, Staff, Customers, Godown, Suppliers, Loans, Reports' },
    ],
  },
  fa: {
    subtitle: 'راه‌حل کامل برای مدیریت تجارت',
    version: 'نسخه 1.0.0',
    business: 'تجارت شما',
    featuresTitle: 'ویژگی‌های سیستم',
    developer: 'توسعه‌دهنده',
    location: '@ کابل، افغانستان',
    bio: 'متخصص در ساخت سیستم‌های مدیریت تجارتی پویا و بهینه. ایده‌ها را برای تجارت‌های کوچک و متوسط با تکنالوژی‌های مدرن وب و کلود به واقعیت تبدیل می‌کند.',
    partnership: 'همکاری',
    partnerText: 'شرکت توسعه تکنالوژی که در ساخت نرم‌افزار، وب‌سایت و اپلیکیشن تخصص دارد.',
    rights: '© 2026 NEXORA. تمام حقوق محفوظ است.',
    features: [
      { icon: Archive, title: 'بدون نیاز به انترنت', text: 'تمام معلومات در IndexedDB محلی ذخیره می‌شود و بدون انترنت کار می‌کند' },
      { icon: Globe2, title: 'چندزبانه', text: 'انگلیسی، دری و پشتو با پشتیبانی کامل راست‌به‌چپ' },
      { icon: Shuffle, title: 'همگام‌سازی فوری', text: 'همه ماژول‌ها باهم وصل اند: بلینگ، موجودی، گدام و تهیه‌کنندگان' },
      { icon: Shield, title: 'امن', text: 'رمز عبور، قفل صفحه و ثبت فعالیت‌ها برای امنیت بهتر' },
      { icon: Settings, title: 'چند واحد پول', text: 'پشتیبانی از چندین واحد پول با نرخ تبادله' },
      { icon: BriefcaseBusiness, title: 'سیستم کامل ERP', text: 'محصولات، بلینگ، فروش، کارمندان، مشتریان، گدام، تهیه‌کنندگان، قرضه‌ها و گزارش‌ها' },
    ],
  },
  ps: {
    subtitle: 'د تجارت د مدیریت بشپړ حل',
    version: 'نسخه 1.0.0',
    business: 'ستاسو تجارت',
    featuresTitle: 'د سیستم ځانګړتیاوې',
    developer: 'پرمختیا ورکوونکی',
    location: '@ کابل، افغانستان',
    bio: 'د متحرکو او ښه تنظیم شوو تجارتي مدیریت سیستمونو په جوړولو کې تخصص لري. د کوچنیو او منځنیو تجارتونو لپاره نظرونه د عصري ویب او کلاوډ تکنالوژۍ په وسیله عملي کوي.',
    partnership: 'همکاري',
    partnerText: 'د تکنالوژۍ پرمختیا شرکت چې په سافټویر، وېب‌سایټ او اپلیکیشن جوړولو کې تخصص لري.',
    rights: '© 2026 NEXORA. ټول حقوق خوندي دي.',
    features: [
      { icon: Archive, title: 'بې انټرنټه کار', text: 'ټول معلومات په سیمه‌ییز IndexedDB کې خوندي کېږي او بې انټرنټه کار کوي' },
      { icon: Globe2, title: 'څو ژبې', text: 'انګلیسي، دری او پښتو د RTL بشپړ ملاتړ سره' },
      { icon: Shuffle, title: 'فوري همغږي', text: 'ټول ماډلونه سره نښتي دي: بېلنګ، موجودي، ګدام او عرضه کوونکي' },
      { icon: Shield, title: 'خوندي', text: 'پټنوم، د سکرین قفل او د فعالیت ثبت د ښه امنیت لپاره' },
      { icon: Settings, title: 'څو پیسې', text: 'د څو پیسو ملاتړ د تبادلې نرخ سره' },
      { icon: BriefcaseBusiness, title: 'بشپړ ERP سیستم', text: 'محصولات، بېلنګ، خرڅلاو، کارکوونکي، مشتریان، ګدام، عرضه کوونکي، پورونه او راپورونه' },
    ],
  },
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="about-section-title">
      <Icon size={15} />
      <span>{children}</span>
    </h2>
  )
}

function About({ companyInfo, t }) {
  const businessName = companyInfo?.name || 'RetailPro'
  const businessTagline = companyInfo?.tagline || t.retailManagement || 'Retail Management System'
  const content = aboutContent[t.locale] ?? aboutContent.en

  return (
    <div className="about-page">
      <section className="about-shell">
        <div className="about-hero">
          <div className="about-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>
          <h1>Afghan Power</h1>
          <p>{content.subtitle}</p>
          <span>{content.version}</span>
        </div>

        <section className="about-card">
          <SectionTitle icon={Shuffle}>{content.business}</SectionTitle>
          <div className="about-business">
            <strong>{businessName}</strong>
            <p>{businessTagline}</p>
          </div>
        </section>

        <section className="about-card">
          <SectionTitle icon={BriefcaseBusiness}>{content.featuresTitle}</SectionTitle>
          <div className="about-features-grid">
            {content.features.map(({ icon: Icon, title, text }) => (
              <article className="about-feature" key={title}>
                <Icon size={17} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-card">
          <SectionTitle icon={Settings}>{content.developer}</SectionTitle>
          <div className="about-developer">
            <div className="about-avatar">
              <UserPlus size={24} />
            </div>
            <div>
              <h3>Masi sediqi</h3>
              <p className="about-location">{content.location}</p>
              <p className="about-bio">{content.bio}</p>
              <div className="about-tags">
                <span>React</span>
                <span>Vite</span>
                <span>TypeScript</span>
                <span>Tailwind CSS</span>
                <span>IndexedDB</span>
              </div>
            </div>
          </div>
        </section>

        <section className="about-card">
          <SectionTitle icon={Shuffle}>{content.partnership}</SectionTitle>
          <div className="about-partners">
            <article>
              <h3>Afghan Power Tech Development Company</h3>
              <p>@ Shahr-e Naw, Kabul, Afghanistan</p>
              <p>{content.partnerText}</p>
            </article>
          </div>
          <footer>{content.rights}</footer>
        </section>
      </section>
    </div>
  )
}

export default About
