import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CustomSelect from '../components/CustomSelect.jsx'
import {
  Archive,
  Bell,
  Box,
  Download,
  Eye,
  Factory,
  Lock,
  Mail,
  Play,
  Plus,
  Printer,
  Shield,
  Shuffle,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  Users,
  Volume2,
  WalletCards,
  X,
} from '../components/Icons.jsx'
import { colorThemes, currencies, printTemplates, profileIcons, settingsTabs, sidebarItems } from '../data/dashboardData.js'
import { playNotificationSound, soundOptions } from '../utils/notificationSounds.js'
import { getPasswordStrength, hashPassword } from '../utils/security.js'
import './Settings.css'

const backupFrequencyOptions = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom (minutes)' },
]

const posPaperWidthOptions = [
  { value: '55mm', label: '55mm (32 cols)' },
  { value: '80mm', label: '80mm (42 cols)' },
  { value: '88mm', label: '88mm (48 cols)' },
]

const posCodePageOptions = [
  { value: 'CP437', label: 'CP437 (default)' },
  { value: 'CP850', label: 'CP850 (Latin-1)' },
  { value: 'CP1252', label: 'CP1252 (Windows West)' },
  { value: 'GB18030', label: 'GB18030 (Chinese)' },
]

const defaultPosBridge = {
  enabled: false,
  paperWidth: '80mm',
  codePage: 'CP437',
  pairedPrinters: [],
}

const permissionActions = ['create', 'read', 'update', 'delete']
const permissionModules = [
  { key: 'dashboard', label: 'Dashboard' },
  ...sidebarItems
    .filter((item) => item.key !== 'agent' && item.key !== 'dashboard')
    .map((item) => ({ key: item.key, label: item.key === 'bundlesManagement' ? 'Bundles' : item.key === 'salesBills' ? 'Sales/Bills' : item.key === 'suppliers' ? 'Suppliers' : item.key.charAt(0).toUpperCase() + item.key.slice(1) })),
  { key: 'settings', label: 'Settings' },
]

const customFieldModules = [
  { key: 'products', label: 'Products', icon: Box },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'expenses', label: 'Expenses', icon: WalletCards },
  { key: 'staff', label: 'Staff', icon: UserPlus },
  { key: 'suppliers', label: 'Suppliers/Katanama', icon: Truck },
  { key: 'godown', label: 'Godown', icon: Factory },
]

const customFieldTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
]

const emptyCustomFieldDraft = () => ({
  label: '',
  placeholder: '',
  type: 'text',
  required: false,
  options: '',
})

const getDeviceId = () => {
  const key = 'retail-device-id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const next = crypto.randomUUID().replaceAll('-', '').slice(0, 7)
  window.localStorage.setItem(key, next)
  return next
}

const emptyUserForm = () => ({
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  permissions: Object.fromEntries(permissionModules.map((module) => [
    module.key,
    { create: false, read: false, update: false, delete: false },
  ])),
})

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
  deviceId,
  exchangeRates,
  language,
  licenseStatus,
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
  const visibleSettingsTabs = useMemo(() => {
    const licenseTab = {
      key: 'license',
      label: 'Your License Key',
      icon: Shield,
    }

    const formsIndex = settingsTabs.findIndex(
      (tab) => tab.key === 'forms',
    )

    if (formsIndex === -1) {
      return [...settingsTabs, licenseTab]
    }

    return [
      ...settingsTabs.slice(0, formsIndex + 1),
      licenseTab,
      ...settingsTabs.slice(formsIndex + 1),
    ]
  }, [])
  const [editingUserId, setEditingUserId] = useState(null)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [activeCustomFieldModule, setActiveCustomFieldModule] = useState('products')
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [customFieldDraft, setCustomFieldDraft] = useState(emptyCustomFieldDraft)
  const [setPasswordForm, setSetPasswordForm] = useState({
    primary: { password: '', confirm: '' },
    secondary: { password: '', confirm: '' },
  })
  const [changePasswordForm, setChangePasswordForm] = useState({
    primary: { current: '', password: '', confirm: '', removeCurrent: '' },
    secondary: { current: '', password: '', confirm: '', removeCurrent: '' },
  })
  const [showSecurityPasswords, setShowSecurityPasswords] = useState({ primary: false, secondary: false })
  const [backupHistoryType, setBackupHistoryType] = useState('all')
  const [backupHistoryStatus, setBackupHistoryStatus] = useState('all')
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
  const posBridgeSettings = { ...defaultPosBridge, ...(companyInfo.posBridge ?? {}) }
  const systemUsers = companyInfo.systemUsers ?? []
  const customFormFields = companyInfo.customFormFields ?? {}
  const activeCustomFields = customFormFields[activeCustomFieldModule] ?? []
  const securitySettings = companyInfo.securitySettings ?? { passwordHash: '', passwordHashes: {}, lockOnStart: false, passwordUpdatedAt: '' }
  const currentLicense =
  companyInfo.licenseSettings ?? {
    installedAt: '',
    licenseKey: '',
    activatedAt: '',
    expiresAt: '',
  }

const licenseExpiresAt = currentLicense.expiresAt
  ? new Date(currentLicense.expiresAt)
  : null

const licenseInstalledAt = currentLicense.installedAt
  ? new Date(currentLicense.installedAt)
  : null

const licenseActivatedAt = currentLicense.activatedAt
  ? new Date(currentLicense.activatedAt)
  : null

const licenseIsExpired =
  !licenseExpiresAt ||
  licenseExpiresAt.getTime() <= Date.now()

