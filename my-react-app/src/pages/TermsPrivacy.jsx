import { useEffect, useMemo, useState } from 'react'
import './TermsPrivacy.css'

const terms = [
  'LICENSE: This software is licensed for use in your business operations and is not sold as source code.',
  'OWNERSHIP: AFGHAN POWER owns the application design, interface, compiled application, and related intellectual property.',
  'USAGE: You may use this system for retail operations including inventory, billing, sales, expenses, customers, staff, reports, and backups.',
  'RESTRICTIONS: You may not reverse engineer, redistribute, sublicense, resell, or attempt to extract the source code.',
  'DATA: Your business data belongs to you. The system stores operational data locally in JSON files on your computer when the local storage service is running.',
  'BACKUPS: You are responsible for keeping exported backup files secure and importing only files that you trust.',
  'UPDATES: Updates may be provided periodically to improve functionality, security, and compatibility.',
  'SUPPORT: Help and support links are provided from the application help menu.',
]

const privacy = [
  'DATA COLLECTION: This application is designed to operate locally for your retail business data.',
  'LOCAL STORAGE: Operational data is saved to JSON files on your computer through the local storage service.',
  'NO TRACKING: The system does not track usage patterns or collect analytics for advertising.',
  'SECURITY: You should protect your computer account and backup files. Imported backup files replace current system data.',
  'SHARING: When you use WhatsApp, Email, or print features, data is handled by your device applications.',
  'CHANGES: AFGHAN POWER may update this policy as the application evolves.',
]

function TypeText({ text, speed = 8 }) {
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

function TermsPrivacy({ t }) {
  const [activeTab, setActiveTab] = useState('terms')
  const logo = '/logo.jpeg'

  const content = useMemo(() => {
    if (activeTab === 'privacy') {
      return {
        title: t.privacyPolicy ?? 'Privacy Policy',
        intro: 'AFGHAN POWER Retail Management System Privacy Policy',
        items: privacy,
        footer: 'For questions about privacy, contact: support@nexora.dev',
      }
    }

    return {
      title: t.termsConditions ?? 'Terms & Conditions',
      intro: 'By using this software system, you agree to the following terms and conditions:',
      items: terms,
      footer: '',
    }
  }, [activeTab, t])

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
            <p>Software usage rules, ownership, security, and privacy information.</p>
          </div>
        </div>

        <div className="terms-tabs" role="tablist">
          <button
            className={activeTab === 'terms' ? 'active' : ''}
            type="button"
            onClick={() => setActiveTab('terms')}
          >
            {t.termsConditions ?? 'Terms & Conditions'}
          </button>

          <button
            className={activeTab === 'privacy' ? 'active' : ''}
            type="button"
            onClick={() => setActiveTab('privacy')}
          >
            {t.privacyPolicy ?? 'Privacy Policy'}
          </button>
        </div>

        <section className="terms-card" key={activeTab}>
          <div className="terms-card-head">
            <span>{activeTab === 'terms' ? 'Legal Agreement' : 'Data Protection'}</span>
            <h2>
              <TypeText text={content.title} speed={10} />
            </h2>
            <p>
              <TypeText text={content.intro} speed={6} />
            </p>
          </div>

          <ol className="terms-list">
            {content.items.map((item, index) => (
              <li
                key={item}
                style={{
                  animationDelay: `${index * 0.08}s`,
                }}
              >
                {item}
              </li>
            ))}
          </ol>

          {content.footer && (
            <p className="terms-contact">
              <TypeText text={content.footer} speed={6} />
            </p>
          )}
        </section>
      </section>
    </div>
  )
}

export default TermsPrivacy