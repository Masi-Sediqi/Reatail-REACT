const STORAGE_API = import.meta.env.VITE_STORAGE_API || 'http://127.0.0.1:4178/api/storage'

export const loadJsonStorage = async () => {
  const response = await fetch(STORAGE_API)
  if (!response.ok) throw new Error('Unable to load JSON storage')
  return response.json()
}

export const saveJsonStorage = async (snapshot) => {
  const response = await fetch(STORAGE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  if (!response.ok) throw new Error('Unable to save JSON storage')
  return response.json()
}

export const legacyStorageKeys = [
  'retail-theme-mode',
  'retail-language',
  'retail-color-theme',
  'retail-suppliers',
  'retail-products',
  'retail-customers',
  'retail-expenses',
  'retail-staff-members',
  'retail-sales-bills',
  'retail-godown-entries',
  'retail-bundles',
  'retail-cash-wallet',
  'retail-cash-wallet-entries',
  'retail-recycle-bin',
  'retail-product-categories',
  'retail-expense-categories',
  'retail-base-currency',
  'retail-exchange-rates',
  'retail-print-settings',
  'retail-company-info',
]

export const readLegacyJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const hasLegacyJsonStorage = () => {
  try {
    return legacyStorageKeys.some((key) => window.localStorage.getItem(key) !== null)
  } catch {
    return false
  }
}

export const clearLegacyJsonStorage = () => {
  try {
    legacyStorageKeys.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Local storage may be blocked. JSON storage remains the source of truth.
  }
}
