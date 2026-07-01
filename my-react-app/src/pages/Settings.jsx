import { useRef, useState } from 'react'
import { colorThemes, currencies, printTemplates, profileIcons, settingsTabs } from '../data/dashboardData.js'

function SettingsPage({
  activeColorTheme,
  baseCurrency,
  companyInfo,
  exchangeRates,
  language,
  onColorThemeChange,
  onBaseCurrencyChange,
  onCompanyInfoChange,
  onExchangeRatesChange,
  onLanguageChange,
  onNotify,
  onPrintSettingsChange,
  printSettings,
  t,
}) {
  const [activeTab, setActiveTab] = useState('general')
  const fileInputRef = useRef(null)
  const SaveIcon = profileIcons.save

  const updateField = (field, value) => {
    onCompanyInfoChange((current) => ({ ...current, [field]: value }))
  }

  const updatePrintField = (field, value) => {
    onPrintSettingsChange((current) => ({ ...current, [field]: value }))
  }

  const updateRate = (code, value) => {
    onExchangeRatesChange((current) => ({ ...current, [code]: value }))
  }

  const notifySaved = () => onNotify?.(t.savedSuccessfully)

  const uploadLogo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => updateField('logo', reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="settings-content">
      <div className="settings-heading">
        <div>
          <h1>{t.settings}</h1>
          <p>{t.manageSystemPreferences}</p>
        </div>
        <button className="save-btn" type="button" onClick={notifySaved}>
          <SaveIcon size={18} />
          <span>{t.saveChanges}</span>
        </button>
      </div>

      <div className="settings-tabs" role="tablist" aria-label={t.settings}>
        {settingsTabs.map((tab) => {
          const TabIcon = tab.icon

          return (
            <button
              className={activeTab === tab.key ? 'active' : ''}
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <TabIcon size={17} />
              <span>{t[tab.key]}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'currency' ? (
        <section className="settings-card">
          <div className="settings-card-head">
            <div>
              <h2>{t.exchangeRates ?? 'Exchange Rates'}</h2>
              <p>{t.exchangeRatesHint ?? 'Set exchange rates relative to base currency'}</p>
            </div>
            <button className="save-btn" type="button" onClick={notifySaved}>
              <SaveIcon size={18} />
              <span>{t.saveChanges}</span>
            </button>
          </div>

          <label className="single-field">
            <span>{t.baseCurrency ?? 'Base Currency'}</span>
            <select value={baseCurrency} onChange={(event) => onBaseCurrencyChange(event.target.value)}>
              {currencies.map((currency) => (
                <option value={currency.code} key={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </label>

          <h3 className="settings-subtitle">
            {t.exchangeRates ?? 'Exchange Rates'} (1 {baseCurrency} = ?)
          </h3>
          <div className="exchange-grid">
            {currencies
              .filter((currency) => currency.code !== baseCurrency)
              .map((currency) => (
                <label className="exchange-field" key={currency.code}>
                  <strong>{currency.symbol}</strong>
                  <span>{currency.name} ({currency.code})</span>
                  <input
                    inputMode="decimal"
                    placeholder="0.0000"
                    value={exchangeRates[currency.code] ?? ''}
                    onChange={(event) => updateRate(currency.code, event.target.value)}
                  />
                </label>
              ))}
          </div>
        </section>
      ) : activeTab === 'printing' ? (
        <section className="printing-settings">
          <div className="print-mode-card">
            <div>
              <h3>{t.flexiblePrintingMode ?? 'Flexible Printing Mode'}</h3>
              <p>{t.flexiblePrintingHint ?? 'Use a clean global popup-window printer for all system print actions.'}</p>
            </div>
            <button
              className={printSettings.flexibleMode ? 'toggle on' : 'toggle'}
              type="button"
              onClick={() => updatePrintField('flexibleMode', !printSettings.flexibleMode)}
            >
              <span>{printSettings.flexibleMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          <div className="print-mode-card">
            <div>
              <h3>{t.proPrintingMode ?? 'Pro Printing Mode'}</h3>
              <p>{t.proPrintingHint ?? 'Open a wide print preview dialog with full controls for templates and layout.'}</p>
            </div>
            <button
              className={printSettings.proMode ? 'toggle on' : 'toggle'}
              type="button"
              onClick={() => updatePrintField('proMode', !printSettings.proMode)}
            >
              <span>{printSettings.proMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>{t.printTemplates ?? 'Print Templates'}</h2>
                <p>{t.printTemplatesHint ?? 'Choose a print template style for invoices and reports'}</p>
              </div>
              <button className="save-btn" type="button" onClick={notifySaved}>
                <SaveIcon size={18} />
                <span>{t.saveChanges}</span>
              </button>
            </div>
            <div className="print-template-grid">
              {printTemplates.map((template) => (
                <button
                  className={printSettings.template === template.id ? 'print-template active' : 'print-template'}
                  type="button"
                  key={template.id}
                  onClick={() => updatePrintField('template', template.id)}
                >
                  <span style={{ background: `linear-gradient(90deg, ${template.colors[0]}, ${template.colors[1]})` }} />
                  <strong>{template.name}</strong>
                  <small>{template.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>{t.printConfiguration ?? 'Print Configuration'}</h2>
                <p>{t.printConfigurationHint ?? 'Customize headers, footers, and layout for printed reports and invoices'}</p>
              </div>
              <button className="save-btn" type="button" onClick={notifySaved}>
                <SaveIcon size={18} />
                <span>{t.saveChanges}</span>
              </button>
            </div>
            <div className="print-config-grid">
              {[
                ['logoWidth', t.logoWidth ?? 'Logo Width (px)', 'number'],
                ['headerColor', t.headerColor ?? 'Header Color', 'color'],
                ['footerColor', t.footerColor ?? 'Footer Color', 'color'],
                ['titleFontSize', t.titleFontSize ?? 'Title Font Size', 'number'],
                ['subtitleFontSize', t.subtitleFontSize ?? 'Subtitle Font Size', 'number'],
                ['bodyFontSize', t.bodyFontSize ?? 'Body Font Size', 'number'],
                ['paddingTop', t.paddingTop ?? 'Padding Top (mm)', 'number'],
                ['paddingBottom', t.paddingBottom ?? 'Padding Bottom (mm)', 'number'],
                ['paddingLeft', t.paddingLeft ?? 'Padding Left (mm)', 'number'],
                ['paddingRight', t.paddingRight ?? 'Padding Right (mm)', 'number'],
                ['recordsPerPage', t.recordsPerPage ?? 'Records Per Page', 'number'],
                ['headerHeight', t.headerHeight ?? 'Header Height (mm)', 'number'],
                ['footerHeight', t.footerHeight ?? 'Footer Height (mm)', 'number'],
              ].map(([field, label, type]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input
                    type={type}
                    value={printSettings[field]}
                    onChange={(event) => updatePrintField(field, event.target.value)}
                  />
                </label>
              ))}
              <label>
                <span>{t.headerAlignment ?? 'Header Alignment'}</span>
                <select value={printSettings.headerAlignment} onChange={(event) => updatePrintField('headerAlignment', event.target.value)}>
                  <option>Left</option>
                  <option>Center</option>
                  <option>Right</option>
                </select>
              </label>
              <label>
                <span>{t.footerAlignment ?? 'Footer Alignment'}</span>
                <select value={printSettings.footerAlignment} onChange={(event) => updatePrintField('footerAlignment', event.target.value)}>
                  <option>Left</option>
                  <option>Center</option>
                  <option>Right</option>
                </select>
              </label>
              <label>
                <span>{t.fontFamily ?? 'Font Family'}</span>
                <select value={printSettings.fontFamily} onChange={(event) => updatePrintField('fontFamily', event.target.value)}>
                  <option>Arial</option>
                  <option>Tahoma</option>
                  <option>Verdana</option>
                  <option>Times New Roman</option>
                </select>
              </label>
              <label>
                <span>{t.reportPaperSize ?? 'Paper Size (Reports)'}</span>
                <select value={printSettings.reportPaperSize} onChange={(event) => updatePrintField('reportPaperSize', event.target.value)}>
                  <option>A4</option>
                  <option>Letter</option>
                  <option>A5</option>
                </select>
              </label>
              <label>
                <span>{t.billingPaperSize ?? 'Billing Paper Size'}</span>
                <select value={printSettings.billingPaperSize} onChange={(event) => updatePrintField('billingPaperSize', event.target.value)}>
                  <option>80mm (Thermal)</option>
                  <option>A4</option>
                  <option>Letter</option>
                </select>
              </label>
              <label className="wide">
                <span>{t.footerText ?? 'Footer Text'}</span>
                <input value={printSettings.footerText} onChange={(event) => updatePrintField('footerText', event.target.value)} />
              </label>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>{t.printBranding ?? 'Print Branding (per language)'}</h2>
                <p>{t.printBrandingHint ?? 'Customize header text and social links shown on printed documents per language.'}</p>
              </div>
              <button className="save-btn" type="button" onClick={notifySaved}>
                <SaveIcon size={18} />
                <span>{t.saveChanges}</span>
              </button>
            </div>
            <div className="brand-language-tabs">
              {['en', 'fa', 'ps'].map((code) => (
                <button
                  className={printSettings.brandLanguage === code ? 'active' : ''}
                  type="button"
                  key={code}
                  onClick={() => updatePrintField('brandLanguage', code)}
                >
                  {code === 'en' ? 'English' : code === 'fa' ? 'دری' : 'پشتو'}
                </button>
              ))}
            </div>
            <div className="print-config-grid two">
              <label>
                <span>{t.printTitle ?? 'Print Title'}</span>
                <input value={printSettings.printTitle} onChange={(event) => updatePrintField('printTitle', event.target.value)} />
              </label>
              <label>
                <span>{t.printSubtitle ?? 'Print Subtitle'}</span>
                <input value={printSettings.printSubtitle} onChange={(event) => updatePrintField('printSubtitle', event.target.value)} />
              </label>
            </div>
          </div>
        </section>
      ) : activeTab === 'themes' ? (
        <section className="settings-card">
          <h2>{t.themeSelection}</h2>
          <p>{t.themeSelectionHint}</p>
          <div className="theme-grid">
            {colorThemes.map((item) => (
              <button
                className={activeColorTheme === item.id ? 'theme-choice active' : 'theme-choice'}
                type="button"
                key={item.id}
                onClick={() => onColorThemeChange(item.id)}
              >
                <span
                  className="theme-preview"
                  style={{
                    background: `linear-gradient(90deg, ${item.colors[0]}, ${item.colors[1]})`,
                  }}
                />
                <strong>{item.name}</strong>
                <small>{t[item.descriptionKey]}</small>
                {activeColorTheme === item.id && <em>{t.activeTheme}</em>}
              </button>
            ))}
          </div>
        </section>
      ) : activeTab === 'general' ? (
        <section className="settings-card">
          <h2>{t.companyInformation}</h2>
          <p>{t.updateBusinessDetails}</p>

          <div className="company-logo-row">
            <div>
              <strong>{t.companyLogo}</strong>
              <span>{t.companyLogoHint}</span>
            </div>
            <div className="logo-actions">
              <div className="logo-preview">
                {companyInfo.logo ? <img src={companyInfo.logo} alt="" /> : <span>▣</span>}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                {t.uploadLogo}
              </button>
              <button className="danger-link" type="button" onClick={() => updateField('logo', '')}>
                {t.remove}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadLogo} />
            </div>
          </div>

          <form className="settings-form">
            <label>
              <span>{t.companyName}</span>
              <input value={companyInfo.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              <span>{t.subtitleTagline}</span>
              <input value={companyInfo.tagline} onChange={(event) => updateField('tagline', event.target.value)} />
            </label>
            <label className="wide">
              <span>{t.address}</span>
              <input value={companyInfo.address} onChange={(event) => updateField('address', event.target.value)} />
            </label>
            <label>
              <span>{t.phoneNumber}</span>
              <input value={companyInfo.phone} onChange={(event) => updateField('phone', event.target.value)} />
            </label>
            <label>
              <span>{t.emailAddress}</span>
              <input value={companyInfo.email} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label>
              <span>{t.website}</span>
              <input value={companyInfo.website} onChange={(event) => updateField('website', event.target.value)} />
            </label>
            <label>
              <span>{t.defaultCurrency}</span>
              <select value={companyInfo.currency} onChange={(event) => updateField('currency', event.target.value)}>
                <option>؋ Afghan Afghani (AFN)</option>
                <option>$ US Dollar (USD)</option>
                <option>€ Euro (EUR)</option>
              </select>
            </label>
            <label>
              <span>{t.language}</span>
              <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
                <option value="en">English (English)</option>
                <option value="fa">دری</option>
                <option value="ps">پشتو</option>
              </select>
            </label>
          </form>
        </section>
      ) : (
        <section className="settings-card empty-settings-card">
          <h2>{t[activeTab]}</h2>
          <p>{t.settingsComingSoon}</p>
        </section>
      )}
    </div>
  )
}

export default SettingsPage
