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

const features = [
  {
    icon: Archive,
    title: 'Offline-First',
    text: 'All data stored locally in IndexedDB — works without internet',
  },
  {
    icon: Globe2,
    title: 'Multi-Language',
    text: 'English, Dari, and Pashto with full RTL support',
  },
  {
    icon: Shuffle,
    title: 'Real-Time Sync',
    text: 'All modules wired together — billing, inventory, godown, suppliers',
  },
  {
    icon: Shield,
    title: 'Secure',
    text: 'Password protection, lock screen, and audit trail',
  },
  {
    icon: Settings,
    title: 'Multi-Currency',
    text: '10+ currencies with live exchange rate conversion',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Full ERP',
    text: 'Products, Billing, Sales, Staff, Customers, Godown, Suppliers, Loans, Reports',
  },
]

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="about-section-title">
      <Icon size={15} />
      <span>{children}</span>
    </h2>
  )
}

function About({ companyInfo }) {
  const businessName = companyInfo?.name || 'RetailPro'
  const businessTagline = companyInfo?.tagline || 'Retail Management System'

  return (
    <div className="about-page">
      <section className="about-shell">
        <div className="about-hero">
          <div className="about-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>
          <h1>Afghan Power</h1>
          <p>All-in-One Business Solutions</p>
          <span>Version 1.0.0</span>
        </div>

        <section className="about-card">
          <SectionTitle icon={Shuffle}>Your Business</SectionTitle>
          <div className="about-business">
            <strong>{businessName}</strong>
            <p>{businessTagline}</p>
          </div>
        </section>

        <section className="about-card">
          <SectionTitle icon={BriefcaseBusiness}>System Features</SectionTitle>
          <div className="about-features-grid">
            {features.map(({ icon: Icon, title, text }) => (
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
          <SectionTitle icon={Settings}>Developer</SectionTitle>
          <div className="about-developer">
            <div className="about-avatar">
              <UserPlus size={24} />
            </div>
            <div>
              <h3>Masi sediqi</h3>
              <p className="about-location">@ Kabul, Afghanistan</p>
              <p className="about-bio">
                Specialized in building dynamic, optimized business management systems.
                Turns ideas into reality for local and medium businesses using modern cloud computing and web technologies.
              </p>
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
          <SectionTitle icon={Shuffle}>Partnership</SectionTitle>
          <div className="about-partners">

            <article>
              <h3>Afghan Power Tech Development Company</h3>
              <p>@ Shahr-e Naw, Kabul, Afghanistan</p>
              <p>Technology development company specializing in software, websites, and application building.</p>
            </article>
          </div>
          <footer>© 2026 NEXORA. All rights reserved.</footer>
        </section>
      </section>
    </div>
  )
}

export default About