const formatLicenseDate = (date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRemainingLicenseTime = (milliseconds = 0) => {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000),
  )

  const days = Math.floor(totalSeconds / 86400)

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600,
  )

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  )

  return `${days} days, ${String(hours).padStart(
    2,
    '0',
  )} hours, ${String(minutes).padStart(
    2,
    '0',
  )} minutes`
}
  const passwordHashes = {
    primary: securitySettings.passwordHashes?.primary || securitySettings.passwordHash || '',
    secondary: securitySettings.passwordHashes?.secondary || '',
  }
  const securityPasswordSlots = [
    { key: 'primary', label: 'Password 1' },
    { key: 'secondary', label: 'Password 2' },
  ]
  const activePasswordCount = Object.values(passwordHashes).filter(Boolean).length
  const hasSecurityPassword = activePasswordCount > 0
  const backupSettings = companyInfo.backupSettings ?? {
    automatic: false,
    frequency: 'daily',
    customMinutes: '30',
    lastRun: '',
    nextRun: '',
  }
  const backupHistory = companyInfo.backupHistory ?? []
  const liveActivity = companyInfo.liveActivity ?? []
  const filteredBackupHistory = backupHistory.filter((item) => (
    (backupHistoryType === 'all' || item.type === backupHistoryType)
    && (backupHistoryStatus === 'all' || item.status === backupHistoryStatus)
  ))
  const backupTypeOptions = [
    { value: 'all', label: t.allTypes ?? 'All types' },
    { value: 'import', label: t.import ?? 'Import' },
    { value: 'export', label: t.export ?? 'Export' },
  ]
  const backupStatusOptions = [
    { value: 'all', label: t.allStatuses ?? 'All statuses' },
    { value: 'success', label: t.success ?? 'Success' },
    { value: 'failed', label: t.failed ?? 'Failed' },
  ]
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

  const pushLiveActivity = (message, level = 'info') => {
    onCompanyInfoChange((current) => ({
      ...current,
      liveActivity: [{
        id: crypto.randomUUID(),
        level,
        message,
        time: new Date().toISOString(),
      }, ...(current.liveActivity ?? [])].slice(0, 120),
    }))
  }

  const pushBackupHistory = (entry) => {
    onCompanyInfoChange((current) => ({
      ...current,
      backupHistory: [{
        id: crypto.randomUUID(),
        device: getDeviceId(),
        startedAt: new Date().toISOString(),
        ...entry,
      }, ...(current.backupHistory ?? [])].slice(0, 80),
    }))
  }

  const updateSecuritySetting = (field, value) => {
    onCompanyInfoChange((current) => ({
      ...current,
      securitySettings: {
        passwordHash: '',
        passwordHashes: {},
        lockOnStart: false,
        passwordUpdatedAt: '',
        ...(current.securitySettings ?? {}),
        [field]: value,
      },
    }))
  }

  const updateSetPasswordForm = (slot, field, value) => {
    setSetPasswordForm((current) => ({
      ...current,
      [slot]: { ...current[slot], [field]: value },
    }))
  }

  const updateChangePasswordForm = (slot, field, value) => {
    setChangePasswordForm((current) => ({
      ...current,
      [slot]: { ...current[slot], [field]: value },
    }))
  }

  const saveSecurityPassword = async (slot) => {
    const draft = setPasswordForm[slot]
    if (!draft.password || draft.password !== draft.confirm) {
      onNotify?.(t.passwordsDoNotMatch ?? 'Please enter and confirm the password')
      return
    }

    const passwordHash = await hashPassword(draft.password)
    onCompanyInfoChange((current) => ({
      ...current,
      securitySettings: {
        ...(current.securitySettings ?? {}),
        passwordHash: slot === 'primary' ? passwordHash : (current.securitySettings?.passwordHash ?? ''),
        passwordHashes: {
          primary: current.securitySettings?.passwordHashes?.primary || current.securitySettings?.passwordHash || '',
          secondary: current.securitySettings?.passwordHashes?.secondary || '',
          [slot]: passwordHash,
        },
        passwordUpdatedAt: new Date().toISOString(),
      },
    }))
    setSetPasswordForm((current) => ({ ...current, [slot]: { password: '', confirm: '' } }))
    onNotify?.(t.passwordSet ?? 'Password set')
  }

  const changeSecurityPassword = async (slot) => {
    const draft = changePasswordForm[slot]
    if (!draft.current || !draft.password || draft.password !== draft.confirm) {
      onNotify?.(t.passwordsDoNotMatch ?? 'Please complete password fields')
      return
    }

    const currentHash = await hashPassword(draft.current)
    if (currentHash !== passwordHashes[slot]) {
      onNotify?.(t.currentPasswordIncorrect ?? 'Current password is incorrect')
      return
    }

    const passwordHash = await hashPassword(draft.password)
    onCompanyInfoChange((current) => ({
      ...current,
      securitySettings: {
        ...(current.securitySettings ?? {}),
        passwordHash: slot === 'primary' ? passwordHash : (current.securitySettings?.passwordHashes?.primary || current.securitySettings?.passwordHash || ''),
        passwordHashes: {
          primary: current.securitySettings?.passwordHashes?.primary || current.securitySettings?.passwordHash || '',
          secondary: current.securitySettings?.passwordHashes?.secondary || '',
          [slot]: passwordHash,
        },
        passwordUpdatedAt: new Date().toISOString(),
      },
    }))
    setChangePasswordForm((current) => ({ ...current, [slot]: { current: '', password: '', confirm: '', removeCurrent: '' } }))
    onNotify?.(t.passwordChanged ?? 'Password changed')
  }

  const removeSecurityPassword = async (slot) => {
    const currentPassword = changePasswordForm[slot].removeCurrent
    if (!currentPassword) {
      onNotify?.(t.currentPasswordIncorrect ?? 'Enter current password first')
      return
    }

    const currentHash = await hashPassword(currentPassword)
    if (currentHash !== passwordHashes[slot]) {
      onNotify?.(t.currentPasswordIncorrect ?? 'Current password is incorrect')
      return
    }

    onCompanyInfoChange((current) => ({
      ...current,
      securitySettings: (() => {
        const nextHashes = {
          primary: current.securitySettings?.passwordHashes?.primary || current.securitySettings?.passwordHash || '',
          secondary: current.securitySettings?.passwordHashes?.secondary || '',
          [slot]: '',
        }
        return {
          ...(current.securitySettings ?? {}),
          passwordHash: nextHashes.primary,
          passwordHashes: nextHashes,
          lockOnStart: Boolean(nextHashes.primary || nextHashes.secondary) && Boolean(current.securitySettings?.lockOnStart),
          passwordUpdatedAt: new Date().toISOString(),
        }
      })(),
    }))
    setSetPasswordForm((current) => ({ ...current, [slot]: { password: '', confirm: '' } }))
    setChangePasswordForm((current) => ({ ...current, [slot]: { current: '', password: '', confirm: '', removeCurrent: '' } }))
    onNotify?.(t.passwordRemoved ?? 'Password removed')
  }

  const clearLiveActivity = () => {
    onCompanyInfoChange((current) => ({ ...current, liveActivity: [] }))
  }

  const openCustomFieldModal = () => {
    setCustomFieldDraft(emptyCustomFieldDraft())
    setCustomFieldModalOpen(true)
  }

  const closeCustomFieldModal = () => {
    setCustomFieldModalOpen(false)
    setCustomFieldDraft(emptyCustomFieldDraft())
  }

  const saveCustomField = () => {
    const label = customFieldDraft.label.trim()
    if (!label) {
      onNotify?.(t.fieldLabelRequired ?? 'Field label is required')
      return
    }

    const field = {
      id: crypto.randomUUID(),
      label,
      placeholder: customFieldDraft.placeholder.trim(),
      type: customFieldDraft.type,
      required: Boolean(customFieldDraft.required),
      options: customFieldDraft.options
        .split('\n')
        .map((option) => option.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    }

    onCompanyInfoChange((current) => {
      const currentFields = current.customFormFields ?? {}
      return {
        ...current,
        customFormFields: {
          ...currentFields,
          [activeCustomFieldModule]: [...(currentFields[activeCustomFieldModule] ?? []), field],
        },
      }
    })

    closeCustomFieldModal()
    onNotify?.(t.savedSuccessfully ?? 'Saved successfully')
  }

  const deleteCustomField = (fieldId) => {
    onCompanyInfoChange((current) => {
      const currentFields = current.customFormFields ?? {}
      return {
        ...current,
        customFormFields: {
          ...currentFields,
          [activeCustomFieldModule]: (currentFields[activeCustomFieldModule] ?? []).filter((field) => field.id !== fieldId),
        },
      }
    })
  }

  const updatePosBridge = (field, value) => {
    onCompanyInfoChange((current) => ({
      ...current,
      posBridge: {
        ...defaultPosBridge,
        ...(current.posBridge ?? {}),
        [field]: value,
      },
    }))
  }

  const addPairedPrinter = (printer) => {
    onCompanyInfoChange((current) => {
      const currentBridge = { ...defaultPosBridge, ...(current.posBridge ?? {}) }
      const existing = currentBridge.pairedPrinters ?? []
      const withoutDuplicate = existing.filter((item) => item.id !== printer.id)
      return {
        ...current,
        posBridge: {
          ...currentBridge,
          pairedPrinters: [printer, ...withoutDuplicate],
        },
      }
    })
    onNotify?.(`${printer.name} paired`)
  }

  const removePairedPrinter = (printerId) => {
    onCompanyInfoChange((current) => {
      const currentBridge = { ...defaultPosBridge, ...(current.posBridge ?? {}) }
      return {
        ...current,
        posBridge: {
          ...currentBridge,
          pairedPrinters: (currentBridge.pairedPrinters ?? []).filter((item) => item.id !== printerId),
        },
      }
    })
  }

  const openUserModal = (user = null) => {
    setEditingUserId(user?.id ?? null)
    setUserForm(user ? {
      username: user.username ?? '',
      displayName: user.displayName ?? '',
      password: user.password ?? '',
      confirmPassword: user.password ?? '',
      permissions: {
        ...emptyUserForm().permissions,
        ...(user.permissions ?? {}),
      },
    } : emptyUserForm())
    setUserModalOpen(true)
  }

  const closeUserModal = () => {
    setUserModalOpen(false)
    setEditingUserId(null)
    setUserForm(emptyUserForm())
  }

  const updateUserField = (field, value) => {
    setUserForm((current) => ({ ...current, [field]: value }))
  }

  const setModulePermission = (moduleKey, action, value) => {
    setUserForm((current) => {
      const modulePermissions = {
        create: false,
        read: false,
        update: false,
        delete: false,
        ...(current.permissions[moduleKey] ?? {}),
      }
      const nextModule = action === 'all'
        ? Object.fromEntries(permissionActions.map((item) => [item, value]))
        : { ...modulePermissions, [action]: value }

      return {
        ...current,
        permissions: {
          ...current.permissions,
          [moduleKey]: nextModule,
        },
      }
    })
  }

  const saveUser = () => {
    const username = userForm.username.trim()
    const displayName = userForm.displayName.trim()
    if (!username || !displayName || !userForm.password || userForm.password !== userForm.confirmPassword) {
      onNotify?.(t.completeUserFields ?? 'Please complete user fields and confirm password')
      return
    }

    const savedUser = {
      id: editingUserId ?? crypto.randomUUID(),
      username,
      displayName,
      password: userForm.password,
      permissions: userForm.permissions,
      updatedAt: new Date().toISOString(),
      createdAt: systemUsers.find((user) => user.id === editingUserId)?.createdAt ?? new Date().toISOString(),
    }

    onCompanyInfoChange((current) => {
      const users = current.systemUsers ?? []
      return {
        ...current,
        systemUsers: editingUserId
          ? users.map((user) => (user.id === editingUserId ? savedUser : user))
          : [savedUser, ...users],
      }
    })

    closeUserModal()
    onNotify?.(editingUserId ? (t.userUpdated ?? 'User updated') : (t.userCreated ?? 'User created'))
  }

  const deleteUser = (userId) => {
    onCompanyInfoChange((current) => ({
      ...current,
      systemUsers: (current.systemUsers ?? []).filter((user) => user.id !== userId),
    }))
    onNotify?.(t.userDeleted ?? 'User deleted')
  }

  const pairUsbPrinter = async () => {
    if (!navigator.usb?.requestDevice) {
      onNotify?.('WebUSB is not supported in this browser')
      return
    }

    try {
      const device = await navigator.usb.requestDevice({ filters: [] })
      addPairedPrinter({
        id: `usb-${device.vendorId}-${device.productId}`,
        name: device.productName || device.manufacturerName || 'USB printer',
        type: 'WebUSB',
        detail: `Vendor ${device.vendorId} · Product ${device.productId}`,
        pairedAt: new Date().toISOString(),
      })
    } catch (error) {
      if (error?.name !== 'NotFoundError') onNotify?.(error?.message || 'USB pairing failed')
    }
  }

  const pairBluetoothPrinter = async () => {
    if (!navigator.bluetooth?.requestDevice) {
      onNotify?.('Web Bluetooth is not supported in this browser')
      return
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      })
      addPairedPrinter({
        id: `bluetooth-${device.id}`,
        name: device.name || 'Bluetooth printer',
        type: 'Web Bluetooth',
        detail: device.gatt ? 'GATT capable device' : 'Bluetooth device',
        pairedAt: new Date().toISOString(),
      })
    } catch (error) {
      if (error?.name !== 'NotFoundError') onNotify?.(error?.message || 'Bluetooth pairing failed')
    }
  }

  const pairSerialPrinter = async () => {
    if (!navigator.serial?.requestPort) {
      onNotify?.('Web Serial is not supported in this browser')
      return
    }

    try {
      const port = await navigator.serial.requestPort()
      const info = port.getInfo?.() ?? {}
      addPairedPrinter({
        id: `serial-${info.usbVendorId ?? 'vendor'}-${info.usbProductId ?? Date.now()}`,
        name: 'Serial printer',
        type: 'Web Serial',
        detail: `Vendor ${info.usbVendorId ?? '-'} · Product ${info.usbProductId ?? '-'}`,
        pairedAt: new Date().toISOString(),
      })
    } catch (error) {
      if (error?.name !== 'NotFoundError') onNotify?.(error?.message || 'Serial pairing failed')
    }
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
    const started = performance.now()
    const delay = getBackupDelay(backupSettings)
    const nextRun = backupSettings.automatic ? new Date(exportedAt.getTime() + delay).toISOString() : ''
    const backupPayload = {
      ...appBackupData,
      exportedAt: exportedAt.toISOString(),
      source: automatic ? 'automatic' : 'manual',
    }

    downloadJson(backupPayload, `retailpro-backup-${exportedAt.toISOString().slice(0, 10)}.json`)
    pushBackupHistory({
      type: 'export',
      mode: automatic ? 'automatic' : 'manual',
      file: `retailpro-backup-${exportedAt.toISOString().slice(0, 10)}.json`,
      duration: `${Math.max(1, Math.round(performance.now() - started))}ms`,
      changes: '-',
      status: 'success',
    })
    pushLiveActivity(`${automatic ? 'Automatic' : 'Manual'} backup exported`, 'success')
    updateNestedField('backupSettings', 'lastRun', exportedAt.toISOString())
    updateNestedField('backupSettings', 'nextRun', nextRun)
    await playNotificationSound(notificationSettings.sound)
    onNotify?.(automatic ? (t.automaticBackupCreated ?? 'Automatic backup created') : (t.backupExported ?? 'Backup exported'))
  }

  const importBackup = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const started = performance.now()

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const imported = onImportBackupData?.(parsed)
        const duration = `${Math.max(1, Math.round(performance.now() - started))}ms`
        pushBackupHistory({
          type: 'import',
          mode: parsed?.source ?? 'full',
          file: file.name,
          duration,
          changes: '-',
          status: imported ? 'success' : 'failed',
        })
        pushLiveActivity(imported ? `Backup imported: ${file.name}` : `Backup import failed: ${file.name}`, imported ? 'success' : 'error')
        if (imported) onNotify?.(t.backupImported ?? 'Backup imported')
      } catch (error) {
        pushBackupHistory({
          type: 'import',
          mode: 'full',
          file: file.name,
          duration: `${Math.max(1, Math.round(performance.now() - started))}ms`,
          changes: '-',
          status: 'failed',
        })
        pushLiveActivity(`Invalid backup file: ${file.name} - ${error?.message ?? 'Parse error'}`, 'error')
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

      <div
        className="settings-tabs"
        role="tablist"
        aria-label={t.settings}
      >
        {visibleSettingsTabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.key

          return (
            <button
              className={isActive ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <TabIcon size={17} />

              <span>
                {tab.key === 'license'
                  ? 'Your License Key'
                  : t[tab.key] ?? tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'currency' ? (
        <section className="settings-card exchange-rates-card">
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
      ) : activeTab === 'advancedSync' ? (
        <section className="advanced-sync-settings">
          <div className="settings-card backup-history-card">
            <div className="advanced-sync-head">
              <h2><Archive size={22} /> {t.backupHistory ?? 'Backup History'} <span>{backupHistory.length}</span></h2>
              <div className="advanced-sync-filters">
                <CustomSelect
                  ariaLabel={t.allTypes ?? 'All types'}
                  options={backupTypeOptions}
                  value={backupHistoryType}
                  onChange={setBackupHistoryType}
                />
                <CustomSelect
                  ariaLabel={t.allStatuses ?? 'All statuses'}
                  options={backupStatusOptions}
                  value={backupHistoryStatus}
                  onChange={setBackupHistoryStatus}
                />
              </div>
            </div>

            <div className="backup-history-table-wrap">
              <table className="backup-history-table">
                <thead>
                  <tr>
                    <th>{t.type ?? 'Type'}</th>
                    <th>{t.mode ?? 'Mode'}</th>
                    <th>{t.file ?? 'File'}</th>
                    <th>{t.device ?? 'Device'}</th>
                    <th>{t.started ?? 'Started'}</th>
                    <th>{t.duration ?? 'Duration'}</th>
                    <th>+/-/=/!/X</th>
                    <th>{t.status ?? 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBackupHistory.length ? filteredBackupHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td><span className="backup-history-type">{entry.type}</span></td>
                      <td>{entry.mode || '-'}</td>
                      <td><code>{entry.file || '-'}</code></td>
                      <td><code>{entry.device || '-'}</code></td>
                      <td>{entry.startedAt ? new Date(entry.startedAt).toLocaleString() : '-'}</td>
                      <td>{entry.duration || '-'}</td>
                      <td>{entry.changes || '-'}</td>
                      <td><span className={`backup-status-pill ${entry.status}`}>{entry.status === 'success' ? (t.success ?? 'Success') : (t.failed ?? 'Failed')}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="backup-history-empty" colSpan="8">{t.noBackupHistory ?? 'No backup history yet.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="settings-card live-activity-card">
            <div className="advanced-sync-head">
              <h2><Shuffle size={22} /> {t.liveActivity ?? 'Live Activity'} <span>{liveActivity.length}</span></h2>
              <button className="live-activity-clear" type="button" onClick={clearLiveActivity}>
                <Trash2 size={16} />
                <span>{t.clear ?? 'Clear'}</span>
              </button>
            </div>

            <div className="live-activity-terminal">
              {liveActivity.length ? liveActivity.map((item) => (
                <div className={`live-activity-line ${item.level}`} key={item.id}>
                  <span>{item.time ? new Date(item.time).toLocaleTimeString() : '--:--:--'}</span>
                  <code>{item.message}</code>
                </div>
              )) : (
                <p>{t.noRecentActivity ?? 'Idle - no recent activity.'}</p>
              )}
            </div>
          </div>
        </section>
      ) : activeTab === 'posPrinting' ? (
        <section className="pos-bridge-settings">
          <div className="settings-card pos-bridge-card">
            <div className="pos-bridge-head">
              <div>
                <h2><Printer size={22} /> {t.posPrinterBridge ?? 'POS printer bridge'}</h2>
                <p>{t.posBridgeHint ?? 'Print directly to USB or Bluetooth thermal printers.'}</p>
              </div>
            </div>

            <div className="pos-feature-row" aria-label="Supported browser APIs">
              <span>WebUSB</span>
              <span>Web Bluetooth</span>
              <span>Web Serial</span>
            </div>

            <div className="pos-direct-toggle">
              <div>
                <strong>{t.enableDirectPosPrinting ?? 'Enable direct POS printing'}</strong>
                <span>{t.enableDirectPosPrintingHint ?? 'When on, thermal receipts stream straight to the paired printer.'}</span>
              </div>
              <button
                className={posBridgeSettings.enabled ? 'toggle on' : 'toggle'}
                type="button"
                aria-pressed={posBridgeSettings.enabled}
                onClick={() => updatePosBridge('enabled', !posBridgeSettings.enabled)}
              >
                <span>{posBridgeSettings.enabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="pos-bridge-grid">
              <label>
                <span>{t.paperWidth ?? 'Paper width'}</span>
                <CustomSelect
                  ariaLabel="Paper width"
                  menuClassName="pos-select-menu"
                  options={posPaperWidthOptions}
                  value={posBridgeSettings.paperWidth}
                  onChange={(value) => updatePosBridge('paperWidth', value)}
                />
              </label>

              <label>
                <span>{t.codePage ?? 'Code page'}</span>
                <CustomSelect
                  ariaLabel="Code page"
                  menuClassName="pos-select-menu"
                  options={posCodePageOptions}
                  value={posBridgeSettings.codePage}
                  onChange={(value) => updatePosBridge('codePage', value)}
                />
              </label>
            </div>

            <div className="pos-pair-actions">
              <button type="button" onClick={pairUsbPrinter}>{t.pairUsbPrinter ?? 'Pair USB printer'}</button>
              <button type="button" onClick={pairBluetoothPrinter}>{t.pairBluetoothPrinter ?? 'Pair Bluetooth printer'}</button>
              <button type="button" onClick={pairSerialPrinter}>{t.pairSerialPrinter ?? 'Pair Serial printer'}</button>
            </div>
          </div>

          <div className="settings-card pos-paired-card">
            <h3>{t.paired ?? 'Paired'} ({posBridgeSettings.pairedPrinters.length})</h3>
            <p>{t.pairedDevicesHint ?? "Devices you've authorised. The default printer receives every direct print job."}</p>

            {posBridgeSettings.pairedPrinters.length ? (
              <div className="pos-paired-list">
                {posBridgeSettings.pairedPrinters.map((printer) => (
                  <article className="pos-paired-item" key={printer.id}>
                    <span className="pos-paired-icon"><Printer size={18} /></span>
                    <div>
                      <strong>{printer.name}</strong>
                      <small>{printer.type} · {printer.detail}</small>
                    </div>
                    <button type="button" aria-label={t.removePairedPrinter ?? 'Remove paired printer'} onClick={() => removePairedPrinter(printer.id)}>
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p>{t.noPrintersPaired ?? 'No printers paired yet. Use the buttons above to add one.'}</p>
            )}
          </div>
        </section>
      ) : activeTab === 'users' ? (
        <section className="settings-card user-management-card">
          <div className="settings-card-head">
            <div>
              <h2>{t.userManagement ?? 'User Management'}</h2>
              <p>{t.createUsersWithPermissions ?? 'Create users with specific module access and CRUD permissions'}</p>
            </div>
            <button className="save-btn" type="button" onClick={() => openUserModal()}>
              <Plus size={17} />
              <span>{t.addUser ?? 'Add User'}</span>
            </button>
          </div>

          {systemUsers.length ? (
            <div className="settings-users-table-wrap">
              <table className="settings-users-table">
                <thead>
                  <tr>
                    <th>{t.username ?? 'Username'}</th>
                    <th>{t.displayName ?? 'Display Name'}</th>
                    <th>{t.modulesAccess ?? 'Modules'}</th>
                    <th>{t.lastUpdated ?? 'Updated'}</th>
                    <th>{t.actions ?? 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {systemUsers.map((user) => {
                    const enabledModules = Object.entries(user.permissions ?? {})
                      .filter(([, permissions]) => Object.values(permissions ?? {}).some(Boolean))
                      .length
                    return (
                      <tr key={user.id}>
                        <td><strong>{user.username}</strong></td>
                        <td>{user.displayName}</td>
                        <td>{enabledModules}</td>
                        <td>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="settings-user-actions">
                            <button type="button" onClick={() => openUserModal(user)}>{t.edit ?? 'Edit'}</button>
                            <button type="button" className="danger" onClick={() => deleteUser(user.id)}>{t.delete ?? 'Delete'}</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="settings-users-empty">
              <strong>{t.noUsersYet ?? 'No users yet'}</strong>
              <span>{t.createUsersWithPermissions ?? 'Create your first user and assign module permissions.'}</span>
            </div>
          )}
        </section>
      ) : activeTab === 'security' ? (
        <section className="settings-card security-settings-card">
          <div className="settings-card-head security-settings-head">
            <div className="security-heading-copy">
              <span className="security-heading-icon">
                <Shield size={20} />
              </span>

              <div>
                <h2>{t.securitySettings ?? 'Security Settings'}</h2>
                <p>
                  {t.securitySettingsHint ??
                    'Protect your system, control startup access and manage the security password.'}
                </p>
              </div>
            </div>

            <button
              className="save-btn security-save-btn"
              type="button"
              onClick={notifySaved}
            >
              <SaveIcon size={16} />
              <span>{t.saveChanges}</span>
            </button>
          </div>

          <div className="security-overview-grid">
            <article
              className={`security-overview-card ${hasSecurityPassword ? 'is-secured' : 'is-warning'
                }`}
            >
              <span className="security-overview-icon">
                <Lock size={21} />
              </span>

              <div>
                <small>Password protection</small>

                <strong>
                  {hasSecurityPassword
                    ? `${activePasswordCount}/2 Active`
                    : t.notProtected ?? 'Not protected'}
                </strong>

                <p>
                  {hasSecurityPassword
                    ? 'The system can be unlocked with any active password.'
                    : t.noPasswordSet ??
                    'Create at least one password to prevent unauthorized access.'}
                </p>
              </div>

              <span className="security-status-badge">
                {hasSecurityPassword ? 'Active' : 'Required'}
              </span>
            </article>

            <article
              className={`security-overview-card ${securitySettings.lockOnStart ? 'is-secured' : ''
                }`}
            >
              <span className="security-overview-icon">
                <Shield size={21} />
              </span>

              <div>
                <small>Startup protection</small>

                <strong>
                  {securitySettings.lockOnStart ? 'Enabled' : 'Disabled'}
                </strong>

                <p>
                  Require the security password whenever the application opens.
                </p>
              </div>

              <button
                className={
                  securitySettings.lockOnStart
                    ? 'security-toggle active'
                    : 'security-toggle'
                }
                type="button"
                role="switch"
                aria-checked={Boolean(securitySettings.lockOnStart)}
                disabled={!hasSecurityPassword}
                onClick={() =>
                  updateSecuritySetting(
                    'lockOnStart',
                    !securitySettings.lockOnStart,
                  )
                }
              >
                <span className="security-toggle-track">
                  <span className="security-toggle-thumb" />
                </span>

                <b>
                  {securitySettings.lockOnStart ? 'ON' : 'OFF'}
                </b>
              </button>
            </article>

            <article className="security-overview-card">
              <span className="security-overview-icon">
                <Archive size={21} />
              </span>

              <div>
                <small>Password updated</small>

                <strong>
                  {securitySettings.passwordUpdatedAt
                    ? new Date(
                      securitySettings.passwordUpdatedAt,
                    ).toLocaleDateString()
                    : 'Not available'}
                </strong>

                <p>
                  The date on which the security password was last changed.
                </p>
              </div>
            </article>
          </div>

          <div className="security-content-layout">
            <div className="security-form-column">
              {securityPasswordSlots.map((slot) => {
                const isSet = Boolean(passwordHashes[slot.key])
                const setDraft = setPasswordForm[slot.key]
                const changeDraft = changePasswordForm[slot.key]
                const strength = getPasswordStrength(isSet ? changeDraft.password : setDraft.password)
                const showPassword = showSecurityPasswords[slot.key]

                return (
                  <form
                    className="security-form-card"
                    key={slot.key}
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (isSet) changeSecurityPassword(slot.key)
                      else saveSecurityPassword(slot.key)
                    }}
                  >
                    <header className="security-form-head">
                      <span>{isSet ? <Shield size={20} /> : <Lock size={20} />}</span>
                      <div>
                        <h3>{slot.label}</h3>
                        <p>{isSet ? 'Change or remove this password after entering the current password.' : 'Set an additional password that can unlock the system.'}</p>
                      </div>
                      <em className={isSet ? 'security-slot-state active' : 'security-slot-state'}>{isSet ? 'Set' : 'Empty'}</em>
                    </header>

                    {isSet && (
                      <label>
                        <span>{t.currentPassword ?? 'Current Password'}</span>
                        <div className="security-password-input">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={changeDraft.current}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            onChange={(event) => updateChangePasswordForm(slot.key, 'current', event.target.value)}
                          />
                          <button type="button" aria-label={t.showPassword ?? 'Show password'} onClick={() => setShowSecurityPasswords((current) => ({ ...current, [slot.key]: !current[slot.key] }))}>
                            <Eye size={17} />
                          </button>
                        </div>
                      </label>
                    )}

                    <div className="security-field-grid">
                      <label>
                        <span>{t.newPassword ?? 'New Password'}</span>
                        <div className="security-password-input">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={isSet ? changeDraft.password : setDraft.password}
                            placeholder={isSet ? 'Enter new password' : 'Enter a secure password'}
                            autoComplete="new-password"
                            onChange={(event) => isSet
                              ? updateChangePasswordForm(slot.key, 'password', event.target.value)
                              : updateSetPasswordForm(slot.key, 'password', event.target.value)}
                          />
                          <button type="button" aria-label={t.showPassword ?? 'Show password'} onClick={() => setShowSecurityPasswords((current) => ({ ...current, [slot.key]: !current[slot.key] }))}>
                            <Eye size={17} />
                          </button>
                        </div>
                        <div className={`security-strength ${strength.tone}`}>
                          <div className="security-strength-track">
                            <span style={{ width: `${(strength.score / 5) * 100}%` }} />
                          </div>
                          <b>{strength.label}</b>
                        </div>
                      </label>

                      <label>
                        <span>{t.confirmPassword ?? 'Confirm Password'}</span>
                        <div className="security-password-input">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={isSet ? changeDraft.confirm : setDraft.confirm}
                            placeholder="Enter the password again"
                            autoComplete="new-password"
                            onChange={(event) => isSet
                              ? updateChangePasswordForm(slot.key, 'confirm', event.target.value)
                              : updateSetPasswordForm(slot.key, 'confirm', event.target.value)}
                          />
                          <button type="button" aria-label={t.showPassword ?? 'Show password'} onClick={() => setShowSecurityPasswords((current) => ({ ...current, [slot.key]: !current[slot.key] }))}>
                            <Eye size={17} />
                          </button>
                        </div>
                        {(isSet ? changeDraft.confirm : setDraft.confirm) && (
                          <small className={(isSet ? changeDraft.password === changeDraft.confirm : setDraft.password === setDraft.confirm) ? 'security-match-message success' : 'security-match-message error'}>
                            {(isSet ? changeDraft.password === changeDraft.confirm : setDraft.password === setDraft.confirm) ? 'Passwords match' : 'Passwords do not match'}
                          </small>
                        )}
                      </label>
                    </div>

                    <button
                      className="security-primary-btn"
                      type="submit"
                      disabled={isSet
                        ? (!changeDraft.current || !changeDraft.password || !changeDraft.confirm || changeDraft.password !== changeDraft.confirm)
                        : (!setDraft.password || !setDraft.confirm || setDraft.password !== setDraft.confirm)}
                    >
                      {isSet ? <Shield size={16} /> : <Lock size={16} />}
                      {isSet ? (t.changePassword ?? 'Change Password') : (t.setPassword ?? 'Set Password')}
                    </button>

                    {isSet && (
                      <div className="security-remove-inline">
                        <label>
                          <span>Current password to remove</span>
                          <div className="security-password-input">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={changeDraft.removeCurrent}
                              placeholder="Enter current password"
                              autoComplete="current-password"
                              onChange={(event) => updateChangePasswordForm(slot.key, 'removeCurrent', event.target.value)}
                            />
                            <button type="button" aria-label={t.showPassword ?? 'Show password'} onClick={() => setShowSecurityPasswords((current) => ({ ...current, [slot.key]: !current[slot.key] }))}>
                              <Eye size={17} />
                            </button>
                          </div>
                        </label>
                        <button className="security-remove-btn" type="button" onClick={() => removeSecurityPassword(slot.key)}>
                          <Trash2 size={15} />
                          {t.remove ?? 'Remove'}
                        </button>
                      </div>
                    )}
                  </form>
                )
              })}
            </div>

            <aside className="security-guide-card">
              <div className="security-guide-head">
                <span>
                  <Shield size={20} />
                </span>

                <div>
                  <h3>Security recommendations</h3>

                  <p>
                    Follow these steps to improve your account security.
                  </p>
                </div>
              </div>

              <ul className="security-guide-list">
                <li>
                  <span>1</span>

                  <div>
                    <strong>Use at least 8 characters</strong>
                    <small>
                      Longer passwords are more difficult to guess.
                    </small>
                  </div>
                </li>

                <li>
                  <span>2</span>

                  <div>
                    <strong>Mix letters and numbers</strong>
                    <small>
                      Include uppercase, lowercase, numbers and symbols.
                    </small>
                  </div>
                </li>

                <li>
                  <span>3</span>

                  <div>
                    <strong>Avoid personal information</strong>
                    <small>
                      Do not use names, phone numbers or easy dates.
                    </small>
                  </div>
                </li>

                <li>
                  <span>4</span>

                  <div>
                    <strong>Enable startup protection</strong>
                    <small>
                      Require the password whenever the application opens.
                    </small>
                  </div>
                </li>
              </ul>

              <div className="security-danger-zone">
                <div>
                  <strong>Two password unlock</strong>
                  <span>The login screen accepts Password 1 or Password 2. Change and remove actions require the current password for that slot.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : activeTab === 'forms' ? (
        <section className="settings-card custom-fields-card">
          <div className="settings-card-head custom-fields-head">
            <div>
              <h2>{t.customFormFields ?? 'Custom Form Fields'}</h2>
              <p>{t.customFormFieldsHint ?? 'Add custom fields to module forms'}</p>
            </div>
            <button className="custom-fields-add-btn" type="button" onClick={openCustomFieldModal}>
              <Plus size={16} />
              <span>{t.addField ?? 'Add Field'}</span>
            </button>
          </div>

          <div className="custom-field-module-tabs" role="tablist" aria-label={t.forms ?? 'Forms'}>
            {customFieldModules.map((module) => {
              const ModuleIcon = module.icon
              const isActive = activeCustomFieldModule === module.key

              return (
                <button
                  className={isActive ? 'active' : ''}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  key={module.key}
                  onClick={() => setActiveCustomFieldModule(module.key)}
                >
                  <ModuleIcon size={15} />
                  <span>{t[module.key] ?? module.label}</span>
                </button>
              )
            })}
          </div>

          <div className="custom-field-list">
            {activeCustomFields.length ? activeCustomFields.map((field) => (
              <article className="custom-field-row" key={field.id}>
                <span className="custom-field-type-icon">T</span>
                <div className="custom-field-summary">
                  <strong>{field.label}</strong>
                  <div>
                    <span className="custom-field-type-pill">{customFieldTypeOptions.find((item) => item.value === field.type)?.label ?? field.type}</span>
                    {field.required && <span className="custom-field-required-pill">{t.required ?? 'Required'}</span>}
                    {field.placeholder && <small>{field.placeholder}</small>}
                  </div>
                </div>
                <button className="custom-field-delete-btn" type="button" aria-label={t.delete ?? 'Delete'} onClick={() => deleteCustomField(field.id)}>
                  <Trash2 size={15} />
                </button>
              </article>
            )) : (
              <div className="custom-fields-empty">
                <strong>{t.noCustomFieldsYet ?? 'No custom fields yet'}</strong>
                <span>{t.addCustomFieldsHint ?? 'Add a field to show it at the end of this module form.'}</span>
              </div>
            )}
          </div>
                </section>
      ) : activeTab === 'license' ? (
        <section className="settings-card license-information-card">
          <div className="settings-card-head license-information-head">
            <div>
              <h2>Your License Key</h2>

              <p>
                View the current device, license key and
                validity period of this system.
              </p>
            </div>

            <span
              className={`license-main-status ${
                licenseIsExpired ? 'expired' : 'active'
              }`}
            >
              {licenseIsExpired ? 'Expired' : 'Active'}
            </span>
          </div>

          <div className="license-overview-grid">
            <article className="license-overview-item">
              <span>Current Device ID</span>

              <strong>
                {deviceId || 'Device ID is loading...'}
              </strong>
            </article>

            <article className="license-overview-item">
              <span>License Status</span>

              <strong
                className={
                  licenseIsExpired
                    ? 'license-text-expired'
                    : 'license-text-active'
                }
              >
                {licenseIsExpired ? 'Expired' : 'Active'}
              </strong>
            </article>

            <article className="license-overview-item">
              <span>Installed At</span>

              <strong>
                {formatLicenseDate(licenseInstalledAt)}
              </strong>
            </article>

            <article className="license-overview-item">
              <span>Activated At</span>

              <strong>
                {currentLicense.licenseKey
                  ? formatLicenseDate(
                      licenseActivatedAt,
                    )
                  : 'Trial version'}
              </strong>
            </article>

            <article className="license-overview-item">
              <span>Valid Until</span>

              <strong>
                {formatLicenseDate(licenseExpiresAt)}
              </strong>
            </article>

            <article className="license-overview-item">
              <span>Remaining Time</span>

              <strong>
                {licenseStatus?.expired
                  ? 'Expired'
                  : formatRemainingLicenseTime(
                      licenseStatus?.remainingMs,
                    )}
              </strong>
            </article>
          </div>

          <div className="license-key-display">
            <div>
              <span>License Key</span>

              <small>
                This key belongs to the current device.
              </small>
            </div>

            <code>
              {currentLicense.licenseKey ||
                'No license key has been activated'}
            </code>

            {currentLicense.licenseKey && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      currentLicense.licenseKey,
                    )

                    onNotify?.(
                      'License key copied successfully',
                    )
                  } catch {
                    onNotify?.(
                      'Could not copy license key',
                    )
                  }
                }}
              >
                Copy Key
              </button>
            )}
          </div>

          <div className="license-device-notice">
            <Shield size={20} />

            <div>
              <strong>Device-bound license</strong>

              <p>
                This license is currently connected to
                the Device ID shown above.
              </p>
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
                className={`backup-auto-toggle ${backupSettings.automatic ? 'active' : ''
                  }`}
                type="button"
                role="switch"
                aria-checked={backupSettings.automatic}
                aria-label={`Automatic backup: ${backupSettings.automatic ? 'ON' : 'OFF'
                  }`}
                onClick={() =>
                  updateNestedField(
                    'backupSettings',
                    'automatic',
                    !backupSettings.automatic,
                  )
                }
              >
                <span className="backup-auto-toggle-track">
                  <i />
                </span>

                <b>
                  {backupSettings.automatic ? 'ON' : 'OFF'}
                </b>
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
        <section className="settings-card theme-selection-card">
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
              ].map(([key, label]) => {
                const isEnabled = Boolean(kpiRouting[key])

                return (
                  <div
                    className={`kpi-route-row ${isEnabled ? 'active' : ''
                      }`}
                    key={key}
                  >
                    <div className="kpi-route-content">
                      <strong>{label}</strong>

                      <span>
                        {isEnabled
                          ? (
                            t.walletFlowsAffectKpi ??
                            'Wallet deposits and withdrawals affect this KPI.'
                          )
                          : (
                            t.walletFlowsIgnoredKpi ??
                            'Wallet flows are ignored for this KPI.'
                          )}
                      </span>
                    </div>

                    <button
                      className={`kpi-route-toggle ${isEnabled ? 'active' : ''
                        }`}
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`${label}: ${isEnabled ? 'ON' : 'OFF'
                        }`}
                      onClick={() =>
                        updateNestedField(
                          'kpiRouting',
                          key,
                          !isEnabled,
                        )
                      }
                    >
                      <span className="kpi-route-toggle-track">
                        <i />
                      </span>

                      <b>{isEnabled ? 'ON' : 'OFF'}</b>
                    </button>
                  </div>
                )
              })}
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
      {customFieldModalOpen &&
        createPortal(
          <div className="modal-backdrop custom-field-modal-backdrop" onClick={closeCustomFieldModal}>
            <section className="custom-field-modal" onClick={(event) => event.stopPropagation()}>
              <header className="custom-field-modal-head">
                <h2>{t.addField ?? 'Add Field'} — {t[activeCustomFieldModule] ?? customFieldModules.find((module) => module.key === activeCustomFieldModule)?.label}</h2>
                <button className="custom-field-modal-close" type="button" aria-label={t.close ?? 'Close'} onClick={closeCustomFieldModal}>
                  <X size={16} />
                </button>
              </header>

              <label>
                <span>{t.fieldLabel ?? 'Field Label'} *</span>
                <input
                  autoFocus
                  placeholder="e.g. Warranty Period"
                  value={customFieldDraft.label}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, label: event.target.value }))}
                />
              </label>

              <label>
                <span>{t.placeholder ?? 'Placeholder'}</span>
                <input
                  placeholder="e.g. Enter warranty period"
                  value={customFieldDraft.placeholder}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, placeholder: event.target.value }))}
                />
              </label>

              <label>
                <span>{t.fieldType ?? 'Field Type'}</span>
                <CustomSelect
                  ariaLabel={t.fieldType ?? 'Field Type'}
                  className="custom-field-type-select"
                  menuClassName="custom-field-type-menu"
                  options={customFieldTypeOptions}
                  value={customFieldDraft.type}
                  onChange={(value) => setCustomFieldDraft((current) => ({ ...current, type: value }))}
                />
              </label>

              {customFieldDraft.type === 'dropdown' && (
                <label>
                  <span>{t.dropdownOptions ?? 'Dropdown Options'}</span>
                  <textarea
                    placeholder="One option per line"
                    value={customFieldDraft.options}
                    onChange={(event) => setCustomFieldDraft((current) => ({ ...current, options: event.target.value }))}
                  />
                </label>
              )}

              <label className="custom-field-required-row">
                <span>{t.required ?? 'Required'}</span>
                <button
                  className={`custom-field-switch ${customFieldDraft.required ? 'active' : ''}`}
                  type="button"
                  role="switch"
                  aria-checked={customFieldDraft.required}
                  onClick={() => setCustomFieldDraft((current) => ({ ...current, required: !current.required }))}
                >
                  <i />
                </button>
              </label>

              <footer className="custom-field-modal-actions">
                <button type="button" onClick={closeCustomFieldModal}>{t.cancel ?? 'Cancel'}</button>
                <button type="button" className="primary" onClick={saveCustomField}>{t.addField ?? 'Add Field'}</button>
              </footer>
            </section>
          </div>,
          document.querySelector('.retail-shell') ?? document.body,
        )}
      {userModalOpen &&
        createPortal(
          <div
            className="modal-backdrop settings-user-modal-backdrop"
            onClick={closeUserModal}
          >
            <section
              className="settings-user-modal"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Modal header */}
              <header className="settings-user-modal-header">
                <div className="settings-user-modal-heading">
                  <span className="settings-user-modal-icon">
                    {editingUserId ? 'E' : '+'}
                  </span>

                  <div>
                    <h2>
                      {editingUserId
                        ? (t.editUser ?? 'Edit User')
                        : (t.createNewUser ?? 'Create New User')}
                    </h2>

                    <p>
                      {editingUserId
                        ? 'Update account details and module permissions.'
                        : 'Create a new account and assign module permissions.'}
                    </p>
                  </div>
                </div>

                <button
                  className="settings-user-modal-close"
                  type="button"
                  aria-label={t.close ?? 'Close'}
                  title={t.close ?? 'Close'}
                  onClick={closeUserModal}
                >
                  <X size={15} />
                </button>
              </header>

              {/* Account information */}
              <div className="settings-user-section">
                <div className="settings-user-section-head">
                  <div>
                    <h3>Account Information</h3>
                    <p>Enter the login and display information for this user.</p>
                  </div>

                  <span>Required fields *</span>
                </div>

                <div className="settings-user-form-grid">
                  <label>
                    <span className="settings-user-field-label">
                      {t.username ?? 'Username'}
                      <b>*</b>
                    </span>

                    <input
                      autoFocus
                      autoComplete="username"
                      placeholder="Enter username"
                      value={userForm.username}
                      onChange={(event) =>
                        updateUserField('username', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span className="settings-user-field-label">
                      {t.displayName ?? 'Display Name'}
                      <b>*</b>
                    </span>

                    <input
                      autoComplete="name"
                      placeholder="Enter display name"
                      value={userForm.displayName}
                      onChange={(event) =>
                        updateUserField('displayName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span className="settings-user-field-label">
                      {t.password ?? 'Password'}
                      {!editingUserId && <b>*</b>}
                    </span>

                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        editingUserId
                          ? 'Leave empty to keep current password'
                          : 'Enter password'
                      }
                      value={userForm.password}
                      onChange={(event) =>
                        updateUserField('password', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span className="settings-user-field-label">
                      {t.confirmPassword ?? 'Confirm Password'}
                      {!editingUserId && <b>*</b>}
                    </span>

                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      value={userForm.confirmPassword}
                      onChange={(event) =>
                        updateUserField(
                          'confirmPassword',
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Permissions */}
              <div className="settings-user-section permissions-section">
                <div className="settings-user-section-head">
                  <div>
                    <h3>{t.modulePermissions ?? 'Module Permissions'}</h3>
                    <p>
                      Select which actions this user can perform in each module.
                    </p>
                  </div>
                </div>

                <div className="settings-permissions-table-wrap">
                  <table className="settings-permissions-table">
                    <thead>
                      <tr>
                        <th>{t.modulesAccess ?? 'Module'}</th>
                        <th>{t.createPermission ?? 'Create'}</th>
                        <th>{t.readPermission ?? 'Read'}</th>
                        <th>{t.updatePermission ?? 'Update'}</th>
                        <th>{t.delete ?? 'Delete'}</th>
                        <th>{t.allPermissions ?? 'All'}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {permissionModules.map((module) => {
                        const modulePermissions =
                          userForm.permissions[module.key] ?? {}

                        const allChecked = permissionActions.every(
                          (action) => modulePermissions[action],
                        )

                        return (
                          <tr key={module.key}>
                            <td>
                              <strong>
                                {t[module.key] ?? module.label}
                              </strong>
                            </td>

                            {permissionActions.map((action) => (
                              <td key={action}>
                                <label className="settings-permission-check">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(
                                      modulePermissions[action],
                                    )}
                                    onChange={(event) =>
                                      setModulePermission(
                                        module.key,
                                        action,
                                        event.target.checked,
                                      )
                                    }
                                  />

                                  <span />
                                </label>
                              </td>
                            ))}

                            <td>
                              <label className="settings-permission-check all">
                                <input
                                  type="checkbox"
                                  checked={allChecked}
                                  onChange={(event) =>
                                    setModulePermission(
                                      module.key,
                                      'all',
                                      event.target.checked,
                                    )
                                  }
                                />

                                <span />
                              </label>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <footer className="settings-user-modal-actions">
                <button
                  className="settings-user-cancel-btn"
                  type="button"
                  onClick={closeUserModal}
                >
                  {t.cancel ?? 'Cancel'}
                </button>

                <button
                  className="settings-user-save-btn"
                  type="button"
                  onClick={saveUser}
                >
                  {editingUserId
                    ? (t.saveUserChanges ?? 'Save Changes')
                    : (t.createUser ?? 'Create User')}
                </button>
              </footer>
            </section>
          </div>,
          document.querySelector('.retail-shell') ?? document.body,
        )}
    </div>
  )
}

export default SettingsPage
