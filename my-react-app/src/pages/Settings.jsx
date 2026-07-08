import { useEffect, useMemo, useRef, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import { Archive, Bell, Download, Mail, Play, Shuffle, Trash2, Upload, Volume2 } from '../components/Icons.jsx'
import { colorThemes, currencies, printTemplates, profileIcons, settingsTabs } from '../data/dashboardData.js'
import { playNotificationSound, soundOptions } from '../utils/notificationSounds.js'

const backupFrequencyOptions = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom (minutes)' },
]

const getBackupDelay = (settings) => {
  if (settings.frequency === 'hourly') return 60 * 60 * 1000
  if (settings.frequency === 'daily') return 24 * 60 * 60 * 1000
  if (settings.frequency === 'weekly') return 7 * 24 * 60 * 60 * 1000
  if (settings.frequency === 'monthly') return 30 * 24 * 60 * 60 * 1000
  return Math.max(1, Number(settings.customMinutes || 30)) * 60 * 1000
}

const downloadJson = (payload, fileName) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function SettingsPage({
  activeColorTheme,
  appBackupData,
  baseCurrency,
  companyInfo,
  exchangeRates,
  language,
  onColorThemeChange,
  onBaseCurrencyChange,
  onClearBusinessData,
  onCompanyInfoChange,
  onExchangeRatesChange,
  onImportBackupData,
  onLanguageChange,
  onNotify,
  onPrintSettingsChange,
  printSettings,
  t,
}) {
  const [activeTab, setActiveTab] = useState('general')
  const fileInputRef = useRef(null)
  const importInputRef = useRef(null)
  const SaveIcon = profileIcons.save
  const currencyOptions = currencies.map((currency) => ({ value: currency.code, label: `${currency.symbol} ${currency.name} (${currency.code})` }))
  const companyCurrencyOptions = [
    { value: '؋ Afghan Afghani (AFN)', label: '؋ Afghan Afghani (AFN)' },
    { value: '$ US Dollar (USD)', label: '$ US Dollar (USD)' },
    { value: '€ Euro (EUR)', label: '€ Euro (EUR)' },
  ]
  const languageOptions = [
    { value: 'en', label: 'English (English)' },
    { value: 'fa', label: 'دری' },
    { value: 'ps', label: 'پښتو' },
  ]
  const alignmentOptions = [
    { value: 'Left', label: t.left ?? 'Left' },
    { value: 'Center', label: t.center ?? 'Center' },
    { value: 'Right', label: t.right ?? 'Right' },
  ]
  const fontOptions = ['Arial', 'Tahoma', 'Verdana', 'Times New Roman'].map((item) => ({ value: item, label: item }))
  const reportPaperOptions = ['A4', 'Letter', 'A5'].map((item) => ({ value: item, label: item }))
  const billingPaperOptions = ['80mm (Thermal)', 'A4', 'Letter'].map((item) => ({ value: item, label: item }))
  const sharingSettings = companyInfo.sharingSettings ?? { whatsapp: '+93700000000', email: 'info@company.com' }
  const kpiRouting = companyInfo.kpiRouting ?? { totalRevenue: false, pureProfit: false, netProfit: false, currentCashWallet: true }
  const taxSettings = companyInfo.taxSettings ?? { taxRate: '0', adjustments: '0', currency: 'Ø‹ Afghan Afghani (AFN)' }
  const inventorySettings = companyInfo.inventorySettings ?? { costingMethod: 'lifo' }
  const notificationSettings = companyInfo.notificationSettings ?? { sound: 'bell' }
  const backupSettings = companyInfo.backupSettings ?? {
    automatic: false,
    frequency: 'daily',
    customMinutes: '30',
    lastRun: '',
    nextRun: '',
  }
  const costingOptions = [
    { value: 'lifo', label: t.lifoCosting ?? 'LIFO — newest lot first (default)' },
    { value: 'fifo', label: t.fifoCosting ?? 'FIFO — oldest lot first' },
    { value: 'wac', label: t.wacCosting ?? 'WAC — weighted average cost' },
  ]

  const backupSelectOptions = backupFrequencyOptions.map((option) => ({
    value: option.value,
    label: t[`${option.value}Backup`] ?? option.label,
  }))
  const nextBackupRun = useMemo(() => {
    const timestamp = backupSettings.nextRun || (backupSettings.automatic ? new Date(Date.now() + getBackupDelay(backupSettings)).toISOString() : '')
    return timestamp ? new Date(timestamp).toLocaleString() : (t.notScheduled ?? 'Not scheduled')
  }, [backupSettings, t.notScheduled])

  const updateField = (field, value) => {
    onCompanyInfoChange((current) => ({ ...current, [field]: value }))
  }

  const updateNestedField = (group, field, value) => {
    onCompanyInfoChange((current) => ({ ...current, [group]: { ...(current[group] ?? {}), [field]: value } }))
  }

  const updatePrintField = (field, value) => {
    onPrintSettingsChange((current) => ({ ...current, [field]: value }))
  }

  const updateRate = (code, value) => {
    onExchangeRatesChange((current) => ({ ...current, [code]: value }))
  }

  const notifySaved = () => onNotify?.(t.savedSuccessfully)

  const exportBackup = async (automatic = false) => {
    const exportedAt = new Date()
    const delay = getBackupDelay(backupSettings)
    const nextRun = backupSettings.automatic ? new Date(exportedAt.getTime() + delay).toISOString() : ''
    const backupPayload = {
      ...appBackupData,
      exportedAt: exportedAt.toISOString(),
      source: automatic ? 'automatic' : 'manual',
    }

    downloadJson(backupPayload, `retailpro-backup-${exportedAt.toISOString().slice(0, 10)}.json`)
    updateNestedField('backupSettings', 'lastRun', exportedAt.toISOString())
    updateNestedField('backupSettings', 'nextRun', nextRun)
    await playNotificationSound(notificationSettings.sound)
    onNotify?.(automatic ? (t.automaticBackupCreated ?? 'Automatic backup created') : (t.backupExported ?? 'Backup exported'))
  }

  const importBackup = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const imported = onImportBackupData?.(parsed)
        if (imported) onNotify?.(t.backupImported ?? 'Backup imported')
      } catch {
        onNotify?.(t.invalidBackupFile ?? 'Invalid backup file')
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const clearData = () => {
    if (window.confirm(t.confirmClearAllData ?? 'Clear all business data? This cannot be undone.')) {
      onClearBusinessData?.()
    }
  }

  const uploadLogo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => updateField('logo', reader.result)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!backupSettings.automatic) return undefined
    const delay = getBackupDelay(backupSettings)
    const timer = window.setTimeout(() => {
      exportBackup(true)
    }, delay)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupSettings.automatic, backupSettings.frequency, backupSettings.customMinutes, notificationSettings.sound, appBackupData])

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
            <CustomSelect ariaLabel={t.baseCurrency ?? 'Base Currency'} options={currencyOptions} value={baseCurrency} onChange={onBaseCurrencyChange} />
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
      ) : activeTab === 'sharing' ? (
        <section className="settings-card sharing-settings-card">
          <div className="settings-card-head">
            <div>
              <h2><Shuffle size={22} /> {t.sharingSettings ?? 'Sharing Settings'}</h2>
              <p>{t.sharingSettingsHint ?? 'Configure WhatsApp and Email for invoice sharing'}</p>
            </div>
            <button className="save-btn" type="button" onClick={notifySaved}>
              <SaveIcon size={18} />
              <span>{t.saveChanges}</span>
            </button>
          </div>
          <form className="settings-form sharing-form">
            <label className="wide">
              <span>{t.whatsappNumber ?? 'WhatsApp Number'}</span>
              <input value={sharingSettings.whatsapp} placeholder="+93700000000" onChange={(event) => updateNestedField('sharingSettings', 'whatsapp', event.target.value)} />
              <small>{t.whatsappNumberHint ?? 'Include country code (e.g. +93 for Afghanistan)'}</small>
            </label>
            <label className="wide">
              <span><Mail size={16} /> {t.emailAddress}</span>
              <input value={sharingSettings.email} placeholder="info@company.com" onChange={(event) => updateNestedField('sharingSettings', 'email', event.target.value)} />
              <small>{t.sharingEmailHint ?? 'Email used for sharing invoices and reports'}</small>
            </label>
          </form>
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
                <CustomSelect ariaLabel={t.headerAlignment ?? 'Header Alignment'} options={alignmentOptions} value={printSettings.headerAlignment} onChange={(value) => updatePrintField('headerAlignment', value)} />
              </label>
              <label>
                <span>{t.footerAlignment ?? 'Footer Alignment'}</span>
                <CustomSelect ariaLabel={t.footerAlignment ?? 'Footer Alignment'} options={alignmentOptions} value={printSettings.footerAlignment} onChange={(value) => updatePrintField('footerAlignment', value)} />
              </label>
              <label>
                <span>{t.fontFamily ?? 'Font Family'}</span>
                <CustomSelect ariaLabel={t.fontFamily ?? 'Font Family'} options={fontOptions} value={printSettings.fontFamily} onChange={(value) => updatePrintField('fontFamily', value)} />
              </label>
              <label>
                <span>{t.reportPaperSize ?? 'Paper Size (Reports)'}</span>
                <CustomSelect ariaLabel={t.reportPaperSize ?? 'Paper Size (Reports)'} options={reportPaperOptions} value={printSettings.reportPaperSize} onChange={(value) => updatePrintField('reportPaperSize', value)} />
              </label>
              <label>
                <span>{t.billingPaperSize ?? 'Billing Paper Size'}</span>
                <CustomSelect ariaLabel={t.billingPaperSize ?? 'Billing Paper Size'} options={billingPaperOptions} value={printSettings.billingPaperSize} onChange={(value) => updatePrintField('billingPaperSize', value)} />
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
      ) : activeTab === 'notifications' ? (
        <section className="settings-card notification-settings-card">
          <div className="settings-card-head">
            <div>
              <h2><Bell size={22} /> {t.notificationSounds ?? 'Notification Sounds'}</h2>
              <p>{t.notificationSoundHint ?? 'Choose notification sound for alerts'}</p>
            </div>
            <button className="save-btn" type="button" onClick={notifySaved}>
              <SaveIcon size={18} />
              <span>{t.saveChanges}</span>
            </button>
          </div>
          <div className="notification-sound-list">
            {soundOptions.filter((sound) => sound.value !== 'none').map((sound) => (
              <button
                className={notificationSettings.sound === sound.value ? 'notification-sound-option active' : 'notification-sound-option'}
                type="button"
                key={sound.value}
                onClick={() => {
                  updateNestedField('notificationSettings', 'sound', sound.value)
                  playNotificationSound(sound.value)
                }}
              >
                <Volume2 size={20} />
                <span>
                  <strong>{t[`${sound.value}Sound`] ?? sound.label}</strong>
                  <small>{t[`${sound.value}SoundHint`] ?? sound.description}</small>
                </span>
                <Play size={18} />
              </button>
            ))}
          </div>
        </section>
      ) : activeTab === 'backup' ? (
        <section className="settings-card backup-settings-card">
          <div className="settings-card-head">
            <div>
              <h2>{t.backupRestore ?? 'Backup & Restore'}</h2>
              <p>{t.manageDataBackups ?? 'Manage your data backups'}</p>
            </div>
            <button className="save-btn" type="button" onClick={notifySaved}>
              <SaveIcon size={18} />
              <span>{t.saveChanges}</span>
            </button>
          </div>

          <div className="backup-action-list">
            <div className="backup-action-row">
              <div>
                <strong><Download size={17} /> {t.exportData ?? 'Export Data'}</strong>
                <span>{t.exportDataHint ?? 'Download all data as a JSON backup file'}</span>
              </div>
              <button type="button" onClick={() => exportBackup(false)}>
                <Download size={17} />
                <span>{t.export ?? 'Export'}</span>
              </button>
            </div>
            <div className="backup-action-row">
              <div>
                <strong><Upload size={17} /> {t.importData ?? 'Import Data'}</strong>
                <span>{t.importDataHint ?? 'Restore from a backup file (replaces current data)'}</span>
              </div>
              <button type="button" onClick={() => importInputRef.current?.click()}>
                <Upload size={17} />
                <span>{t.import ?? 'Import'}</span>
              </button>
              <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importBackup} hidden />
            </div>
            <div className="backup-action-row danger">
              <div>
                <strong><Trash2 size={17} /> {t.clearAllData ?? 'Clear All Data'}</strong>
                <span>{t.clearAllDataHint ?? 'Permanently delete all data (settings will be preserved)'}</span>
              </div>
              <button className="danger-btn" type="button" onClick={clearData}>
                <Trash2 size={17} />
                <span>{t.clear ?? 'Clear'}</span>
              </button>
            </div>
          </div>

          <div className="automatic-backup-card">
            <div className="automatic-backup-head">
              <div>
                <h3>{t.automaticBackupSchedule ?? 'Automatic Backup Schedule'}</h3>
                <p>{t.automaticBackupHint ?? 'Downloads a full JSON backup on the chosen cadence while the app is open.'}</p>
              </div>
              <button
                className={backupSettings.automatic ? 'toggle on' : 'toggle'}
                type="button"
                onClick={() => updateNestedField('backupSettings', 'automatic', !backupSettings.automatic)}
              >
                <span />
              </button>
            </div>
            <div className="settings-form two">
              <label>
                <span>{t.frequency ?? 'Frequency'}</span>
                <CustomSelect
                  ariaLabel={t.frequency ?? 'Frequency'}
                  options={backupSelectOptions}
                  value={backupSettings.frequency}
                  onChange={(value) => updateNestedField('backupSettings', 'frequency', value)}
                />
              </label>
              {backupSettings.frequency === 'custom' && (
                <label>
                  <span>{t.customIntervalMinutes ?? 'Custom interval (minutes)'}</span>
                  <input
                    min="1"
                    type="number"
                    value={backupSettings.customMinutes}
                    onChange={(event) => updateNestedField('backupSettings', 'customMinutes', event.target.value)}
                  />
                </label>
              )}
            </div>
            <div className="backup-schedule-meta">
              <span>{t.lastRun ?? 'Last run'}: {backupSettings.lastRun ? new Date(backupSettings.lastRun).toLocaleString() : (t.never ?? 'Never')}</span>
              <span>{t.nextRun ?? 'Next run'}: {nextBackupRun}</span>
            </div>
            <button type="button" onClick={() => exportBackup(false)}>
              <Download size={17} />
              <span>{t.runNow ?? 'Run now'}</span>
            </button>
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
                <span className="theme-preview" style={{ background: `linear-gradient(90deg, ${item.colors[0]}, ${item.colors[1]})` }} />
                <strong>{item.name}</strong>
                <small>{t[item.descriptionKey]}</small>
                {activeColorTheme === item.id && <em>{t.activeTheme}</em>}
              </button>
            ))}
          </div>
        </section>
      ) : activeTab === 'general' ? (
        <div className="settings-general-stack">
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
              <CustomSelect ariaLabel={t.defaultCurrency} options={companyCurrencyOptions} value={companyInfo.currency} onChange={(value) => updateField('currency', value)} />
            </label>
            <label>
              <span>{t.language}</span>
              <CustomSelect ariaLabel={t.language} options={languageOptions} value={language} onChange={onLanguageChange} />
            </label>
          </form>
        </section>

        <section className="settings-card kpi-routing-card">
          <h2>{t.cashWalletKpiRouting ?? 'Cash Wallet — KPI routing'}</h2>
          <p>{t.cashWalletKpiRoutingHint ?? 'Choose which dashboard cards include cash-wallet deposits and withdrawals (supplier adjustments + manual entries).'}</p>
          <div className="kpi-route-list">
            {[
              ['totalRevenue', t.totalRevenue],
              ['pureProfit', t.pureProfit],
              ['netProfit', t.netProfit],
              ['currentCashWallet', t.currentCashWallet],
            ].map(([key, label]) => (
              <div className="kpi-route-row" key={key}>
                <div>
                  <strong>{label}</strong>
                  <span>{kpiRouting[key] ? (t.walletFlowsAffectKpi ?? 'Wallet deposits/withdrawals affect this KPI.') : (t.walletFlowsIgnoredKpi ?? 'Wallet flows are ignored for this KPI.')}</span>
                </div>
                <button className={kpiRouting[key] ? 'toggle on' : 'toggle'} type="button" onClick={() => updateNestedField('kpiRouting', key, !kpiRouting[key])}><span /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-card tax-adjustment-card">
          <h2>{t.taxAdjustments ?? 'Tax & Adjustments'}</h2>
          <p>{t.taxAdjustmentsHint ?? 'Applied only to Net Profit. Tax is charged on positive results per currency; adjustments are subtracted as a signed value.'}</p>
          <div className="print-config-grid three">
            <label><span>{t.taxRate ?? 'Tax rate (%)'}</span><input inputMode="decimal" value={taxSettings.taxRate} onChange={(event) => updateNestedField('taxSettings', 'taxRate', event.target.value)} /></label>
            <label><span>{t.otherAdjustments ?? 'Other adjustments (signed)'}</span><input inputMode="decimal" value={taxSettings.adjustments} onChange={(event) => updateNestedField('taxSettings', 'adjustments', event.target.value)} /></label>
            <label><span>{t.adjustmentsCurrency ?? 'Adjustments currency'}</span><CustomSelect ariaLabel={t.adjustmentsCurrency ?? 'Adjustments currency'} options={companyCurrencyOptions} value={taxSettings.currency} onChange={(value) => updateNestedField('taxSettings', 'currency', value)} /></label>
          </div>
          <small>{t.taxAdjustmentsFootnote ?? 'Pure Profit ignores both. Set tax to 0 and adjustments to 0 to make Net Profit identical to (Gross Profit - Expenses).'}</small>
        </section>

        <section className="settings-card inventory-cost-card">
          <h2><Archive size={22} /> {t.inventoryCostingMethod ?? 'Inventory costing method'}</h2>
          <p>{t.inventoryCostingHint ?? 'Choose how new sales value their COGS. Historical sales keep the cost captured at the time of sale and are never rewritten.'}</p>
          <label className="single-field">
            <span>{t.costingMethod ?? 'Costing method'}</span>
            <CustomSelect ariaLabel={t.costingMethod ?? 'Costing method'} options={costingOptions} value={inventorySettings.costingMethod} onChange={(value) => updateNestedField('inventorySettings', 'costingMethod', value)} />
          </label>
          <small>{t.inventoryCostingFootnote ?? 'Switching only affects sales made from now on. Past invoices, profits and refunds remain valued at their original lot cost.'}</small>
        </section>
        </div>
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

